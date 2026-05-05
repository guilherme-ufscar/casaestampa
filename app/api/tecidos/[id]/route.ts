import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { nome, larguraMaxima, valorMetro, tipo, ativo } = body

  const tecido = await prisma.tecido.update({
    where: { id: params.id },
    data: {
      ...(nome && { nome }),
      ...(larguraMaxima && { larguraMaxima: parseFloat(larguraMaxima) }),
      ...(valorMetro && { valorMetro: parseFloat(valorMetro) }),
      ...(tipo && { tipo }),
      ...(ativo !== undefined && { ativo }),
    },
  })

  return NextResponse.json(tecido)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  await prisma.tecido.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
