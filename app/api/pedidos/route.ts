import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const vendedorId = searchParams.get('vendedor') ?? ''
  const periodo = searchParams.get('periodo') ?? ''
  const dataInicio = searchParams.get('dataInicio') ?? ''
  const dataFim = searchParams.get('dataFim') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '10')
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (session.user.role === 'VENDEDOR') {
    where.vendedorId = session.user.id
  } else if (vendedorId) {
    where.vendedorId = vendedorId
  }

  if (status) where.status = status

  if (q) {
    where.OR = [
      { cliente: { nome: { contains: q, mode: 'insensitive' } } },
      { numero: isNaN(parseInt(q)) ? undefined : parseInt(q) },
    ].filter(Boolean)
  }

  // Período
  const agora = new Date()
  if (periodo === 'mes') {
    where.createdAt = { gte: new Date(agora.getFullYear(), agora.getMonth(), 1) }
  } else if (periodo === '3meses') {
    const d = new Date(agora); d.setMonth(d.getMonth() - 3)
    where.createdAt = { gte: d }
  } else if (periodo === 'ano') {
    where.createdAt = { gte: new Date(agora.getFullYear(), 0, 1) }
  } else if (periodo === 'personalizado' && dataInicio && dataFim) {
    where.createdAt = { gte: new Date(dataInicio), lte: new Date(dataFim + 'T23:59:59') }
  }

  const [pedidos, total] = await Promise.all([
    prisma.orcamento.findMany({
      where,
      include: {
        cliente: { select: { nome: true, telefone: true, endereco: true, email: true } },
        vendedor: { select: { id: true, nome: true } },
        ambientes: { select: { id: true, nomeAmbiente: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.orcamento.count({ where }),
  ])

  // Contagem por status
  const statusCounts = await prisma.orcamento.groupBy({
    by: ['status'],
    where: session.user.role === 'VENDEDOR' ? { vendedorId: session.user.id } : {},
    _count: { status: true },
  })

  return NextResponse.json({
    pedidos,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s._count.status }), {} as Record<string, number>),
  })
}
