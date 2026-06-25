import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const usuarios = await prisma.user.findMany({
    select: { id: true, nome: true, email: true, role: true, ativo: true, comissao: true, instaladorId: true, soAgenda: true, createdAt: true },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(usuarios.map(u => ({ ...u, comissao: u.comissao ? Number(u.comissao) : null })))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { nome, email, senha, role, ativo, comissao, instaladorId, soAgenda } = await req.json()
  if (!nome || !email || !senha || !role) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const existe = await prisma.user.findUnique({ where: { email } })
  if (existe) return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })

  const hash = await bcrypt.hash(senha, 12)
  const usuario = await prisma.user.create({
    data: { nome, email, senha: hash, role, ativo: ativo ?? true, comissao: comissao ?? null, instaladorId: instaladorId ?? null, soAgenda: soAgenda ?? false },
    select: { id: true, nome: true, email: true, role: true, ativo: true, comissao: true, instaladorId: true, soAgenda: true, createdAt: true },
  })

  return NextResponse.json({ ...usuario, comissao: usuario.comissao ? Number(usuario.comissao) : null }, { status: 201 })
}
