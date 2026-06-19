import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const inicio = searchParams.get('inicio')
  const fim = searchParams.get('fim')
  const usuarioId = searchParams.get('usuarioId')
  const instaladorId = searchParams.get('instaladorId')

  const isAdmin = session.user.role === 'ADMIN'
  const where: Record<string, unknown> = {}

  if (inicio && fim) {
    where.inicio = { gte: new Date(inicio), lte: new Date(fim) }
  }

  if (isAdmin) {
    // Admin pode ver todos ou filtrar por usuário/instalador
    if (usuarioId) where.usuarioId = usuarioId
    if (instaladorId) where.instaladorId = instaladorId
  } else {
    // Vendedor vê os seus eventos + pode filtrar por instalador
    if (instaladorId) {
      where.instaladorId = instaladorId
    } else {
      where.usuarioId = session.user.id
    }
  }

  const eventos = await prisma.eventoAgenda.findMany({
    where,
    include: {
      usuario: { select: { id: true, nome: true, role: true } },
      instalador: { select: { id: true, nome: true } },
    },
    orderBy: { inicio: 'asc' },
  })

  return NextResponse.json(eventos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { titulo, descricao, inicio, fim, diaInteiro, tipo, cor, orcamentoId, instaladorId } = body

  const evento = await prisma.eventoAgenda.create({
    data: {
      titulo,
      descricao: descricao || null,
      inicio: new Date(inicio),
      fim: fim ? new Date(fim) : null,
      diaInteiro: diaInteiro ?? false,
      tipo: tipo || 'visita',
      cor: cor || '#C9A84C',
      usuarioId: session.user.id,
      orcamentoId: orcamentoId || null,
      instaladorId: instaladorId || null,
    },
    include: {
      usuario: { select: { id: true, nome: true, role: true } },
      instalador: { select: { id: true, nome: true } },
    },
  })

  return NextResponse.json(evento, { status: 201 })
}
