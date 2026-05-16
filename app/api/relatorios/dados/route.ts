import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRange, getPrevRange, pct, STATUS_FINANCEIROS, somarPrecoFinal, somarCusto, calcularMargemMedia } from '@/lib/relatorioUtils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const sp = new URL(req.url).searchParams
  const periodo = sp.get('periodo') ?? 'mes'
  const ini = sp.get('dataInicio') ?? undefined
  const fim = sp.get('dataFim') ?? undefined
  const range = getRange(periodo, ini, fim)
  const prev = getPrevRange(periodo, ini, fim)

  const [orcsAtual, ambsAtual, totalAtual, fechadosAtual, orcsPrev, ambsPrev] = await Promise.all([
    prisma.orcamento.findMany({ where: { createdAt: range, status: { in: [...STATUS_FINANCEIROS] } }, select: { precoFinalTotal: true } }),
    prisma.ambienteOrcamento.findMany({ where: { orcamento: { createdAt: range } }, select: { custoTotal: true, precoFinalVenda: true } }),
    prisma.orcamento.count({ where: { createdAt: range } }),
    prisma.orcamento.count({ where: { createdAt: range, status: { in: [...STATUS_FINANCEIROS] } } }),
    prisma.orcamento.findMany({ where: { createdAt: prev, status: { in: [...STATUS_FINANCEIROS] } }, select: { precoFinalTotal: true } }),
    prisma.ambienteOrcamento.findMany({ where: { orcamento: { createdAt: prev } }, select: { custoTotal: true, precoFinalVenda: true } }),
  ])

  const fatAtual = somarPrecoFinal(orcsAtual)
  const custoAtual = somarCusto(ambsAtual)
  const margAtual = calcularMargemMedia(ambsAtual)
  const fatPrev = somarPrecoFinal(orcsPrev)
  const custoPrev = somarCusto(ambsPrev)
  const margPrev = calcularMargemMedia(ambsPrev)

  const now = new Date()
  const faturamentoMensal = await Promise.all(Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const e = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0, 23, 59, 59)
    return Promise.all([
      prisma.orcamento.findMany({ where: { createdAt: { gte: d, lte: e }, status: { in: [...STATUS_FINANCEIROS] } }, select: { precoFinalTotal: true } }),
      prisma.ambienteOrcamento.findMany({ where: { orcamento: { createdAt: { gte: d, lte: e } } }, select: { custoTotal: true, precoFinalVenda: true } }),
    ]).then(([o, a]) => ({ mes: d.toLocaleDateString('pt-BR', { month: 'short' }), mesCompleto: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), faturamento: somarPrecoFinal(o), custo: somarCusto(a), margem: Math.round(calcularMargemMedia(a) * 10) / 10 }))
  }))

  const ambsProd = await prisma.ambienteOrcamento.findMany({ where: { orcamento: { createdAt: range } }, select: { tecido: { select: { tipo: true } } } })
  const prodMap: Record<string, number> = {}
  for (const a of ambsProd) {
    const nome = a.tecido.tipo === 'PRINCIPAL' ? 'Cortina' : 'Blackout'
    prodMap[nome] = (prodMap[nome] ?? 0) + 1
  }
  const totalProd = Object.values(prodMap).reduce((s, v) => s + v, 0)
  const produtosMaisOrcados = Object.entries(prodMap).map(([nome, count]) => ({ nome, count, percentual: totalProd > 0 ? Math.round(count / totalProd * 100) : 0 }))

  const sc = await prisma.orcamento.groupBy({ by: ['status'], where: { createdAt: range }, _count: { status: true } })
  const totalSt = sc.reduce((s, x) => s + x._count.status, 0)
  const orcamentosPorStatus = sc.map(x => ({ status: x.status, count: x._count.status, percentual: totalSt > 0 ? Math.round(x._count.status / totalSt * 100) : 0 }))

  const vendedores = await prisma.user.findMany({ where: { role: 'VENDEDOR', ativo: true }, select: { id: true, nome: true } })
  const cfg = await prisma.configuracaoCalculo.findUnique({ where: { chave: 'comissao_padrao' } })
  const comPct = parseFloat(cfg?.valor ?? '8') / 100
  const rankingVendedores = await Promise.all(vendedores.map(async v => {
    const [total, fechados, orcs] = await Promise.all([
      prisma.orcamento.count({ where: { vendedorId: v.id, createdAt: range } }),
      prisma.orcamento.count({ where: { vendedorId: v.id, createdAt: range, status: { in: [...STATUS_FINANCEIROS] } } }),
      prisma.orcamento.findMany({ where: { vendedorId: v.id, createdAt: range, status: { in: [...STATUS_FINANCEIROS] } }, select: { precoFinalTotal: true } }),
    ])
    const faturamento = somarPrecoFinal(orcs)
    return { id: v.id, nome: v.nome, orcamentos: total, fechados, faturamento, comissao: faturamento * comPct, taxaAprovacao: total > 0 ? Math.round(fechados / total * 100) : 0 }
  }))
  rankingVendedores.sort((a, b) => b.faturamento - a.faturamento)

  return NextResponse.json({
    kpis: {
      faturamentoTotal: fatAtual,
      custoTotal: custoAtual,
      margemMedia: Math.round(margAtual * 10) / 10,
      orcamentosFechados: fechadosAtual,
      totalOrcamentos: totalAtual,
      variacaoFaturamento: pct(fatAtual, fatPrev),
      variacaoCusto: pct(custoAtual, custoPrev),
      variacaoMargem: Math.round((margAtual - margPrev) * 10) / 10,
      conversao: totalAtual > 0 ? Math.round(fechadosAtual / totalAtual * 100) : 0,
    },
    faturamentoMensal,
    produtosMaisOrcados,
    orcamentosPorStatus,
    rankingVendedores,
  })
}
