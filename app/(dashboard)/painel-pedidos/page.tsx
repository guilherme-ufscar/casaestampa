'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Eye, Edit2, MessageCircle, Download, Check, ChevronLeft, ChevronRight, X, Loader2, Home, Clock, FileText } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { StatusBadge, STATUS_CONFIG, StatusOrcamento } from '@/components/ui/StatusBadge'

type Pedido = {
  id: string; numero: number; status: string; precoFinalTotal: number | null
  createdAt: string
  cliente: { nome: string; telefone?: string } | null
  vendedor: { id: string; nome: string }
  ambientes: { id: string; nomeAmbiente?: string; tecido?: { nome: string }; quantidadeTecido?: number | null; precoFinalVenda?: number | null }[]
}

type PaginaData = {
  pedidos: Pedido[]; total: number; page: number; totalPages: number
  statusCounts: Record<string, number>
}

type PedidoDetalhe = Pedido & {
  cliente: { nome: string; telefone?: string; email?: string; endereco?: string } | null
  ambientes: { id: string; nomeAmbiente: string; tecido: { nome: string }; quantidadeTecido: number | null; precoFinalVenda: number | null }[]
  logsHistorico: { id: string; acao: string; createdAt: string; usuario: { nome: string } }[]
}

const TODOS_STATUS = Object.keys(STATUS_CONFIG) as StatusOrcamento[]

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtData(d: string) { return new Date(d).toLocaleDateString('pt-BR') }

