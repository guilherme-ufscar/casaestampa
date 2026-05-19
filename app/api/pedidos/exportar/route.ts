import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as XLSX from 'xlsx'

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

  const pedidos = await prisma.orcamento.findMany({
    where,
    include: {
      cliente: { select: { nome: true, telefone: true, email: true } },
      vendedor: { select: { nome: true } },
      ambientes: {
        select: {
          nomeAmbiente: true,
          precoFinalVenda: true,
          tecido: { select: { nome: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const wb = XLSX.utils.book_new()

  const rows = pedidos.map(p => ({
    'Nº': `#${String(p.numero).padStart(4, '0')}`,
    Cliente: p.cliente?.nome ?? '—',
    Vendedor: p.vendedor.nome,
    Ambientes: p.ambientes.length,
    'Valor Total': Number(p.precoFinalTotal ?? 0),
    Status: p.status.replace(/_/g, ' '),
    Data: new Date(p.createdAt).toLocaleDateString('pt-BR'),
  }))

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Pedidos')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="pedidos-casaestampa-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}
