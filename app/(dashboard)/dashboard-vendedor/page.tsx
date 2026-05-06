'use client'

import { useState, useEffect } from 'react'
import { FileText, Clock, CheckCircle, Package, PlusCircle, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { StatusBadge } from '@/components/ui/StatusBadge'

type DashData = {
  byStatus: Record<string, number>
  totalMes: number
  aprovadosMes: number
  recentes: { id: string; numero: number; status: string; precoFinalTotal: number | null; createdAt: string; cliente: { nome: string } | null; ambientes: { id: string }[] }[]
  instalacoes: { id: string; numero: number; status: string; createdAt: string; cliente: { nome: string; endereco?: string } | null }[]
}

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtData(d: string) { return new Date(d).toLocaleDateString('pt-BR') }

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="card-base p-6 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-bold text-text-primary">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

export default function DashboardVendedorPage() {
  const { data: session } = useSession()
  const [dash, setDash] = useState<DashData | null>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setDash)
  }, [])

  const agora = new Date()
  const dataFormatada = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Bem-vindo de volta, {session?.user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-text-muted mt-1 capitalize">{dataFormatada}</p>
        </div>
        <Link href="/orcamentos/novo" className="btn-gold flex items-center gap-2 px-5 py-3 rounded-[10px] text-sm font-semibold">
          <PlusCircle size={18} /> Novo Orçamento
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<FileText size={20} />} label="Orçamentos Enviados" value={dash?.byStatus?.orcamento_enviado ?? 0} color="#3B82F6" />
        <MetricCard icon={<Clock size={20} />} label="Aguardando Aprovação" value={dash?.byStatus?.aguardando_aprovacao ?? 0} color="#F59E0B" />
        <MetricCard icon={<CheckCircle size={20} />} label="Aprovados Este Mês" value={dash?.aprovadosMes ?? 0} color="#22C55E" />
        <MetricCard icon={<Package size={20} />} label="Em Produção" value={dash?.byStatus?.em_producao ?? 0} color="#3B82F6" />
      </div>

      {/* Painéis */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Orçamentos recentes */}
        <div className="lg:col-span-3 card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary">Orçamentos Recentes</p>
            <Link href="/painel-pedidos" className="text-xs font-medium text-gold-primary hover:text-gold-dark transition-colors">Ver todos</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg">
                <th className="text-left px-4 py-2.5 text-[10px] font-medium text-text-muted uppercase tracking-wider">Cliente</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-medium text-text-muted uppercase tracking-wider">Valor</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-medium text-text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-medium text-text-muted uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody>
              {!dash ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted text-xs">Carregando...</td></tr>
              ) : dash.recentes.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted text-xs">Nenhum orçamento ainda</td></tr>
              ) : dash.recentes.map((o, i) => (
                <tr key={o.id} className={`border-b border-[#F8F6F2] hover:bg-[#FDF8EE] transition-colors ${i % 2 === 1 ? 'bg-brand-bg/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-text-primary text-xs">{o.cliente?.nome ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-text-primary text-xs">{o.precoFinalTotal ? fmt(Number(o.precoFinalTotal)) : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-text-muted text-xs">{fmtData(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Instalações agendadas */}
        <div className="lg:col-span-2 card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border">
            <p className="text-sm font-semibold text-text-primary">Instalações Agendadas</p>
          </div>
          <div className="divide-y divide-brand-border">
            {!dash ? (
              <p className="px-5 py-8 text-center text-text-muted text-xs">Carregando...</p>
            ) : dash.instalacoes.length === 0 ? (
              <p className="px-5 py-8 text-center text-text-muted text-xs">Nenhuma instalação pendente</p>
            ) : dash.instalacoes.map(o => (
              <div key={o.id} className="px-5 py-3 hover:bg-brand-bg transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{o.cliente?.nome ?? '—'}</p>
                    {o.cliente?.endereco && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-text-muted shrink-0" />
                        <p className="text-xs text-text-muted truncate">{o.cliente.endereco}</p>
                      </div>
                    )}
                    <p className="text-xs text-text-muted mt-0.5">{fmtData(o.createdAt)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
