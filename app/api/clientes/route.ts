import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const filtro = searchParams.get('filtro') ?? 'todos'

  const where: Record<string, unknown> = {}

  if (q) {
    where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { telefone: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (filtro === 'com_orcamento') {
    where.orcamentos = { some: { status: { not: 'finalizado' } } }
  } else if (filtro === 'sem_orcamento') {
    where.orcamentos = { none: {} }
  } else if (filtro === 'arquiteto') {
    where.arquiteto = { not: null }
  }

  const clientes = await prisma.cliente.findMany({
    where,
    include: {
      orcamentos: {
        select: { id: true, precoFinalTotal: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(clientes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { nome, telefone, email, endereco, arquiteto } = body

  if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const cliente = await prisma.cliente.create({
    data: { nome, telefone, email, endereco, arquiteto },
  })

  return NextResponse.json(cliente, { status: 201 })
}
