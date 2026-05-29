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
  const item = await prisma.controleRemotoPersiana.update({
    where: { id: params.id },
    data: {
      ...(body.nome !== undefined ? { nome: body.nome } : {}),
      ...(body.canais !== undefined ? { canais: body.canais ? parseInt(body.canais) : null } : {}),
      ...(body.valor !== undefined ? { valor: parseFloat(body.valor) } : {}),
      ...(body.ativo !== undefined ? { ativo: body.ativo } : {}),
    },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  await prisma.controleRemotoPersiana.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
