import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Remove complementos (apto, bloco, casa, sala...) que confundem o geocodificador
function limparEndereco(endereco: string): string {
  return endereco
    .split(/\b(apto|apt|ap|bloco|blo|bl|casa|sala|cobertura|cob|fundos|loja|cond)\b/i)[0]
    .replace(/[,\s]+$/, '')
    .trim()
}

// O campo "bairro" às vezes vem como "JPA - Cidade Jardim" (código interno de
// região + nome de condomínio) em vez do nome real do bairro — extrai só a
// parte reconhecível pelo geocodificador
function limparBairro(bairro: string): string {
  const semComplemento = bairro.split(' - ')[0].trim()
  if (/^jpa$/i.test(semComplemento)) return 'Jacarepaguá'
  return semComplemento.replace(/\bJPA\b/gi, '').trim() || 'Jacarepaguá'
}

// Bounding box aproximado do estado do Rio de Janeiro — descarta matches fora
// dele (rua homônima em outro estado, comum com nomes como "Av Rio Branco")
function dentroDoRJ(lat: number, lng: number): boolean {
  return lat <= -20.5 && lat >= -23.6 && lng <= -40.8 && lng >= -45.1
}

async function buscarNominatim(params: Record<string, string>): Promise<{ lat: number; lng: number } | null> {
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

async function geocodificar(endereco: string, bairro?: string | null): Promise<{ lat: number; lng: number } | null> {
  const enderecoLimpo = limparEndereco(endereco)
  const cidade = 'Rio de Janeiro'
  const estado = 'RJ'

  // Tenta com o endereço completo (rua + número), busca estruturada — mais
  // precisa que texto livre para nomes de rua comuns em várias cidades
  const resultado = await buscarNominatim({ street: enderecoLimpo, city: cidade, state: estado, country: 'Brasil' })
  if (resultado) return resultado

  // Fallback: pino aproximado pelo bairro, se o endereço exato não for encontrado.
  // Bairros são melhor resolvidos com busca livre (q=) do que com o parâmetro
  // estruturado "street", que é voltado para nomes de rua.
  if (bairro) {
    await new Promise(r => setTimeout(r, 1100))
    const q = [limparBairro(bairro), cidade, estado, 'Brasil'].join(', ')
    return buscarNominatim({ q })
  }

  return null
}

// Geocodifica um cliente específico
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { clienteId } = await req.json()

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } })
  if (!cliente) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  if (!cliente.endereco) return NextResponse.json({ error: 'Sem endereço' }, { status: 400 })

  const coords = await geocodificar(cliente.endereco, cliente.bairro)
  if (!coords) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.cliente.update({ where: { id: clienteId }, data: coords })
  return NextResponse.json(coords)
}

// Geocodifica todos os clientes sem coordenadas
export async function PUT() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const clientes = await prisma.cliente.findMany({
    where: { endereco: { not: null }, lat: null },
    select: { id: true, endereco: true, bairro: true },
  })

  let ok = 0
  for (const c of clientes) {
    const coords = await geocodificar(c.endereco!, c.bairro)
    if (coords) {
      await prisma.cliente.update({ where: { id: c.id }, data: coords })
      ok++
    }
    await new Promise(r => setTimeout(r, 1100)) // Nominatim: max 1 req/s
  }

  return NextResponse.json({ total: clientes.length, geocodificados: ok })
}
