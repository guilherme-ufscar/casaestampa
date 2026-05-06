import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { StatusOrcamento } from "@prisma/client"

const APROVADOS: StatusOrcamento[] = ["aprovado", "em_producao", "pronto", "instalado", "finalizado"]

function getRange(periodo: string, ini?: string, fim?: string) {
  const now = new Date()
  if (periodo === "mes") return { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
  if (periodo === "3meses") { const d = new Date(now); d.setMonth(d.getMonth() - 3); return { gte: d } }
  if (periodo === "ano") return { gte: new Date(now.getFullYear(), 0, 1) }
  if (periodo === "personalizado" && ini && fim) return { gte: new Date(ini), lte: new Date(fim + "T23:59:59") }
  return { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
}

function getPrevRange(periodo: string, ini?: string, fim?: string) {
  const now = new Date()
  if (periodo === "mes") return { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1), lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) }
  if (periodo === "3meses") { const a = new Date(now); a.setMonth(a.getMonth() - 6); const b = new Date(now); b.setMonth(b.getMonth() - 3); return { gte: a, lte: b } }
  if (periodo === "ano") return { gte: new Date(now.getFullYear() - 1, 0, 1), lte: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59) }
  if (periodo === "personalizado" && ini && fim) { const s = new Date(ini); const e = new Date(fim); const d = e.getTime() - s.getTime(); return { gte: new Date(s.getTime() - d), lte: new Date(s.getTime() - 1) } }
  return { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1), lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) }
}

function pct(a: number, b: number) { if (b === 0) return a > 0 ? 100 : 0; return Math.round(((a - b) / b) * 100 * 10) / 10 }
const fatFn = (orcs: { precoFinalTotal: unknown }[]) => orcs.reduce((s: number, o) => s + Number(o.precoFinalTotal ?? 0), 0)
const custoFn = (ambs: { custoTotal: unknown }[]) => ambs.reduce((s: number, a) => s + Number(a.custoTotal ?? 0), 0)
const margemFn = (ambs: { custoTotal: unknown; precoFinalVenda: unknown }[]) => ambs.length === 0 ? 0 : ambs.reduce((s: number, a) => { const p = Number(a.precoFinalVenda ?? 0); const c = Number(a.custoTotal ?? 0); return s + (p > 0 ? (p - c) / p * 100 : 0) }, 0) / ambs.length

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  const sp = new URL(req.url).searchParams
  const periodo = sp.get("periodo") ?? "mes"
  const ini = sp.get("dataInicio") ?? undefined
  const fim = sp.get("dataFim") ?? undefined
  const range = getRange(periodo, ini, fim)
  const prev = getPrevRange(periodo, ini, fim)

  const [orcsAtual, ambsAtual, totalAtual, fechadosAtual, orcsPrev, ambsPrev] = await Promise.all([
    prisma.orcamento.findMany({ where: { createdAt: range, status: { in: APROVADOS } }, select: { precoFinalTotal: true } }),
    prisma.ambienteOrcamento.findMany({ where: { orcamento: { createdAt: range } }, select: { custoTotal: true, precoFinalVenda: true } }),
    prisma.orcamento.count({ where: { createdAt: range } }),
    prisma.orcamento.count({ where: { createdAt: range, status: { in: APROVADOS } } }),
    prisma.orcamento.findMany({ where: { createdAt: prev, status: { in: APROVADOS } }, select: { precoFinalTotal: true } }),
    prisma.ambienteOrcamento.findMany({ where: { orcamento: { createdAt: prev } }, select: { custoTotal: true, precoFinalVenda: true } }),
  ])

  const fatAtual = fatFn(orcsAtual); const custoAtual = custoFn(ambsAtual); const margAtual = margemFn(ambsAtual)
  const fatPrev = fatFn(orcsPrev); const custoPrev = custoFn(ambsPrev); const margPrev = margemFn(ambsPrev)

  const now = new Date()
  const faturamentoMensal = await Promise.all(Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const e = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0, 23, 59, 59)
    return Promise.all([
      prisma.orcamento.findMany({ where: { createdAt: { gte: d, lte: e }, status: { in: APROVADOS } }, select: { precoFinalTotal: true } }),
      prisma.ambienteOrcamento.findMany({ where: { orcamento: { createdAt: { gte: d, lte: e } } }, select: { custoTotal: true, precoFinalVenda: true } }),
    ]).then(([o, a]) => ({ mes: d.toLocaleDateString("pt-BR", { month: "short" }), mesCompleto: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }), faturamento: fatFn(o), custo: custoFn(a), margem: Math.round(margemFn(a) * 10) / 10 }))
  }))

  const ambsProd = await prisma.ambienteOrcamento.findMany({ where: { orcamento: { createdAt: range } }, select: { tecido: { select: { tipo: true } } } })
  const prodMap: Record<string, number> = {}
  for (const a of ambsProd) { const n = a.tecido.tipo === "PRINCIPAL" ? "Cortina" : "Blackout"; prodMap[n] = (prodMap[n] ?? 0) + 1 }
  const totalProd = Object.values(prodMap).reduce((s: number, v) => s + v, 0)
  const produtosMaisOrcados = Object.entries(prodMap).map(([nome, count]) => ({ nome, count, percentual: totalProd > 0 ? Math.round(count / totalProd * 100) : 0 }))

  const sc = await prisma.orcamento.groupBy({ by: ["status"], where: { createdAt: range }, _count: { status: true } })
  const totalSt = sc.reduce((s: number, x) => s + x._count.status, 0)
  const orcamentosPorStatus = sc.map(x => ({ status: x.status, count: x._count.status, percentual: totalSt > 0 ? Math.round(x._count.status / totalSt * 100) : 0 }))

  const vendedores = await prisma.user.findMany({ where: { role: "VENDEDOR", ativo: true }, select: { id: true, nome: true } })
  const cfg = await prisma.configuracaoCalculo.findUnique({ where: { chave: "comissao_padrao" } })
  const comPct = parseFloat(cfg?.valor ?? "8") / 100
  const rankingVendedores = await Promise.all(vendedores.map(async v => {
    const [total, fechados, orcs] = await Promise.all([
      prisma.orcamento.count({ where: { vendedorId: v.id, createdAt: range } }),
      prisma.orcamento.count({ where: { vendedorId: v.id, createdAt: range, status: { in: APROVADOS } } }),
      prisma.orcamento.findMany({ where: { vendedorId: v.id, createdAt: range, status: { in: APROVADOS } }, select: { precoFinalTotal: true } }),
    ])
    const f = fatFn(orcs)
    return { id: v.id, nome: v.nome, orcamentos: total, fechados, faturamento: f, comissao: f * comPct, taxaAprovacao: total > 0 ? Math.round(fechados / total * 100) : 0 }
  }))
  rankingVendedores.sort((a, b) => b.faturamento - a.faturamento)

  return NextResponse.json({
    kpis: { faturamentoTotal: fatAtual, custoTotal: custoAtual, margemMedia: Math.round(margAtual * 10) / 10, orcamentosFechados: fechadosAtual, totalOrcamentos: totalAtual, variacaoFaturamento: pct(fatAtual, fatPrev), variacaoCusto: pct(custoAtual, custoPrev), variacaoMargem: Math.round((margAtual - margPrev) * 10) / 10, conversao: totalAtual > 0 ? Math.round(fechadosAtual / totalAtual * 100) : 0 },
    faturamentoMensal,
    produtosMaisOrcados,
    orcamentosPorStatus,
    rankingVendedores,
  })
}
