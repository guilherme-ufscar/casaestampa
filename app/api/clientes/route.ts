import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listarArquitetos } from '@/lib/arquitetosStore'
import { geocodificar } from '@/lib/geocodificar'

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

  const [clientes, arquitetos] = await Promise.all([
    prisma.cliente.findMany({
      where,
      include: {
        orcamentos: {
          select: {
            id: true,
            precoFinalTotal: true,
            status: true,
            createdAt: true,
            origemHistorico: true,
            servicoHistorico: true,
            descricaoHistorico: true,
            indicacaoHistorica: true,
            instaladorNomeOriginal: true,
            instalador: { select: { nome: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { nome: 'asc' },
    }),
    listarArquitetos(),
  ])

  const arquitetosAtivos = arquitetos.filter(item => item.ativo)
  return NextResponse.json(clientes.map(cliente => ({
    ...cliente,
    arquitetosDisponiveis: arquitetosAtivos,
  })))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { nome, telefone, email, endereco, bairro, arquiteto } = body

  if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const coords = endereco ? await geocodificar(endereco, bairro) : null

  const cliente = await prisma.cliente.create({
    data: { nome, telefone, email, endereco, bairro, arquiteto, ...(coords ?? {}) },
  })

  return NextResponse.json(cliente, { status: 201 })
}
