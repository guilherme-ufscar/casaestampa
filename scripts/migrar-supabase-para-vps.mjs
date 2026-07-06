import pg from 'pg'

const SOURCE_URL = process.env.SOURCE_DATABASE_URL
const TARGET_URL = process.env.DATABASE_URL

if (!SOURCE_URL) {
  console.error('SOURCE_DATABASE_URL não definida (deve apontar para o Supabase de produção).')
  process.exit(1)
}
if (!TARGET_URL) {
  console.error('DATABASE_URL não definida (deve apontar para o Postgres do VPS).')
  process.exit(1)
}

const source = new pg.Client({ connectionString: SOURCE_URL, ssl: { rejectUnauthorized: false } })
const target = new pg.Client({
  connectionString: TARGET_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
})

await source.connect()
await target.connect()

// Ordem respeita as FKs (tabelas referenciadas antes das que referenciam).
const TABELAS = [
  'Instalador',
  'User',
  'Cliente',
  'Tecido',
  'TrilhoVarao',
  'ConfiguracaoCalculo',
  'PapelParede',
  'Persiana',
  'AcessorioPersiana',
  'MotorPersiana',
  'ControleRemotoPersiana',
  'ProdutoPiso',
  'FornecedorCadastro',
  'Orcamento',
  'AmbienteOrcamento',
  'FotoOrcamento',
  'AmbientePapelOrcamento',
  'AmbientePersianaOrcamento',
  'AmbientePisoOrcamento',
  'LogHistorico',
  'EventoAgenda',
]

function prepararValor(v) {
  if (v !== null && typeof v === 'object' && !(v instanceof Date)) {
    return JSON.stringify(v)
  }
  return v
}

for (const tabela of TABELAS) {
  const { rows } = await source.query(`SELECT * FROM "${tabela}"`)
  if (rows.length === 0) {
    console.log(`${tabela}: 0 registros na origem`)
    continue
  }

  const colunas = Object.keys(rows[0])
  let criados = 0
  let existentes = 0
  let erros = 0

  for (const row of rows) {
    try {
      const existe = await target.query(`SELECT 1 FROM "${tabela}" WHERE id = $1`, [row.id])
      if (existe.rowCount > 0) {
        existentes++
        continue
      }

      const valores = colunas.map((c) => prepararValor(row[c]))
      const placeholders = colunas.map((_, i) => `$${i + 1}`).join(', ')
      const colunasSql = colunas.map((c) => `"${c}"`).join(', ')

      await target.query(
        `INSERT INTO "${tabela}" (${colunasSql}) VALUES (${placeholders})`,
        valores
      )
      criados++
    } catch (err) {
      erros++
      console.error(`  erro em ${tabela} id=${row.id}: ${err.message}`)
    }
  }

  console.log(`${tabela}: ${criados} criados, ${existentes} já existiam, ${erros} erros`)
}

// Ajusta a sequence do "numero" autoincrement do Orcamento após inserts com valor explícito
await target.query(`
  SELECT setval(pg_get_serial_sequence('"Orcamento"', 'numero'), COALESCE((SELECT MAX(numero) FROM "Orcamento"), 1))
`)

await source.end()
await target.end()

console.log('Migração concluída.')
