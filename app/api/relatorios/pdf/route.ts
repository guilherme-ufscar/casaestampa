import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { renderToBuffer } from "@react-pdf/renderer"
import RelatorioPDFDoc from "@/lib/RelatorioPDFDoc"
import { StatusOrcamento } from "@prisma/client"

function getRange(periodo: string, ini?: string, fim?: string) {
  const now = new Date()
  if (periodo === "mes") return { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
  if (periodo === "3meses") { const d = new Date(now); d.setMonth(d.getMonth() - 3); return { gte: d } }
  if (periodo === "ano") return { gte: new Date(now.getFullYear(), 0, 1) }
  if (periodo === "personalizado" && ini && fim) return { gte: new Date(ini), lte: new Date(fim + "T23:59:59") }
  return { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
}

const APROVADOS: StatusOrcamento[] = ["aprovado", "em_producao", "pronto", "instalado", "finalizado"]

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  const sp = new URL(req.url).searchParams
  const periodo = sp.get("periodo") ?? "mes"
  const ini = sp.get("dataInicio") ?? undefined
  const fim = sp.get("dataFim") ?? undefined
  const range = getRange(periodo, ini, fim)

  const [orcamentos, vendedores, cfg] = await Promise.all([
    prisma.orcamento.findMany({
      where: { createdAt: range },
      include: {
        cliente: { select: { nome: true } },
        vendedor: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ where: { role: "VENDEDOR", ativo: true }, select: { id: true, nome: true } }),
    prisma.configuracaoCalculo.findUnique({ where: { chave: "comissao_padrao" } }),
  ])

  const comPct = parseFloat(cfg?.valor ?? "8") / 100
  const fat = orcamentos.filter(o => APROVADOS.includes(o.status)).reduce((s: number, o) => s + Number(o.precoFinalTotal ?? 0), 0)
  const fechados = orcamentos.filter(o => APROVADOS.includes(o.status)).length

  const rankingVendedores = vendedores.map(v => {
    const orcs = orcamentos.filter(o => o.vendedor.id === v.id && APROVADOS.includes(o.status))
    const total = orcamentos.filter(o => o.vendedor.id === v.id).length
    const f = orcs.reduce((s: number, o) => s + Number(o.precoFinalTotal ?? 0), 0)
    return { nome: v.nome, orcamentos: total, fechados: orcs.length, faturamento: f, comissao: f * comPct, taxaAprovacao: total > 0 ? Math.round(orcs.length / total * 100) : 0 }
  }).sort((a, b) => b.faturamento - a.faturamento)

  const periodoLabel = periodo === "mes" ? "Este Mes" : periodo === "3meses" ? "Ultimos 3 Meses" : periodo === "ano" ? "Este Ano" : `${ini} a ${fim}`

  const props = {
    periodo: periodoLabel,
    faturamentoTotal: fat,
    totalOrcamentos: orcamentos.length,
    fechados,
    conversao: orcamentos.length > 0 ? Math.round(fechados / orcamentos.length * 100) : 0,
    rankingVendedores,
    orcamentos: orcamentos.map(o => ({
      numero: o.numero,
      cliente: o.cliente?.nome ?? "",
      vendedor: o.vendedor.nome,
      status: o.status,
      valor: Number(o.precoFinalTotal ?? 0),
      data: new Date(o.createdAt).toLocaleDateString("pt-BR"),
    })),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = RelatorioPDFDoc(props) as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buf = await renderToBuffer(doc as any)
  const uint8 = new Uint8Array(buf)

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-casaestampa-${new Date().toISOString().slice(0,10)}.pdf"`,
    },
  })
}
