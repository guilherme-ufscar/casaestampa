import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listarArquitetos } from '@/lib/arquitetosStore'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const [cliente, arquitetos] = await Promise.all([
    prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        orcamentos: {
          include: { vendedor: { select: { nome: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    listarArquitetos(),
  ])
  if (!cliente) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json({ ...cliente, arquitetosDisponiveis: arquitetos.filter(item => item.ativo) })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { nome, telefone, email, endereco, bairro, arquiteto } = body

  // Geocodificar se endereço mudou
  let lat: number | null | undefined
  let lng: number | null | undefined
  const anterior = await prisma.cliente.findUnique({ where: { id: params.id }, select: { endereco: true } })
  if (endereco && endereco !== anterior?.endereco) {
    const query = [endereco, bairro, 'Brasil'].filter(Boolean).join(', ')
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'CasaEstampa/1.0' },
      })
      const geoData = await geo.json()
      if (geoData?.[0]) { lat = parseFloat(geoData[0].lat); lng = parseFloat(geoData[0].lon) }
    } catch {}
  }

  const cliente = await prisma.cliente.update({
    where: { id: params.id },
    data: { nome, telefone, email, endereco, bairro, arquiteto, ...(lat !== undefined ? { lat, lng } : {}) },
  })

  return NextResponse.json(cliente)
}
