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
  const { album, referencia, dimensao, valorRolo, ativo } = body

  const papel = await prisma.papelParede.update({
    where: { id: params.id },
    data: {
      ...(album && { album }),
      ...(referencia && { referencia }),
      ...(dimensao && { dimensao }),
      ...(valorRolo && { valorRolo: parseFloat(valorRolo) }),
      ...(ativo !== undefined && { ativo }),
    },
  })

  return NextResponse.json(papel)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  await prisma.papelParede.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
