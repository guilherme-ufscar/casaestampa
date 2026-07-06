import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { geocodificar } from '@/lib/geocodificar'

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
