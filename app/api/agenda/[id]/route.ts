import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const evento = await prisma.eventoAgenda.update({
    where: { id: params.id },
    data: {
      titulo: body.titulo,
      descricao: body.descricao || null,
      inicio: new Date(body.inicio),
      fim: body.fim ? new Date(body.fim) : null,
      diaInteiro: body.diaInteiro ?? false,
      tipo: body.tipo || 'visita',
      cor: body.cor || '#C9A84C',
      instaladorId: body.instaladorId || null,
    },
    include: {
      usuario: { select: { id: true, nome: true, role: true } },
      instalador: { select: { id: true, nome: true } },
    },
  })

  return NextResponse.json(evento)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const evento = await prisma.eventoAgenda.findUnique({ where: { id: params.id } })
  if (!evento) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Apenas o dono ou admin pode excluir
  if (session.user.role !== 'ADMIN' && evento.usuarioId !== session.user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  await prisma.eventoAgenda.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
