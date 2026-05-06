import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as XLSX from "xlsx"
import { StatusOrcamento } from "@prisma/client"

function getRange(periodo: string, ini?: string, fim?: string) {
  const now = new Date()
  if (periodo === "mes") return { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
  if (periodo === "3meses") { const d = new Date(now); d.setMonth(d.getMonth() - 3); return { gte: d } }
  if (periodo === "ano") return { gte: new Date(now.getFullYear(), 0, 1) }
  if (periodo === "personalizado" && ini && fim) return { gte: new Date(ini), lte: new Date(fim + "T23:59:59") }
  return { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  const sp = new URL(req.url).searchParams
  const periodo = sp.get("periodo") ?? "mes"
  const ini = sp.get("dataInicio") ?? undefined
  const fim = sp.get("dataFim") ?? undefined
  const range = getRange(periodo, ini, fim)
  const APROVADOS: StatusOrcamento[] = ["aprovado", "em_producao", "pronto", "instalado", "finalizado"]

  const orcamentos = await prisma.orcamento.findMany({
    where: { createdAt: range },
    include: {
      cliente: { select: { nome: true, telefone: true, email: true } },
      vendedor: { select: { id: true, nome: true } },
      ambientes: { select: { nomeAmbiente: true, custoTotal: true, precoFinalVenda: true, tecido: { select: { nome: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  const wb = XLSX.utils.book_new()

  const resumoData = orcamentos.map(o => ({
    "Numero": `#${String(o.numero).padStart(4, "0")}`,
    "Cliente": o.cliente?.nome ?? "",
    "Vendedor": o.vendedor.nome,
    "Status": o.status,
    "Valor Total": Number(o.precoFinalTotal ?? 0),
    "Data": new Date(o.createdAt).toLocaleDateString("pt-BR"),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumoData), "Resumo")

  const orcData: Record<string, unknown>[] = []
  for (const o of orcamentos) {
    for (const a of o.ambientes) {
      const preco = Number(a.precoFinalVenda ?? 0)
      const custo = Number(a.custoTotal ?? 0)
      orcData.push({
        "Numero": `#${String(o.numero).padStart(4, "0")}`,
        "Cliente": o.cliente?.nome ?? "",
        "Vendedor": o.vendedor.nome,
        "Ambiente": a.nomeAmbiente,
        "Tecido": a.tecido.nome,
        "Custo": custo,
        "Preco Venda": preco,
        "Margem %": preco > 0 ? Math.round((preco - custo) / preco * 100 * 10) / 10 : 0,
        "Status": o.status,
        "Data": new Date(o.createdAt).toLocaleDateString("pt-BR"),
      })
    }
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(orcData), "Orcamentos")

  const vendedores = await prisma.user.findMany({ where: { role: "VENDEDOR", ativo: true }, select: { id: true, nome: true } })
  const cfg = await prisma.configuracaoCalculo.findUnique({ where: { chave: "comissao_padrao" } })
  const comPct = parseFloat(cfg?.valor ?? "8") / 100
  const vendData = vendedores.map(v => {
    const total = orcamentos.filter(o => o.vendedor.id === v.id).length
    const fechados = orcamentos.filter(o => o.vendedor.id === v.id && APROVADOS.includes(o.status)).length
    const fat = orcamentos.filter(o => o.vendedor.id === v.id && APROVADOS.includes(o.status)).reduce((s: number, o) => s + Number(o.precoFinalTotal ?? 0), 0)
    return { "Vendedor": v.nome, "Total Orcamentos": total, "Fechados": fechados, "Taxa Aprovacao %": total > 0 ? Math.round(fechados / total * 100) : 0, "Faturamento": fat, "Comissao": fat * comPct }
  })
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vendData), "Vendedores")

  const sc = await prisma.orcamento.groupBy({ by: ["status"], where: { createdAt: range }, _count: { status: true } })
  const statusData = sc.map(x => ({ "Status": x.status, "Quantidade": x._count.status }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statusData), "Por Status")

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="relatorio-casaestampa-${new Date().toISOString().slice(0,10)}.xlsx"`,
    },
  })
}