export default function PainelPedidosPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [data, setData] = useState<PaginaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [vendedorFiltro, setVendedorFiltro] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [popoverAberto, setPopoverAberto] = useState<string | null>(null)
  const [drawerPedido, setDrawerPedido] = useState<PedidoDetalhe | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [vendedores, setVendedores] = useState<{ id: string; nome: string }[]>([])
  const popoverRef = useRef<HTMLDivElement>(null)

  const fetchPedidos = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (q) params.set('q', q)
    if (statusFiltro) params.set('status', statusFiltro)
    if (vendedorFiltro) params.set('vendedor', vendedorFiltro)
    if (periodo) params.set('periodo', periodo)
    if (dataInicio) params.set('dataInicio', dataInicio)
    if (dataFim) params.set('dataFim', dataFim)
    const res = await fetch(`/api/pedidos?${params}`)
    setData(await res.json())
    setLoading(false)
  }, [q, statusFiltro, vendedorFiltro, periodo, dataInicio, dataFim, page, limit])

  useEffect(() => {
    const t = setTimeout(fetchPedidos, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchPedidos, q])

  useEffect(() => {
    if (isAdmin) fetch('/api/usuarios').then(r => r.json()).then(setVendedores)
  }, [isAdmin])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setPopoverAberto(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function alterarStatus(id: string, status: string) {
    setData(prev => prev ? { ...prev, pedidos: prev.pedidos.map(p => p.id === id ? { ...p, status } : p) } : prev)
    setPopoverAberto(null)
    const res = await fetch(`/api/pedidos/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
    })
    if (res.ok) { setToast('Status atualizado!'); setTimeout(() => setToast(''), 3000) }
    else fetchPedidos()
  }

  async function abrirDrawer(id: string) {
    setDrawerLoading(true)
    setDrawerPedido(null)
    const res = await fetch(`/api/pedidos/${id}`)
    setDrawerPedido(await res.json())
    setDrawerLoading(false)
  }

  function whatsappRapido(p: Pedido) {
    const nome = p.cliente?.nome ?? 'Cliente'
    const total = fmt(Number(p.precoFinalTotal ?? 0))
    const msg = encodeURIComponent(`Olá, ${nome}! Seu orçamento Casa Estampa #${String(p.numero).padStart(4,'0')} está com status: *${STATUS_CONFIG[p.status as StatusOrcamento]?.label ?? p.status}*.\nValor total: *${total}*\n\nQualquer dúvida estou à disposição!`)
    const tel = p.cliente?.telefone?.replace(/\D/g,'') ?? ''
    const num = tel.length >= 10 ? `55${tel}` : ''
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
  }

  function toggleSelecionado(id: string) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleTodos() {
    if (!data) return
    setSelecionados(prev => prev.length === data.pedidos.length ? [] : data.pedidos.map(p => p.id))
  }

  async function alterarStatusMassa(status: string) {
    await Promise.all(selecionados.map(id =>
      fetch(`/api/pedidos/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    ))
    setSelecionados([])
    setToast(`${selecionados.length} pedidos atualizados!`)
    setTimeout(() => setToast(''), 3000)
    fetchPedidos()
  }

  const counts = data?.statusCounts ?? {}

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          <Check size={15} /> {toast}
          <button onClick={() => setToast('')}><X size={14} /></button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Painel de Pedidos</h2>
          <p className="text-sm text-text-muted mt-0.5">{data?.total ?? 0} pedido{(data?.total ?? 0) !== 1 ? 's' : ''}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-brand-border text-text-secondary hover:bg-brand-input transition-colors">
          <Download size={15} /> Exportar
        </button>
      </div>

      {/* Chips de status */}
      <div className="flex gap-2 flex-wrap">
        {TODOS_STATUS.map(s => {
          const cfg = STATUS_CONFIG[s]
          const count = counts[s] ?? 0
          const ativo = statusFiltro === s
          return (
            <button key={s} onClick={() => { setStatusFiltro(ativo ? '' : s); setPage(1) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${ativo ? 'border-current' : 'border-transparent bg-brand-input hover:bg-brand-border'}`}
              style={ativo ? { color: cfg.color, backgroundColor: cfg.bg } : {}}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
              {cfg.label}
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${ativo ? 'bg-white/60' : 'bg-brand-border'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Buscar cliente, número..." className="input-base pl-9 h-10 text-sm" />
        </div>
        <select value={statusFiltro} onChange={e => { setStatusFiltro(e.target.value); setPage(1) }} className="input-base h-10 text-sm w-auto min-w-40">
          <option value="">Todos os status</option>
          {TODOS_STATUS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        {isAdmin && (
          <select value={vendedorFiltro} onChange={e => { setVendedorFiltro(e.target.value); setPage(1) }} className="input-base h-10 text-sm w-auto min-w-36">
            <option value="">Todos os vendedores</option>
            {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
        )}
        <select value={periodo} onChange={e => { setPeriodo(e.target.value); setPage(1) }} className="input-base h-10 text-sm w-auto min-w-36">
          <option value="">Todos os períodos</option>
          <option value="mes">Este mês</option>
          <option value="3meses">Últimos 3 meses</option>
          <option value="ano">Este ano</option>
          <option value="personalizado">Personalizado</option>
        </select>
        {periodo === 'personalizado' && (
          <>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="input-base h-10 text-sm w-auto" />
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="input-base h-10 text-sm w-auto" />
          </>
        )}
      </div>

      {/* Barra de ações em massa */}
      {selecionados.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-gold-primary/10 border border-gold-primary/30 rounded-xl">
          <span className="text-sm font-medium text-gold-dark">{selecionados.length} selecionado{selecionados.length > 1 ? 's' : ''}</span>
          <select onChange={e => e.target.value && alterarStatusMassa(e.target.value)} defaultValue="" className="input-base h-9 text-sm w-auto min-w-44">
            <option value="">Alterar status...</option>
            {TODOS_STATUS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
          <button onClick={() => setSelecionados([])} className="ml-auto text-text-muted hover:text-text-primary"><X size={16} /></button>
        </div>
      )}

      {/* Tabela desktop */}
      <div className="hidden md:block card-base overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-bg">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={data ? selecionados.length === data.pedidos.length && data.pedidos.length > 0 : false} onChange={toggleTodos} className="rounded" />
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Nº</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Cliente</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Amb.</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Valor</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Status</th>
              {isAdmin && <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Vendedor</th>}
              <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Data</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 9 : 8} className="px-4 py-12 text-center"><Loader2 size={20} className="animate-spin text-gold-primary mx-auto" /></td></tr>
            ) : data?.pedidos.length === 0 ? (
              <tr><td colSpan={isAdmin ? 9 : 8} className="px-4 py-12 text-center text-text-muted text-sm">Nenhum pedido encontrado</td></tr>
            ) : data?.pedidos.map((p, i) => (
              <tr key={p.id} className={`border-b border-[#F8F6F2] hover:bg-[#FDF8EE] transition-colors ${i % 2 === 1 ? 'bg-brand-bg/50' : ''}`}>
                <td className="px-4 py-3"><input type="checkbox" checked={selecionados.includes(p.id)} onChange={() => toggleSelecionado(p.id)} className="rounded" /></td>
                <td className="px-4 py-3 font-semibold text-gold-primary">#{String(p.numero).padStart(4,'0')}</td>
                <td className="px-4 py-3 font-medium text-text-primary">{p.cliente?.nome ?? '—'}</td>
                <td className="px-4 py-3 text-text-secondary">{p.ambientes.length}</td>
                <td className="px-4 py-3 font-semibold text-text-primary">{p.precoFinalTotal ? fmt(Number(p.precoFinalTotal)) : '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                {isAdmin && <td className="px-4 py-3 text-text-secondary">{p.vendedor.nome}</td>}
                <td className="px-4 py-3 text-text-muted">{fmtData(p.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => abrirDrawer(p.id)} className="p-1.5 rounded hover:bg-brand-input text-text-muted hover:text-gold-primary transition-colors"><Eye size={15} /></button>
                    <div className="relative" ref={popoverAberto === p.id ? popoverRef : null}>
                      <button onClick={() => setPopoverAberto(popoverAberto === p.id ? null : p.id)} className="p-1.5 rounded hover:bg-brand-input text-text-muted hover:text-gold-primary transition-colors"><Edit2 size={15} /></button>
                      {popoverAberto === p.id && (
                        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-brand-border rounded-xl shadow-card-hover z-30 overflow-hidden">
                          {TODOS_STATUS.map(s => {
                            const cfg = STATUS_CONFIG[s]
                            return (
                              <button key={s} onClick={() => alterarStatus(p.id, s)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-brand-bg transition-colors text-left">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                                <span className="flex-1" style={{ color: cfg.color }}>{cfg.label}</span>
                                {p.status === s && <Check size={12} className="text-gold-primary" />}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <button onClick={() => whatsappRapido(p)} className="p-1.5 rounded hover:bg-brand-input text-text-muted hover:text-gold-primary transition-colors"><MessageCircle size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-gold-primary" /></div>
        ) : data?.pedidos.map(p => (
          <div key={p.id} className="card-base p-4 space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-gold-primary">#{String(p.numero).padStart(4,'0')}</span>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-base font-semibold text-text-primary">{p.cliente?.nome ?? '—'}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-text-primary">{p.precoFinalTotal ? fmt(Number(p.precoFinalTotal)) : '—'}</span>
              <span className="text-xs text-text-muted">{fmtData(p.createdAt)}</span>
            </div>
            {isAdmin && <p className="text-xs text-text-muted">Vendedor: {p.vendedor.nome}</p>}
            <div className="flex items-center gap-2 pt-2 border-t border-brand-border">
              <button onClick={() => abrirDrawer(p.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border border-brand-border text-text-secondary hover:bg-brand-input transition-colors"><Eye size={13} /> Ver</button>
              <button onClick={() => whatsappRapido(p)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border border-brand-border text-text-secondary hover:bg-brand-input transition-colors"><MessageCircle size={13} /> WhatsApp</button>
            </div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">Mostrando {((page-1)*limit)+1} a {Math.min(page*limit, data.total)} de {data.total} pedidos</p>
          <div className="flex items-center gap-2">
            <select value={limit} onChange={e => { setLimit(parseInt(e.target.value)); setPage(1) }} className="input-base h-9 text-sm w-auto">
              <option value="10">10</option><option value="25">25</option><option value="50">50</option>
            </select>
            <button disabled={page===1} onClick={() => setPage(p => p-1)} className="p-2 rounded-lg border border-brand-border disabled:opacity-40 hover:bg-brand-input transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium text-text-primary px-2">{page} / {data.totalPages}</span>
            <button disabled={page===data.totalPages} onClick={() => setPage(p => p+1)} className="p-2 rounded-lg border border-brand-border disabled:opacity-40 hover:bg-brand-input transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Drawer detalhes */}
      {(drawerPedido || drawerLoading) && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => { setDrawerPedido(null); setDrawerLoading(false) }} />
          <div className="w-full max-w-[640px] bg-white h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h3 className="text-base font-semibold text-text-primary">
                {drawerPedido ? `Orçamento #${String(drawerPedido.numero).padStart(4,'0')}` : 'Carregando...'}
              </h3>
              <button onClick={() => { setDrawerPedido(null); setDrawerLoading(false) }} className="p-1.5 rounded hover:bg-brand-input text-text-secondary"><X size={18} /></button>
            </div>
            {drawerLoading ? (
              <div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-gold-primary" /></div>
            ) : drawerPedido && (
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div className="flex items-center gap-3">
                  <StatusBadge status={drawerPedido.status} />
                  <span className="text-xs text-text-muted">Criado em {fmtData(drawerPedido.createdAt)}</span>
                </div>
                {drawerPedido.cliente && (
                  <div className="p-4 bg-brand-bg rounded-xl space-y-1">
                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">Cliente</p>
                    <p className="text-sm font-semibold text-text-primary">{drawerPedido.cliente.nome}</p>
                    {drawerPedido.cliente.telefone && <p className="text-xs text-text-secondary">{drawerPedido.cliente.telefone}</p>}
                    {drawerPedido.cliente.email && <p className="text-xs text-text-secondary">{drawerPedido.cliente.email}</p>}
                    {drawerPedido.cliente.endereco && <p className="text-xs text-text-muted">{drawerPedido.cliente.endereco}</p>}
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Ambientes</p>
                  <div className="space-y-2">
                    {drawerPedido.ambientes.map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-brand-border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Home size={14} className="text-gold-primary" />
                          <div>
                            <p className="text-sm font-medium text-text-primary">{a.nomeAmbiente}</p>
                            <p className="text-xs text-text-muted">{a.tecido?.nome} · {Number(a.quantidadeTecido ?? 0).toFixed(2)}m</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">{a.precoFinalVenda ? fmt(Number(a.precoFinalVenda)) : '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #FFFBF2, #FFF8EC)', border: '1px solid #E8C97A' }}>
                  <span className="text-sm font-medium text-text-secondary">Total</span>
                  <span className="text-xl font-bold text-text-primary">{drawerPedido.precoFinalTotal ? fmt(Number(drawerPedido.precoFinalTotal)) : '—'}</span>
                </div>
                {drawerPedido.logsHistorico.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Histórico</p>
                    <div className="space-y-2">
                      {drawerPedido.logsHistorico.map(log => (
                        <div key={log.id} className="flex items-start gap-2">
                          <Clock size={13} className="text-text-muted mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-text-primary">{log.acao.replace(/_/g,' ')}</p>
                            <p className="text-[11px] text-text-muted">{log.usuario.nome} · {fmtData(log.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <a href={`/api/orcamentos/${drawerPedido.id}/pdf`} target="_blank" className="btn-gold flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-semibold">
                    <FileText size={15} /> Gerar PDF
                  </a>
                  <button onClick={() => whatsappRapido(drawerPedido)} className="flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-semibold text-white" style={{ background: '#25D366' }}>
                    <MessageCircle size={15} /> WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
