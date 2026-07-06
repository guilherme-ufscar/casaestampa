// Aplica lat/lng já geocodificados no Postgres local do Docker (banco separado,
// populado via import da planilha) aos clientes correspondentes no banco alvo
// (VPS, populado via migração do Supabase) — casando por nome + telefone, já
// que os dois bancos têm ids diferentes para o mesmo cliente.
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const TARGET_URL = process.env.DATABASE_URL
if (!TARGET_URL) {
  console.error('DATABASE_URL não definida.')
  process.exit(1)
}

const target = new pg.Client({
  connectionString: TARGET_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
})
await target.connect()

const csv = fs.readFileSync(path.join(__dirname, 'clientes-geo-local.csv'), 'utf8').trim().split('\n')

let aplicados = 0
let semMatch = 0
let ambiguos = 0
let jaTinha = 0

for (const linha of csv) {
  const [nome, telefone, lat, lng] = linha.split('|')

  const { rows } = await target.query(
    `SELECT id, lat FROM "Cliente" WHERE lower(nome) = lower($1) AND coalesce(telefone, '') = $2`,
    [nome, telefone]
  )

  if (rows.length === 0) {
    semMatch++
    continue
  }
  if (rows.length > 1) {
    ambiguos++
    continue
  }
  if (rows[0].lat !== null) {
    jaTinha++
    continue
  }

  await target.query(`UPDATE "Cliente" SET lat = $1, lng = $2 WHERE id = $3`, [
    parseFloat(lat),
    parseFloat(lng),
    rows[0].id,
  ])
  aplicados++
}

console.log(`Aplicados: ${aplicados}`)
console.log(`Sem correspondência no destino: ${semMatch}`)
console.log(`Correspondência ambígua (nome+telefone repetido): ${ambiguos}`)
console.log(`Já tinham lat: ${jaTinha}`)

await target.end()
