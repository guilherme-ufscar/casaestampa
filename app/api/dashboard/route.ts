import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const isAdmin = session.user.role === 'ADMIN'
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const vendedorFilter = isAdmin ? {} : { vendedorId: session.user.id }

  // Métricas por status
  const statusCounts = await prisma.orcamento.groupBy({
    by: ['status'],
    where: vendedorFilter,
    _count: { status: true },
  })
  const byStatus: Record<string, number> = {}
  for (const s of statusCounts) { byStatus[s.status] = s._count.status }

  // Métricas do mês
  const mesFiltro = { ...vendedorFilter, createdAt: { gte: inicioMes } }
  const [totalMes, aprovadosMes] = await Promise.all([
    prisma.orcamento.count({ where: mesFiltro }),
    prisma.orcamento.count({ where: { ...mesFiltro, status: { in: ['aprovado', 'em_producao', 'pronto', 'instalado', 'finalizado'] } } }),
  ])

  // Orçamentos recentes
  const recentes = await prisma.orcamento.findMany({
    where: vendedorFilter,
    include: {
      cliente: { select: { nome: true } },
      vendedor: { select: { nome: true } },
      ambientes: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Instalações agendadas (pronto + instalado)
  const instalacoes = await prisma.orcamento.findMany({
    where: { ...vendedorFilter, status: { in: ['pronto', 'instalado'] } },
    include: { cliente: { select: { nome: true, endereco: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  })

  const base = { byStatus, totalMes, aprovadosMes, recentes, instalacoes }

  if (!isAdmin) return NextResponse.json(base)

  // Métricas financeiras (admin only)
  const orcamentosMes = await prisma.orcamento.findMany({
    where: { createdAt: { gte: inicioMes }, status: { in: ['aprovado', 'em_producao', 'pronto', 'instalado', 'finalizado'] } },
    select: { precoFinalTotal: true },
  })
  const faturamentoMes = orcamentosMes.reduce((s: number, o) => s + Number(o.precoFinalTotal ?? 0), 0)

  const ambientesMes = await prisma.ambienteOrcamento.findMany({
    where: { orcamento: { createdAt: { gte: inicioMes } } },
    select: { custoTotal: true, precoFinalVenda: true },
  })
  const custoTotal = ambientesMes.reduce((s: number, a) => s + Number(a.custoTotal ?? 0), 0)
  const margemMedia = ambientesMes.length > 0
    ? ambientesMes.reduce((s: number, a) => {
        const preco = Number(a.precoFinalVenda ?? 0)
        const custo = Number(a.custoTotal ?? 0)
        return s + (preco > 0 ? (preco - custo) / preco * 100 : 0)
      }, 0) / ambientesMes.length
    : 0

  // Faturamento últimos 6 meses
  const faturamento6Meses = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1)
      const fim = new Date(agora.getFullYear(), agora.getMonth() - (5 - i) + 1, 0, 23, 59, 59)
      return prisma.orcamento.findMany({
        where: { createdAt: { gte: d, lte: fim }, status: { in: ['aprovado', 'em_producao', 'pronto', 'instalado', 'finalizado'] } },
        select: { precoFinalTotal: true },
      }).then(orcs => ({
        mes: d.toLocaleDateString('pt-BR', { month: 'short' }),
        faturamento: orcs.reduce((s: number, o) => s + Number(o.precoFinalTotal ?? 0), 0),
      }))
    })
  )

  // Ranking vendedores do mês
  const vendedores = await prisma.user.findMany({
    where: { role: 'VENDEDOR', ativo: true },
    select: { id: true, nome: true },
  })
  const rankingVendedores = await Promise.all(
    vendedores.map(async v => {
      const orcs = await prisma.orcamento.findMany({
        where: { vendedorId: v.id, createdAt: { gte: inicioMes } },
        select: { precoFinalTotal: true },
      })
      const fat = orcs.reduce((s: number, o) => s + Number(o.precoFinalTotal ?? 0), 0)
      const configs = await prisma.configuracaoCalculo.findUnique({ where: { chave: 'comissao_padrao' } })
      const comissao = fat * (parseFloat(configs?.valor ?? '8') / 100)
      return { id: v.id, nome: v.nome, orcamentos: orcs.length, faturamento: fat, comissao }
    })
  )
  rankingVendedores.sort((a, b) => b.faturamento - a.faturamento)

  return NextResponse.json({
    ...base,
    faturamentoMes,
    custoTotal,
    margemMedia,
    faturamento6Meses,
    rankingVendedores,
  })
}
