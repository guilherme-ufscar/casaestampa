const XLSX = require('xlsx')
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

function parseDimensao(dim) {
  if (!dim) return '0.53x10'
  const s = dim.toString().trim().toLowerCase().replace(/\s/g, '')
  if (s.includes('0,53') || s.includes('0.53')) return '0.53x10'
  if (s.includes('0,70') || s.includes('0.70')) return '0.70x10'
  if (s.includes('1,00') || s.includes('1.00') || s.includes('1x')) return '1.00x10'
  // Painéis têm dimensões especiais - tratar como item avulso
  return s.replace(',', '.').replace(/\s*x\s*/i, 'x').replace('m', '').trim()
}

async function main() {
  const wb = XLSX.readFile('alteracoes/tabela.xlsx')
  const papeis = []

  // --- ECO DESIGN ---
  const ecoData = XLSX.utils.sheet_to_json(wb.Sheets['ECO DESIGN'], { header: 1 })
  for (let i = 4; i < ecoData.length; i++) {
    const row = ecoData[i]
    if (!row || !row[0]) continue
    // Coluna esquerda (0-3)
    if (row[0] && row[1] && row[2]) {
      papeis.push({
        album: String(row[0]).trim(),
        referencia: String(row[1]).trim(),
        valorRolo: parseFloat(row[2]),
        dimensao: parseDimensao(row[3]),
        categoria: 'Eco Design',
      })
    }
    // Coluna direita (6-9)
    if (row[6] && row[7] && row[8]) {
      papeis.push({
        album: String(row[6]).trim(),
        referencia: String(row[7]).trim(),
        valorRolo: parseFloat(row[8]),
        dimensao: parseDimensao(row[9]),
        categoria: 'Eco Design',
      })
    }
  }

  // --- SUGESTOES ---
  const sugData = XLSX.utils.sheet_to_json(wb.Sheets['SUGESTOES'], { header: 1 })
  for (let i = 3; i < sugData.length; i++) {
    const row = sugData[i]
    if (!row || !row[0] || !row[1]) continue
    papeis.push({
      album: String(row[0]).trim(),
      referencia: null,
      valorRolo: parseFloat(row[1]),
      dimensao: parseDimensao(row[2]),
      categoria: 'Sugestões',
    })
  }

  // --- DECORE ---
  const decData = XLSX.utils.sheet_to_json(wb.Sheets['DECORE'], { header: 1 })
  for (let i = 4; i < decData.length; i++) {
    const row = decData[i]
    if (!row || !row[0] || !row[1]) continue
    papeis.push({
      album: String(row[0]).trim(),
      referencia: null,
      valorRolo: parseFloat(row[1]),
      dimensao: parseDimensao(row[2]),
      categoria: 'Decore',
    })
  }

  console.log(`Total de papéis a importar: ${papeis.length}`)
  console.log(`  Eco Design: ${papeis.filter(p => p.categoria === 'Eco Design').length}`)
  console.log(`  Sugestões: ${papeis.filter(p => p.categoria === 'Sugestões').length}`)
  console.log(`  Decore: ${papeis.filter(p => p.categoria === 'Decore').length}`)

  // Inserir em lotes
  let count = 0
  for (const p of papeis) {
    if (!p.valorRolo || isNaN(p.valorRolo)) continue
    await prisma.papelParede.create({
      data: {
        album: p.album,
        referencia: p.referencia,
        dimensao: p.dimensao,
        valorRolo: p.valorRolo,
        categoria: p.categoria,
        ativo: true,
      },
    })
    count++
  }

  console.log(`\n✓ ${count} papéis importados com sucesso!`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
