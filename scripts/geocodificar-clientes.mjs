import pg from 'pg'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL não definida.')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
})
await client.connect()

function limparEndereco(endereco) {
  return endereco
    .split(/\b(apto|apt|ap|bloco|blo|bl|casa|sala|cobertura|cob|fundos|loja|cond)\b/i)[0]
    .replace(/[,\s]+$/, '')
    .trim()
}

function limparBairro(bairro) {
  const semComplemento = bairro.split(' - ')[0].trim()
  if (/^jpa$/i.test(semComplemento)) return 'Jacarepaguá'
  return semComplemento.replace(/\bJPA\b/gi, '').trim() || 'Jacarepaguá'
}

function dentroDoRJ(lat, lng) {
  return lat <= -20.5 && lat >= -23.6 && lng <= -40.8 && lng >= -45.1
}

async function buscarNominatim(params) {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ ...params, format: 'json', limit: '1' })}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'CasaEstampa/1.0 (contato@casaestampa.com.br)' }, signal: controller.signal })
    const data = await res.json()
    if (data?.[0]) {
      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)
      if (dentroDoRJ(lat, lng)) return { lat, lng }
    }
  } catch {} finally {
    clearTimeout(timeout)
  }
  return null
}

async function geocodificar(endereco, bairro) {
  const enderecoLimpo = limparEndereco(endereco)
  const resultado = await buscarNominatim({ street: enderecoLimpo, city: 'Rio de Janeiro', state: 'RJ', country: 'Brasil' })
  if (resultado) return resultado

  if (bairro) {
    await new Promise((r) => setTimeout(r, 1100))
    const q = [limparBairro(bairro), 'Rio de Janeiro', 'RJ', 'Brasil'].join(', ')
    return buscarNominatim({ q })
  }
  return null
}

const { rows: clientes } = await client.query(
  `SELECT id, endereco, bairro FROM "Cliente" WHERE endereco IS NOT NULL AND lat IS NULL`
)

console.log(`Total a geocodificar: ${clientes.length}`)

let ok = 0
let falhou = 0
for (const [i, c] of clientes.entries()) {
  const coords = await geocodificar(c.endereco, c.bairro)
  if (coords) {
    await client.query(`UPDATE "Cliente" SET lat = $1, lng = $2 WHERE id = $3`, [coords.lat, coords.lng, c.id])
    ok++
  } else {
    falhou++
    console.log(`  FALHOU: "${c.endereco}" / bairro="${c.bairro ?? ''}"`)
  }
  if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${clientes.length} processados (${ok} ok, ${falhou} falharam)`)
  await new Promise((r) => setTimeout(r, 1100))
}

console.log(`Concluído: ${ok} geocodificados, ${falhou} não encontrados de ${clientes.length}.`)
await client.end()
