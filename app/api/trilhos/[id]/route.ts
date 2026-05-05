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
  const { nome, valorUnitario, ativo } = body

  const trilho = await prisma.trilhoVarao.update({
    where: { id: params.id },
    data: {
      ...(nome && { nome }),
      ...(valorUnitario && { valorUnitario: parseFloat(valorUnitario) }),
      ...(ativo !== undefined && { ativo }),
    },
  })

  return NextResponse.json(trilho)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  await prisma.trilhoVarao.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
