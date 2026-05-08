import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const instaladores = await prisma.instalador.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  })
  return NextResponse.json(instaladores)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { nome, telefone } = await req.json()
  if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const instalador = await prisma.instalador.create({
    data: { nome, telefone: telefone ?? null },
  })
  return NextResponse.json(instalador, { status: 201 })
}
