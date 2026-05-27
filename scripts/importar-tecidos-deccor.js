const fs = require('fs')
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function parseLargura(larguraStr) {
  if (!larguraStr) return 3.0
  // Extrair o maior valor numérico
  const matches = larguraStr.match(/(\d+[.,]\d+)/g)
  if (!matches) return 3.0
  const valores = matches.map(m => parseFloat(m.replace(',', '.')))
  return Math.max(...valores)
}

function parsePreco(precoStr) {
  if (!precoStr || precoStr === '-' || precoStr.toLowerCase().includes('consultar') || precoStr.toLowerCase().includes('vender')) return null
  const clean = precoStr.replace('R$', '').replace(/\s/g, '').replace('.', '').replace(',', '.')
  const val = parseFloat(clean)
  return Number.isFinite(val) && val > 0 ? val : null
}

function determinaTipo(nome) {
  const upper = nome.toUpperCase()
  if (upper.includes('BLACK') || upper.includes('CORTA LUZ')) return 'BLACKOUT'
  return 'PRINCIPAL'
}

function isForaDeLinha(nome, preco) {
  if (!preco) return true
  const upper = nome.toUpperCase()
  return upper.includes(' FL ') || upper.includes(' FL/') || upper.includes('- FL') || upper.includes('FORA DE LINHA')
}

async function main() {
  const content = fs.readFileSync('alteracoes/Tabela_Precos_Deccor_2026-05-19.md', 'utf-8')
  const lines = content.split('\n')

  const tecidos = []

  for (const line of lines) {
    // Pular linhas que não são dados de tabela
    if (!line.startsWith('|')) continue
    if (line.includes('Código') || line.includes('---')) continue

    const cols = line.split('|').map(c => c.trim()).filter(Boolean)
    if (cols.length < 4) continue

    const codigo = cols[0]
    const nome = cols[1]
    const larguraStr = cols[2]
    const precoStr = cols[3]

    // Pular travesseiros e itens sem código válido
    if (codigo.startsWith('TR')) continue

    const preco = parsePreco(precoStr)
    const largura = parseLargura(larguraStr)
    const tipo = determinaTipo(nome)
    const fl = isForaDeLinha(nome, preco)

    tecidos.push({
      codigo,
      nome: `${nome}`.trim(),
      larguraMaxima: largura,
      valorMetro: preco,
      tipo,
      ativo: !fl,
      categoria: 'Deccor Casa',
    })
  }

  console.log(`Total de tecidos encontrados: ${tecidos.length}`)
  console.log(`  Com preço (ativos): ${tecidos.filter(t => t.ativo).length}`)
  console.log(`  Fora de linha: ${tecidos.filter(t => !t.ativo).length}`)

  // Buscar tecidos existentes
  const existentes = await prisma.tecido.findMany({ where: { categoria: 'Deccor Casa' } })
  const existentesPorNome = new Map(existentes.map(t => [t.nome.trim().toUpperCase(), t]))

  let criados = 0
  let atualizados = 0
  let ignorados = 0

  for (const t of tecidos) {
    const nomeKey = t.nome.toUpperCase()
    const existente = existentesPorNome.get(nomeKey)

    if (existente) {
      // Atualizar preço e status
      const updates = {}
      if (t.valorMetro && Number(existente.valorMetro) !== t.valorMetro) {
        updates.valorMetro = t.valorMetro
      }
      if (existente.ativo !== t.ativo) {
        updates.ativo = t.ativo
      }
      if (Object.keys(updates).length > 0) {
        await prisma.tecido.update({ where: { id: existente.id }, data: updates })
        atualizados++
      } else {
        ignorados++
      }
    } else {
      // Criar novo — só se tem preço ou é relevante
      if (t.valorMetro || !t.ativo) {
        await prisma.tecido.create({
          data: {
            nome: t.nome,
            larguraMaxima: t.larguraMaxima,
            valorMetro: t.valorMetro || 0,
            tipo: t.tipo,
            ativo: t.ativo,
            categoria: 'Deccor Casa',
          },
        })
        criados++
      } else {
        ignorados++
      }
    }
  }

  console.log(`\n✓ Resultado:`)
  console.log(`  Criados: ${criados}`)
  console.log(`  Atualizados: ${atualizados}`)
  console.log(`  Sem alteração: ${ignorados}`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
