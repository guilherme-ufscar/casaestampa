import XLSX from 'xlsx'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const arquivo = process.env.CLIENTES_XLSX || 'Cadastro de Clientes (1).xlsx'
const caminhoArquivo = path.join(__dirname, '..', arquivo)

if (!fs.existsSync(caminhoArquivo)) {
  console.log(`Planilha "${arquivo}" não encontrada — pulando import de orçamentos históricos.`)
  process.exit(0)
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL não definida.')
  process.exit(1)
}
const useSSL = process.env.DATABASE_SSL !== 'false'

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: useSSL ? { rejectUnauthorized: false } : false })
await client.connect()

const wb = XLSX.readFile(caminhoArquivo)
const ws = wb.Sheets['Por Número'] ?? wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { defval: null })

function norm(v) {
  if (!v) return null
  const s = String(v).trim()
  return s || null
}

function semAcento(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function excelDateToJS(v) {
  if (v == null) return null
  if (typeof v === 'number') {
    const parsed = XLSX.SSF.parse_date_code(v)
    if (!parsed) return null
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d))
  }
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function numeroVenda(v) {
  if (v == null || v === '') return null
  const n = Number(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'))
  return Number.isNaN(n) ? null : n
}

// Categoria de serviço normalizada, usada para casar/agrupar instaladores por produto
// (o cadastro atual de Instalador é por produto: "Gabriel Papel", "Jorge Persianas" etc.)
function categoriaServico(servico) {
  if (!servico) return null
  const s = semAcento(servico)
  if (s.includes('papel')) return 'Papel'
  if (s.includes('persiana')) return 'Persiana'
  if (s.includes('piso')) return 'Piso'
  if (s.includes('cortina')) return 'Cortina'
  return null
}

// Pega o primeiro nome de um campo que pode ter múltiplos instaladores
// (ex: "gabriel e jorge", "alan/felix/quaresma", "Brendo / elias").
function primeiroNome(texto) {
  const partes = texto.split(/[\/,&]| e | com /i).map(p => p.trim()).filter(Boolean)
  return partes[0] ?? texto.trim()
}

function tituloCaso(nome) {
  return nome
    .split(' ')
    .map(p => (p.length > 2 ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p.toLowerCase()))
    .join(' ')
}

const IGNORAR_INSTALADOR = new Set([
  'nao teve', 'sem instalacao', 'independente', 'instalacao propria', 'particular', 'sedex mt', 'acacio frete',
])

console.log(`Total de linhas na planilha: ${rows.length}`)

// --- Instaladores existentes ---
const instaladoresRes = await client.query(`SELECT id, nome FROM "Instalador"`)
const instaladores = instaladoresRes.rows // { id, nome }
const instaladorCache = new Map() // chave normalizada "nome|categoria" -> id

function encontrarInstaladorExistente(primeiroNomeNorm, categoria) {
  return instaladores.find(i => {
    const nomeNorm = semAcento(i.nome)
    return nomeNorm.includes(primeiroNomeNorm) && (!categoria || nomeNorm.includes(semAcento(categoria)))
  })
}

async function resolverInstalador(textoOriginal, servico) {
  if (!textoOriginal) return null
  const primeiro = primeiroNome(textoOriginal)
  const primeiroNorm = semAcento(primeiro)
  if (IGNORAR_INSTALADOR.has(primeiroNorm)) return null

  const categoria = categoriaServico(servico)
  const chaveCache = `${primeiroNorm}|${categoria ?? ''}`
  if (instaladorCache.has(chaveCache)) return instaladorCache.get(chaveCache)

  const existente = encontrarInstaladorExistente(primeiroNorm, categoria)
  if (existente) {
    instaladorCache.set(chaveCache, existente.id)
    return existente.id
  }

  const nomeNovo = categoria ? `${tituloCaso(primeiro)} ${categoria}` : tituloCaso(primeiro)
  const jaExiste = instaladores.find(i => semAcento(i.nome) === semAcento(nomeNovo))
  if (jaExiste) {
    instaladorCache.set(chaveCache, jaExiste.id)
    return jaExiste.id
  }

  const id = randomUUID()
  await client.query(
    `INSERT INTO "Instalador" (id, nome, ativo) VALUES ($1, $2, true)`,
    [id, nomeNovo]
  )
  instaladores.push({ id, nome: nomeNovo })
  instaladorCache.set(chaveCache, id)
  return id
}

// --- Vendedor: só "claudia" bate com usuário real; resto vai para conta fallback ---
const claudiaRes = await client.query(`SELECT id, nome FROM "User" WHERE lower(nome) LIKE '%claudia%' LIMIT 1`)
const claudiaId = claudiaRes.rows[0]?.id ?? null

let historicoUserId
const historicoUserRes = await client.query(`SELECT id FROM "User" WHERE email = $1`, ['historico@casaestampa.local'])
if (historicoUserRes.rowCount > 0) {
  historicoUserId = historicoUserRes.rows[0].id
} else {
  historicoUserId = randomUUID()
  const senhaHash = await bcrypt.hash(randomUUID(), 12)
  await client.query(
    `INSERT INTO "User" (id, nome, email, senha, role, ativo, "createdAt")
     VALUES ($1, $2, $3, $4, 'VENDEDOR', false, now())`,
    [historicoUserId, 'Vendas Anteriores (Histórico)', 'historico@casaestampa.local', senhaHash]
  )
}

function resolverVendedor(nomeOriginal) {
  if (nomeOriginal && claudiaId && semAcento(nomeOriginal).includes('claud')) return claudiaId
  return historicoUserId
}

console.log(`Vendedor fallback: ${historicoUserId}${claudiaId ? ` | Claudia: ${claudiaId}` : ''}`)

let criados = 0
let semCliente = 0
let erros = 0

for (const row of rows) {
  const nome = norm(row['NOME'])
  if (!nome) continue
  const telefone = norm(row['TELEFONE'])

  try {
    const clienteRes = await client.query(
      `SELECT id FROM "Cliente" WHERE lower(nome) = lower($1) AND coalesce(telefone, '') = coalesce($2, '') LIMIT 1`,
      [nome, telefone]
    )
    if (clienteRes.rowCount === 0) {
      semCliente++
      continue
    }
    const clienteId = clienteRes.rows[0].id

    const servico = norm(row['SERVIÇO'])
    const instaladorTexto = norm(row['INSTALADOR'])
    const vendedorTexto = norm(row['VENDEDOR'])
    const data = excelDateToJS(row['DATA']) ?? new Date()

    const instaladorId = await resolverInstalador(instaladorTexto, servico)
    const vendedorId = resolverVendedor(vendedorTexto)

    await client.query(
      `INSERT INTO "Orcamento"
        (id, "clienteId", "vendedorId", status, "precoFinalTotal", "createdAt", "updatedAt",
         "origemHistorico", "numeroHistorico", "servicoHistorico", "descricaoHistorico",
         "instaladorId", "instaladorNomeOriginal", "vendedorNomeOriginal", "indicacaoHistorica")
       VALUES ($1, $2, $3, 'finalizado', $4, $5, $5, true, $6, $7, $8, $9, $10, $11, $12)`,
      [
        randomUUID(),
        clienteId,
        vendedorId,
        numeroVenda(row['VENDA']),
        data,
        row['NUMERO'] != null ? Number(row['NUMERO']) : null,
        servico,
        norm(row['DESCRIÇÃO']),
        instaladorId,
        instaladorTexto,
        vendedorTexto,
        norm(row['INDICAÇÃO']),
      ]
    )
    criados++
  } catch (err) {
    erros++
    console.error(`Erro na linha "${nome}" (nº ${row['NUMERO']}): ${err.message}`)
  }
}

await client.query(
  `SELECT setval(pg_get_serial_sequence('"Orcamento"', 'numero'), COALESCE((SELECT MAX(numero) FROM "Orcamento"), 1))`
)

console.log(`Concluído! ${criados} orçamentos fantasmas criados, ${semCliente} sem cliente correspondente, ${erros} erros.`)
console.log(`Instaladores no total após import: ${instaladores.length}`)
await client.end()
