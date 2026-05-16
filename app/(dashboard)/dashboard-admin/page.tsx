'use client'

import { useState, useEffect } from 'react'
import { FileText, CheckCircle, Package, TrendingUp, DollarSign, Percent, PlusCircle, Settings, Users, BarChart2, Trophy } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type DashData = {
  byStatus: Record<string, number>
  totalMes: number
  aprovadosMes: number
  faturamentoMes?: number
  custoTotal?: number
  margemMedia?: number
  faturamento6Meses?: { mes: string; faturamento: number }[]
  rankingVendedores?: { id: string; nome: string; orcamentos: number; faturamento: number; comissao: number }[]
  operacionalFinanceiro?: { totalFornecedores: number; totalInstalacao: number; totalGeral: number }
  recentes: { id: string; numero: number; status: string; precoFinalTotal: number | null; createdAt: string; cliente: { nome: string } | null; ambientes: { id: string }[] }[]
}

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtK(v: number) { return v >= 1000 ? `R$ ${(v/1000).toFixed(0)}k` : fmt(v) }

function MetricCard({ icon, label, value, color, badge, restricted }: { icon: React.ReactNode; label: string; value: string | number; color: string; badge?: string; restricted?: boolean }) {
  return (
    <div className={`card-base p-6 relative overflow-hidden ${restricted ? 'border-gold-primary/35' : ''}`} style={restricted ? { borderColor: 'rgba(201,168,76,0.35)' } : {}}>
      {restricted && <div className="absolute top-3 right-3 text-gold-primary opacity-60"><Trophy size={14} /></div>}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-bold text-text-primary">{value}</p>
          {badge && <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-600">{badge}</span>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

export default function DashboardAdminPage() {
  const [dash, setDash] = useState<DashData | null>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setDash)
  }, [])

  const agora = new Date()
  const mesAno = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const pctAprovacao = dash?.totalMes ? Math.round((dash.aprovadosMes / dash.totalMes) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Dashboard Administrativo</h2>
        <p className="text-sm text-text-muted mt-0.5 capitalize">{mesAno}</p>
      </div>

      {/* Linha 1 — Operacional */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={<FileText size={20} />} label="Orçamentos Este Mês" value={dash?.totalMes ?? 0} color="#3B82F6" />
        <MetricCard icon={<CheckCircle size={20} />} label="Aprovados" value={dash?.aprovadosMes ?? 0} color="#22C55E" badge={`${pctAprovacao}% aprovação`} />
        <MetricCard icon={<Package size={20} />} label="Em Produção" value={dash?.byStatus?.em_producao ?? 0} color="#8B5CF6" />
      </div>

      {/* Linha 2 — Financeiro (admin only) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={<DollarSign size={20} />} label="Faturamento do Mês" value={dash?.faturamentoMes !== undefined ? fmt(dash.faturamentoMes) : '—'} color="#C9A84C" restricted />
        <MetricCard icon={<TrendingUp size={20} />} label="Custo Total" value={dash?.custoTotal !== undefined ? fmt(dash.custoTotal) : '—'} color="#EF4444" restricted />
        <MetricCard icon={<Percent size={20} />} label="Margem Média" value={dash?.margemMedia !== undefined ? `${dash.margemMedia.toFixed(1)}%` : '—'} color="#10B981" restricted />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={<DollarSign size={20} />} label="A pagar fornecedores" value={dash?.operacionalFinanceiro ? fmt(dash.operacionalFinanceiro.totalFornecedores) : '—'} color="#7C3AED" restricted />
        <MetricCard icon={<DollarSign size={20} />} label="A pagar instalação" value={dash?.operacionalFinanceiro ? fmt(dash.operacionalFinanceiro.totalInstalacao) : '—'} color="#16A34A" restricted />
        <MetricCard icon={<DollarSign size={20} />} label="Total operacional" value={dash?.operacionalFinanceiro ? fmt(dash.operacionalFinanceiro.totalGeral) : '—'} color="#0F766E" restricted />
      </div>

      {/* Linha 3 — Gráfico + Ranking + Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Gráfico faturamento */}
        <div className="lg:col-span-5 card-base p-5">
          <p className="text-sm font-semibold text-text-primary mb-4">Faturamento — Últimos 6 meses</p>
          {dash?.faturamento6Meses ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dash.faturamento6Meses} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9A9A9A', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: '#9A9A9A', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [fmt(Number(v ?? 0)), 'Faturamento']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #F0EDE8', fontFamily: 'Poppins', fontSize: 12 }}
                />
                <Bar dataKey="faturamento" fill="#C9A84C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-text-muted text-sm">Carregando...</div>
          )}
        </div>

        {/* Ranking vendedores */}
        <div className="lg:col-span-4 card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border">
            <p className="text-sm font-semibold text-text-primary">Ranking do Mês</p>
          </div>
          <div className="divide-y divide-brand-border">
            {!dash?.rankingVendedores ? (
              <p className="px-5 py-8 text-center text-text-muted text-xs">Carregando...</p>
            ) : dash.rankingVendedores.length === 0 ? (
              <p className="px-5 py-8 text-center text-text-muted text-xs">Nenhum dado disponível</p>
            ) : dash.rankingVendedores.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FDF8EE] transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-gold-primary text-white' : 'bg-brand-input text-text-secondary'}`}>
                  {i === 0 ? <Trophy size={13} /> : i + 1}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-primary to-gold-light flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-white">{v.nome.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{v.nome}</p>
                  <p className="text-xs text-text-muted">{v.orcamentos} orç. · {fmt(v.faturamento)}</p>
                </div>
                <p className="text-xs font-medium text-green-600 shrink-0">{fmt(v.comissao)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="lg:col-span-3 card-base p-5">
          <p className="text-sm font-semibold text-text-primary mb-4">Ações Rápidas</p>
          <div className="space-y-2">
            {[
              { href: '/configuracoes/usuarios', icon: <Users size={16} />, label: 'Adicionar Vendedor' },
              { href: '/configuracoes', icon: <Settings size={16} />, label: 'Editar Tabelas' },
              { href: '/relatorios', icon: <BarChart2 size={16} />, label: 'Gerar Relatório' },
              { href: '/orcamentos/novo', icon: <PlusCircle size={16} />, label: 'Novo Orçamento' },
            ].map(({ href, icon, label }) => (
              <Link key={href} href={href} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-brand-input hover:text-gold-primary transition-colors">
                <span className="text-text-muted">{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
