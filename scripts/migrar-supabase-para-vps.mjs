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

// Tabelas com chave alternativa única (além do id) que já pode ter sido
// populada pelo seed do docker-compose com um id diferente do de produção.
// Nesse caso reaproveitamos o id já existente no destino em vez de tentar
// inserir de novo (o que violaria a constraint única).
const CHAVE_ALTERNATIVA = {
  User: 'email',
  ConfiguracaoCalculo: 'chave',
}

// Colunas de FK que apontam para "User" e precisam ser remapeadas quando o
// id de origem foi trocado pelo id já existente no destino (ver acima).
const FK_USER = {
  Orcamento: ['vendedorId'],
  LogHistorico: ['usuarioId'],
  EventoAgenda: ['usuarioId'],
}

const remapUser = new Map()

function prepararValor(v) {
  if (v !== null && typeof v === 'object' && !(v instanceof Date)) {
    return JSON.stringify(v)
  }
  return v
}

for (const tabela of TABELAS) {
  let rows
  try {
    ;({ rows } = await source.query(`SELECT * FROM "${tabela}"`))
  } catch (err) {
    console.log(`${tabela}: não existe na origem, pulando (${err.message})`)
    continue
  }
  if (rows.length === 0) {
    console.log(`${tabela}: 0 registros na origem`)
    continue
  }

  const colunas = Object.keys(rows[0])
  const chaveAlt = CHAVE_ALTERNATIVA[tabela]
  const fkUserCols = FK_USER[tabela] ?? []
  let criados = 0
  let existentes = 0
  let erros = 0

  for (const row of rows) {
    try {
      const existePorId = await target.query(`SELECT 1 FROM "${tabela}" WHERE id = $1`, [row.id])
      if (existePorId.rowCount > 0) {
        if (tabela === 'User') remapUser.set(row.id, row.id)
        existentes++
        continue
      }

      if (chaveAlt) {
        const existePorChave = await target.query(
          `SELECT id FROM "${tabela}" WHERE "${chaveAlt}" = $1`,
          [row[chaveAlt]]
        )
        if (existePorChave.rowCount > 0) {
          if (tabela === 'User') remapUser.set(row.id, existePorChave.rows[0].id)
          existentes++
          continue
        }
      }

      for (const col of fkUserCols) {
        if (row[col] && remapUser.has(row[col])) row[col] = remapUser.get(row[col])
      }

      const valores = colunas.map((c) => prepararValor(row[c]))
      const placeholders = colunas.map((_, i) => `$${i + 1}`).join(', ')
      const colunasSql = colunas.map((c) => `"${c}"`).join(', ')

      await target.query(
        `INSERT INTO "${tabela}" (${colunasSql}) VALUES (${placeholders})`,
        valores
      )
      if (tabela === 'User') remapUser.set(row.id, row.id)
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
