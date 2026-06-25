import XLSX from 'xlsx'
import pg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DATABASE_URL = 'postgresql://postgres.eqouuvhwbcqzerbywvos:CoderMaster20262026@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
await client.connect()

const wb = XLSX.readFile(path.join(__dirname, '..', 'Cadastro de Clientes.xlsx'))
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws)

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

console.log(`Total de clientes únicos a importar: ${clientes.length}`)

let criados = 0
let erros = 0
const now = new Date().toISOString()

for (const c of clientes) {
  try {
    await client.query(
      `INSERT INTO "Cliente" (id, nome, telefone, email, endereco, bairro, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
      [c.id, c.nome, c.telefone, c.email, c.endereco, c.bairro, now]
    )
    criados++
    if (criados % 50 === 0) process.stdout.write(`\r${criados}/${clientes.length} importados...`)
  } catch (err) {
    erros++
    console.error(`\nErro ao inserir "${c.nome}": ${err.message}`)
  }
}

console.log(`\n\nConcluído! ${criados} clientes criados, ${erros} erros.`)
await client.end()
