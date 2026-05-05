import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const trilhos = await prisma.trilhoVarao.findMany({ orderBy: { nome: 'asc' } })
  return NextResponse.json(trilhos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { nome, valorUnitario, ativo } = body

  if (!nome || !valorUnitario) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const trilho = await prisma.trilhoVarao.create({
    data: { nome, valorUnitario: parseFloat(valorUnitario), ativo: ativo ?? true },
  })

  return NextResponse.json(trilho, { status: 201 })
}
