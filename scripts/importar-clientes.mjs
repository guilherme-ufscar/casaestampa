import XLSX from 'xlsx'
import pg from 'pg'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const arquivo = process.env.CLIENTES_XLSX || 'Cadastro de Clientes (1).xlsx'
const caminhoArquivo = path.join(__dirname, '..', arquivo)

if (!fs.existsSync(caminhoArquivo)) {
  console.log(`Planilha "${arquivo}" não encontrada — pulando import de clientes.`)
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

const vistos = new Set()
const clientes = []

for (const row of rows) {
  const nome = norm(row['NOME'])
  if (!nome) continue

  const telefone = norm(row['TELEFONE'])
  const chave = `${nome.toLowerCase()}|${telefone ?? ''}`
  if (vistos.has(chave)) continue
  vistos.add(chave)

  clientes.push({
    id: randomUUID(),
    nome,
    telefone,
    email: norm(row['EMAIL']),
    endereco: norm(row['ENDEREÇO']),
    bairro: norm(row['BAIRRO']),
  })
}

console.log(`Total de clientes únicos na planilha: ${clientes.length}`)

let criados = 0
let existentes = 0
let erros = 0
const now = new Date().toISOString()

for (const c of clientes) {
  try {
    const existe = await client.query(
      `SELECT 1 FROM "Cliente" WHERE lower(nome) = lower($1) AND coalesce(telefone, '') = coalesce($2, '') LIMIT 1`,
      [c.nome, c.telefone]
    )
    if (existe.rowCount > 0) {
      existentes++
      continue
    }

    await client.query(
      `INSERT INTO "Cliente" (id, nome, telefone, email, endereco, bairro, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
      [c.id, c.nome, c.telefone, c.email, c.endereco, c.bairro, now]
    )
    criados++
  } catch (err) {
    erros++
    console.error(`Erro ao inserir "${c.nome}": ${err.message}`)
  }
}

console.log(`Concluído! ${criados} clientes criados, ${existentes} já existiam, ${erros} erros.`)
await client.end()
