import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { nome, email, senha, role, ativo, comissao, instaladorId, soAgenda } = await req.json()

  // Admin não pode desativar a si mesmo
  if (params.id === session.user.id && ativo === false) {
    return NextResponse.json({ error: 'Você não pode desativar sua própria conta' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (nome) data.nome = nome
  if (email) data.email = email
  if (role) data.role = role
  if (ativo !== undefined) data.ativo = ativo
  if (comissao !== undefined) data.comissao = comissao
  if (senha) data.senha = await bcrypt.hash(senha, 12)
  if (instaladorId !== undefined) data.instaladorId = instaladorId || null
  if (soAgenda !== undefined) data.soAgenda = soAgenda

  const usuario = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, nome: true, email: true, role: true, ativo: true, comissao: true, instaladorId: true, soAgenda: true, createdAt: true },
  })

  return NextResponse.json({ ...usuario, comissao: usuario.comissao ? Number(usuario.comissao) : null })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 })
  }
  await prisma.user.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
