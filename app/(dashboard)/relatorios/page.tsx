"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronDown, FileDown, FileSpreadsheet, TrendingUp, Trophy, FileBarChart, DollarSign, Users, Package, Table, ArrowUpRight, ArrowDownRight, Loader2, Search } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { STATUS_CONFIG, StatusOrcamento } from "@/components/ui/StatusBadge"
import { Toaster, toast } from "sonner"

type KPIs = {
  faturamentoTotal: number; custoTotal: number; margemMedia: number
  orcamentosFechados: number; totalOrcamentos: number
  variacaoFaturamento: number; variacaoCusto: number; variacaoMargem: number; conversao: number
}
type DadosRelatorio = {
  kpis: KPIs
  faturamentoMensal: { mes: string; mesCompleto: string; faturamento: number; custo: number; margem: number }[]
  produtosMaisOrcados: { nome: string; count: number; percentual: number }[]
  orcamentosPorStatus: { status: string; count: number; percentual: number }[]
  rankingVendedores: { id: string; nome: string; orcamentos: number; fechados: number; faturamento: number; comissao: number; taxaAprovacao: number }[]
}

type ClienteResumo = {
  id: string
  nome: string
  telefone?: string
  email?: string
  createdAt: string
  orcamentos: { id: string; createdAt: string; precoFinalTotal: number | null; status: string }[]
}

const PERIODO_LABELS: Record<string, string> = { mes: "Este mês", "3meses": "Últimos 3 meses", ano: "Este ano", personalizado: "Personalizado" }
const DONUT_COLORS = ["#C9A84C", "#3B82F6", "#9A9A9A", "#22C55E", "#8B5CF6"]

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) }
function fmtK(v: number) { return v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : fmt(v) }

function Variacao({ v, unit = "%" }: { v: number; unit?: string }) {
  const up = v >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(v)}{unit}
    </span>
  )
}

function SkeletonCard() {
  return <div className="card-base p-6 animate-pulse"><div className="h-3 bg-brand-border rounded w-24 mb-3" /><div className="h-8 bg-brand-border rounded w-32" /></div>
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; payload: { custo: number; margem: number } }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-brand-border rounded-xl shadow-lg p-3 text-xs font-medium">
      <p className="text-text-primary font-semibold mb-1">{label}</p>
      <p className="text-gold-primary">Faturamento: {fmt(payload[0]?.value ?? 0)}</p>
      {payload[0]?.payload?.custo > 0 && <p className="text-text-muted">Custo: {fmt(payload[0].payload.custo)}</p>}
      {payload[0]?.payload?.margem > 0 && <p className="text-green-600">Margem: {payload[0].payload.margem}%</p>}
    </div>
  )
}

export default function RelatoriosPage() {
  const [dados, setDados] = useState<DadosRelatorio | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("mes")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingXls, setExportingXls] = useState(false)
  const [clientes, setClientes] = useState<ClienteResumo[]>([])
  const [buscaCliente, setBuscaCliente] = useState("")
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [baixandoFichaId, setBaixandoFichaId] = useState<string | null>(null)

  const fetchDados = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ periodo })
    if (periodo === "personalizado" && dataInicio && dataFim) { params.set("dataInicio", dataInicio); params.set("dataFim", dataFim) }
    const res = await fetch(`/api/relatorios/dados?${params}`)
    if (res.ok) setDados(await res.json())
    setLoading(false)
  }, [periodo, dataInicio, dataFim])

  useEffect(() => { fetchDados() }, [fetchDados])

  const fetchClientes = useCallback(async () => {
    setLoadingClientes(true)
    const params = new URLSearchParams()
    if (buscaCliente) params.set("q", buscaCliente)
    const res = await fetch(`/api/clientes?${params}`)
    if (res.ok) setClientes(await res.json())
    setLoadingClientes(false)
  }, [buscaCliente])

  useEffect(() => {
    const t = setTimeout(fetchClientes, buscaCliente ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchClientes, buscaCliente])

  async function exportarPdf() {
    setExportingPdf(true)
    const params = new URLSearchParams({ periodo })
    if (periodo === "personalizado" && dataInicio && dataFim) { params.set("dataInicio", dataInicio); params.set("dataFim", dataFim) }
    const res = await fetch(`/api/relatorios/pdf?${params}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = "relatorio.pdf"; a.click()
      URL.revokeObjectURL(url)
      toast.success("PDF gerado com sucesso!")
    } else { toast.error("Erro ao gerar PDF") }
    setExportingPdf(false)
  }

  async function exportarExcel() {
    setExportingXls(true)
    const params = new URLSearchParams({ periodo })
    if (periodo === "personalizado" && dataInicio && dataFim) { params.set("dataInicio", dataInicio); params.set("dataFim", dataFim) }
    const res = await fetch(`/api/relatorios/excel?${params}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = "relatorio.xlsx"; a.click()
      URL.revokeObjectURL(url)
      toast.success("Excel gerado com sucesso!")
    } else { toast.error("Erro ao gerar Excel") }
    setExportingXls(false)
  }

  async function baixarFichaCliente(cliente: ClienteResumo) {
    setBaixandoFichaId(cliente.id)
    try {
      const res = await fetch(`/api/clientes/${cliente.id}/ficha`)
      if (!res.ok) throw new Error("Erro ao gerar ficha")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ficha-${cliente.nome.replace(/\s+/g, "-").toLowerCase()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Ficha do cliente gerada com sucesso!")
    } catch {
      toast.error("Erro ao gerar ficha do cliente")
    } finally {
      setBaixandoFichaId(null)
    }
  }

  const kpis = dados?.kpis

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Relatórios</h2>
          <p className="text-sm text-text-muted mt-0.5">Análise de desempenho comercial e financeiro</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de período */}
          <div className="relative">
            <button onClick={() => setDropdownOpen(v => !v)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-border bg-white text-sm font-medium text-text-primary hover:bg-brand-bg transition-colors">
              {PERIODO_LABELS[periodo]}
              <ChevronDown size={15} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-brand-border rounded-xl shadow-lg z-20 overflow-hidden">
                {Object.entries(PERIODO_LABELS).map(([k, v]) => (
                  <button key={k} onClick={() => { setPeriodo(k); setDropdownOpen(false) }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-bg transition-colors ${periodo === k ? "text-gold-primary font-semibold" : "text-text-secondary"}`}>{v}</button>
                ))}
              </div>
            )}
          </div>
          {periodo === "personalizado" && (
            <>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="input-base h-10 text-sm w-auto" />
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="input-base h-10 text-sm w-auto" />
            </>
          )}
          <button onClick={exportarPdf} disabled={exportingPdf} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-border text-sm font-medium text-text-secondary hover:bg-brand-bg transition-colors disabled:opacity-60">
            {exportingPdf ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />} Exportar PDF
          </button>
          <button onClick={exportarExcel} disabled={exportingXls} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-green-300 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors disabled:opacity-60">
            {exportingXls ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />} Exportar Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1,2,3,4].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="card-base p-6">
              <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Faturamento Total</p>
              <p className="text-2xl font-bold text-text-primary mb-1">{fmt(kpis?.faturamentoTotal ?? 0)}</p>
              {kpis && <Variacao v={kpis.variacaoFaturamento} />}
            </div>
            <div className="card-base p-6">
              <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Custo Total</p>
              <p className="text-2xl font-bold text-text-primary mb-1">{fmt(kpis?.custoTotal ?? 0)}</p>
              {kpis && <Variacao v={kpis.variacaoCusto} />}
            </div>
            <div className="card-base p-6">
              <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Margem Média</p>
              <p className="text-2xl font-bold text-text-primary mb-1">{kpis?.margemMedia ?? 0}%</p>
              {kpis && <Variacao v={kpis.variacaoMargem} unit="pp" />}
            </div>
            <div className="card-base p-6">
              <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Orçamentos Fechados</p>
              <p className="text-2xl font-bold text-text-primary mb-1">{kpis?.orcamentosFechados ?? 0} <span className="text-sm font-normal text-text-muted">/ {kpis?.totalOrcamentos ?? 0}</span></p>
              <p className="text-xs text-text-muted">{kpis?.conversao ?? 0}% conversão</p>
            </div>
          </>
        )}
      </div>

      {/* Gráficos linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 card-base p-5">
          <p className="text-sm font-semibold text-text-primary mb-4">Faturamento Mensal</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-gold-primary" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dados?.faturamentoMensal ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9A9A9A", fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: "#9A9A9A", fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="faturamento" fill="#C9A84C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="lg:col-span-5 card-base p-5">
          <p className="text-sm font-semibold text-text-primary mb-4">Produtos Mais Orçados</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-gold-primary" /></div>
          ) : dados?.produtosMaisOrcados.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-muted text-sm">Sem dados</div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={dados?.produtosMaisOrcados ?? []} dataKey="count" nameKey="nome" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                    {(dados?.produtosMaisOrcados ?? []).map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {(dados?.produtosMaisOrcados ?? []).map((p, i) => (
                  <div key={p.nome} className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    {p.nome} ({p.percentual}%)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gráficos linha 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Ranking vendedores */}
        <div className="lg:col-span-7 card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border">
            <p className="text-sm font-semibold text-text-primary">Ranking de Vendedores</p>
          </div>
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 size={20} className="animate-spin text-gold-primary" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-brand-bg">
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider w-10">Pos</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Vendedor</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Orç.</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Faturamento</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Comissão</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Aprovação</th>
                </tr>
              </thead>
              <tbody>
                {(dados?.rankingVendedores ?? []).length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted text-sm">Nenhum dado disponível</td></tr>
                ) : (dados?.rankingVendedores ?? []).map((v, i) => (
                  <tr key={v.id} className="border-b border-[#F8F6F2] hover:bg-[#FDF8EE] transition-colors">
                    <td className="px-4 py-3">
                      {i === 0 ? <Trophy size={16} className="text-gold-primary" /> : <span className={`text-sm font-bold ${i === 1 ? "text-[#9A9A9A]" : i === 2 ? "text-[#CD7F32]" : "text-text-muted"}`}>{i + 1}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-primary to-gold-light flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-semibold text-white">{v.nome.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-semibold text-text-primary text-sm">{v.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{v.orcamentos}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{fmt(v.faturamento)}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{fmt(v.comissao)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${v.taxaAprovacao >= 60 ? "bg-green-50 text-green-600" : v.taxaAprovacao >= 40 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}`}>
                        {v.taxaAprovacao}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Orçamentos por status */}
        <div className="lg:col-span-5 card-base p-5">
          <p className="text-sm font-semibold text-text-primary mb-4">Orçamentos por Status</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-gold-primary" /></div>
          ) : (dados?.orcamentosPorStatus ?? []).length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-muted text-sm">Sem dados</div>
          ) : (
            <div className="space-y-3">
              {(dados?.orcamentosPorStatus ?? []).map(s => {
                const cfg = STATUS_CONFIG[s.status as StatusOrcamento] ?? { color: "#9A9A9A", dot: "#9A9A9A", label: s.status }
                return (
                  <div key={s.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-text-secondary">{cfg.label}</span>
                      <span className="text-text-muted">{s.count} ({s.percentual}%)</span>
                    </div>
                    <div className="h-2 bg-brand-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${s.percentual}%`, backgroundColor: cfg.dot }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cards de relatórios para exportação */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Relatórios para Exportação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: FileBarChart, title: "Orçamentos por Período", desc: "Listagem completa com filtros por data e vendedor", action: "pdf" },
            { icon: DollarSign, title: "Faturamento e Margens", desc: "Análise financeira com custos, margens e comissões", action: "pdf" },
            { icon: Users, title: "Desempenho por Vendedor", desc: "Ranking individual com metas e comissões", action: "pdf" },
            { icon: Package, title: "Pedidos em Produção", desc: "Status atual de todos os pedidos em andamento", action: "pdf" },
            { icon: TrendingUp, title: "Análise de Conversão", desc: "Taxa de aprovação por período e vendedor", action: "pdf" },
            { icon: Table, title: "Exportação Completa", desc: "Todos os dados em planilha Excel", action: "excel" },
          ].map(({ icon: Icon, title, desc, action }) => (
            <div key={title} className="card-base p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-primary to-gold-light flex items-center justify-center">
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{title}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{desc}</p>
              </div>
              <button
                onClick={action === "excel" ? exportarExcel : exportarPdf}
                disabled={action === "excel" ? exportingXls : exportingPdf}
                className={`mt-auto flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${action === "excel" ? "bg-green-500 text-white hover:bg-green-600" : "border border-gold-primary text-gold-primary hover:bg-gold-primary/5"}`}
              >
                {action === "excel" ? <FileSpreadsheet size={13} /> : <FileDown size={13} />}
                {action === "excel" ? "Exportar Excel" : "Gerar PDF"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card-base p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Ficha por Cliente</h3>
            <p className="text-sm text-text-muted mt-0.5">Busque um cliente e gere a ficha completa com histórico de orçamentos.</p>
          </div>
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={buscaCliente}
              onChange={e => setBuscaCliente(e.target.value)}
              placeholder="Buscar cliente por nome, telefone ou email..."
              className="input-base pl-9"
            />
          </div>
        </div>

        {loadingClientes ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-gold-primary" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-border px-4 py-8 text-center text-sm text-text-muted">
            Nenhum cliente encontrado.
          </div>
        ) : (
          <div className="space-y-3">
            {clientes.slice(0, 8).map(cliente => {
              const totalOrcamentos = cliente.orcamentos.length
              const ultimoOrcamento = cliente.orcamentos[0]?.createdAt
              const valorTotal = cliente.orcamentos.reduce((s, o) => s + Number(o.precoFinalTotal ?? 0), 0)

              return (
                <div key={cliente.id} className="rounded-2xl border border-brand-border p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{cliente.nome}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      {cliente.telefone && <span>{cliente.telefone}</span>}
                      {cliente.email && <span>{cliente.email}</span>}
                      <span>Cliente desde {new Date(cliente.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600">
                        {totalOrcamentos} orçamento{totalOrcamentos !== 1 ? "s" : ""}
                      </span>
                      {valorTotal > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-green-50 text-green-600">
                          {fmt(valorTotal)}
                        </span>
                      )}
                      {ultimoOrcamento && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-brand-input text-text-muted">
                          Último: {new Date(ultimoOrcamento).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => baixarFichaCliente(cliente)}
                    disabled={baixandoFichaId === cliente.id}
                    className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-brand-border text-sm font-medium text-text-secondary hover:bg-brand-bg transition-colors disabled:opacity-60"
                  >
                    {baixandoFichaId === cliente.id ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
                    Baixar ficha
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
