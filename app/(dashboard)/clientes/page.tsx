'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, UserPlus, MapPin, Phone, Mail, User, X, Pencil, Loader2, Check, FileText, Plus, FileDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Orcamento = {
  id: string
  precoFinalTotal: number | null
  status: string
  createdAt: string
  origemHistorico?: boolean
  servicoHistorico?: string | null
  descricaoHistorico?: string | null
  indicacaoHistorica?: string | null
  instaladorNomeOriginal?: string | null
  instalador?: { nome: string } | null
}
type Arquiteto = {
  id: string
  nome: string
  telefone: string
  email: string
  observacoes: string
  ativo: boolean
}
type Cliente = {
  id: string
  nome: string
  telefone?: string
  email?: string
  endereco?: string
  bairro?: string
  arquiteto?: string
  createdAt: string
  orcamentos: Orcamento[]
  arquitetosDisponiveis?: Arquiteto[]
}

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'com_orcamento', label: 'Com orçamento ativo' },
  { key: 'sem_orcamento', label: 'Sem orçamento' },
  { key: 'arquiteto', label: 'Arquiteto / RT' },
]

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

function getArquitetoState(arquiteto: string | undefined, arquitetos: Arquiteto[]) {
  if (!arquiteto) return { modo: 'cadastro' as const, selecionado: '', manual: '' }
  const encontrado = arquitetos.find(item => item.nome === arquiteto)
  if (encontrado) return { modo: 'cadastro' as const, selecionado: encontrado.nome, manual: '' }
  return { modo: 'manual' as const, selecionado: '', manual: arquiteto }
}

function Avatar({ nome }: { nome: string }) {
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-semibold text-lg"
      style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)' }}>
      {nome.charAt(0).toUpperCase()}
    </div>
  )
}

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [drawerCliente, setDrawerCliente] = useState<Cliente | null>(null)
  const [saving, setSaving] = useState(false)
  const [baixandoFicha, setBaixandoFicha] = useState(false)
  const [novoDrawer, setNovoDrawer] = useState(false)
  const [arquitetos, setArquitetos] = useState<Arquiteto[]>([])
  const [editArquitetoModo, setEditArquitetoModo] = useState<'cadastro' | 'manual'>('cadastro')
  const [novoArquitetoModo, setNovoArquitetoModo] = useState<'cadastro' | 'manual'>('cadastro')
  const [editForm, setEditForm] = useState({ nome: '', telefone: '', email: '', endereco: '', bairro: '', arquitetoSelecionado: '', arquitetoManual: '' })
  const [novoForm, setNovoForm] = useState({ nome: '', telefone: '', email: '', endereco: '', bairro: '', arquitetoSelecionado: '', arquitetoManual: '' })

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ filtro })
    if (busca) params.set('q', busca)
    const res = await fetch(`/api/clientes?${params}`)
    setClientes(await res.json())
    setLoading(false)
  }, [busca, filtro])

  const fetchArquitetos = useCallback(async () => {
    const res = await fetch('/api/arquitetos')
    const data = await res.json()
    setArquitetos(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    fetchArquitetos()
  }, [fetchArquitetos])

  // Abre o cadastro do cliente automaticamente quando vindo de ?abrir=<id> (ex: painel de pedidos)
  useEffect(() => {
    const abrir = new URLSearchParams(window.location.search).get('abrir')
    if (!abrir) return
    fetch(`/api/clientes/${abrir}`)
      .then(r => (r.ok ? r.json() : null))
      .then(c => { if (c) abrirDrawer(c) })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchClientes, busca ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchClientes, busca])

  function abrirDrawer(c: Cliente) {
    setDrawerCliente(c)
    const listaArquitetos = c.arquitetosDisponiveis?.length ? c.arquitetosDisponiveis : arquitetos
    const arquitetoState = getArquitetoState(c.arquiteto, listaArquitetos)
    setEditArquitetoModo(arquitetoState.modo)
    setEditForm({
      nome: c.nome,
      telefone: c.telefone ?? '',
      email: c.email ?? '',
      endereco: c.endereco ?? '',
      bairro: c.bairro ?? '',
      arquitetoSelecionado: arquitetoState.selecionado,
      arquitetoManual: arquitetoState.manual,
    })
  }

  async function salvarEdicao() {
    if (!drawerCliente) return
    setSaving(true)
    const arquiteto = editArquitetoModo === 'cadastro' ? editForm.arquitetoSelecionado : editForm.arquitetoManual.trim()
    await fetch(`/api/clientes/${drawerCliente.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: editForm.nome,
        telefone: editForm.telefone,
        email: editForm.email,
        endereco: editForm.endereco,
        bairro: editForm.bairro,
        arquiteto,
      }),
    })
    setSaving(false)
    setDrawerCliente(null)
    fetchClientes()
  }

  async function criarCliente() {
    if (!novoForm.nome) return
    setSaving(true)
    const arquiteto = novoArquitetoModo === 'cadastro' ? novoForm.arquitetoSelecionado : novoForm.arquitetoManual.trim()
    await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: novoForm.nome,
        telefone: novoForm.telefone,
        email: novoForm.email,
        endereco: novoForm.endereco,
        bairro: novoForm.bairro,
        arquiteto,
      }),
    })
    setSaving(false)
    setNovoDrawer(false)
    setNovoArquitetoModo('cadastro')
    setNovoForm({ nome: '', telefone: '', email: '', endereco: '', bairro: '', arquitetoSelecionado: '', arquitetoManual: '' })
    fetchClientes()
  }

  async function baixarFichaCliente() {
    if (!drawerCliente) return
    setBaixandoFicha(true)
    try {
      const res = await fetch(`/api/clientes/${drawerCliente.id}/ficha`)
      if (!res.ok) throw new Error('Erro ao gerar ficha')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ficha-${drawerCliente.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setBaixandoFicha(false)
    }
  }

  function novoOrcamento(c: Cliente) {
    const param = encodeURIComponent(JSON.stringify({ id: c.id, nome: c.nome, telefone: c.telefone, email: c.email, endereco: c.endereco, bairro: c.bairro, arquiteto: c.arquiteto }))
    router.push(`/orcamentos/novo?cliente=${param}`)
  }

  const totalOrcamentos = (c: Cliente) => c.orcamentos.length
  const valorTotal = (c: Cliente) => c.orcamentos.reduce((s, o) => s + (o.precoFinalTotal ? Number(o.precoFinalTotal) : 0), 0)
  const ultimoOrcamento = (c: Cliente) => c.orcamentos[0]?.createdAt

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Clientes</h2>
          <p className="text-sm text-text-muted mt-0.5">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} encontrado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => {
            setNovoArquitetoModo('cadastro')
            setNovoForm({ nome: '', telefone: '', email: '', endereco: '', bairro: '', arquitetoSelecionado: '', arquitetoManual: '' })
            setNovoDrawer(true)
          }}
          className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-semibold"
        >
          <UserPlus size={16} />
          Novo Cliente
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone ou email..."
          className="input-base pl-9"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtro === f.key
                ? 'bg-gold-primary text-white'
                : 'bg-brand-input text-text-secondary hover:bg-brand-border'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gold-primary" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="card-base p-12 text-center">
          <User size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">Nenhum cliente encontrado</p>
          <p className="text-sm text-text-muted mt-1">Tente ajustar os filtros ou cadastre um novo cliente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientes.map(c => (
            <div key={c.id} className="card-base p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <Avatar nome={c.nome} />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-text-primary truncate">{c.nome}</p>
                  {c.telefone && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone size={12} className="text-text-muted shrink-0" />
                      <span className="text-sm text-text-secondary">{c.telefone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-1">
                      <Mail size={12} className="text-text-muted shrink-0" />
                      <span className="text-sm text-text-secondary truncate">{c.email}</span>
                    </div>
                  )}
                  {(c.endereco || c.bairro) && (
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-text-muted shrink-0" />
                      <span className="text-xs text-text-muted truncate">{[c.endereco, c.bairro].filter(Boolean).join(' · ')}</span>
                    </div>
                  )}
                  {c.arquiteto && (
                    <div className="flex items-center gap-1">
                      <User size={12} className="text-text-muted shrink-0" />
                      <span className="text-xs text-text-muted truncate">RT: {c.arquiteto}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-brand-border" />

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600">
                  <FileText size={10} className="inline mr-1" />
                  {totalOrcamentos(c)} orçamento{totalOrcamentos(c) !== 1 ? 's' : ''}
                </span>
                {valorTotal(c) > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-green-50 text-green-600">
                    {fmt(valorTotal(c))}
                  </span>
                )}
                {ultimoOrcamento(c) && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-brand-input text-text-muted">
                    Último: {new Date(ultimoOrcamento(c)!).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => abrirDrawer(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-brand-border text-text-secondary hover:bg-brand-input transition-colors"
                >
                  <Pencil size={13} />
                  Ver histórico
                </button>
                <button
                  onClick={() => novoOrcamento(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold btn-gold"
                >
                  <Plus size={13} />
                  Novo orçamento
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {drawerCliente && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDrawerCliente(null)} />
          <div className="w-full max-w-[560px] bg-white h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <div className="flex items-center gap-3">
                <Avatar nome={drawerCliente.nome} />
                <div>
                  <h3 className="text-base font-semibold text-text-primary">{drawerCliente.nome}</h3>
                  <p className="text-xs text-text-muted">Cliente desde {new Date(drawerCliente.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <button onClick={() => setDrawerCliente(null)} className="p-1.5 rounded hover:bg-brand-input text-text-secondary">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {drawerCliente.orcamentos.length > 0 && (
                <div className="px-6 py-4 border-b border-brand-border">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Histórico de Orçamentos</p>
                  <div className="space-y-2">
                    {drawerCliente.orcamentos.map(o => (
                      <div key={o.id} className="py-2 border-b border-brand-border last:border-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {o.origemHistorico ? (o.servicoHistorico ?? 'Atendimento') : 'Orçamento'}
                            </p>
                            <p className="text-xs text-text-muted">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-text-primary">{o.precoFinalTotal ? fmt(Number(o.precoFinalTotal)) : '—'}</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-input text-text-muted">
                              {o.origemHistorico ? 'histórico' : o.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                        {o.origemHistorico && (
                          <div className="mt-1 text-xs text-text-secondary space-y-0.5">
                            {o.descricaoHistorico && <p>{o.descricaoHistorico}</p>}
                            <div className="flex flex-wrap gap-x-3 text-[11px] text-text-muted">
                              {(o.instalador?.nome ?? o.instaladorNomeOriginal) && (
                                <span>Instalador: {o.instalador?.nome ?? o.instaladorNomeOriginal}</span>
                              )}
                              {o.indicacaoHistorica && <span>Indicação: {o.indicacaoHistorica}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-6 py-4 space-y-4">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Dados Cadastrais</p>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome completo</label>
                  <input type="text" value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} className="input-base" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Telefone</label>
                  <input type="tel" value={editForm.telefone} onChange={e => setEditForm(p => ({ ...p, telefone: mascaraTelefone(e.target.value) }))} placeholder="(11) 99999-9999" className="input-base" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Email</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" className="input-base" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Endereço</label>
                  <input type="text" value={editForm.endereco} onChange={e => setEditForm(p => ({ ...p, endereco: e.target.value }))} className="input-base" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Bairro</label>
                  <input type="text" value={editForm.bairro} onChange={e => setEditForm(p => ({ ...p, bairro: e.target.value }))} placeholder="Bairro" className="input-base" />
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Arquiteto / RT</label>
                    <div className="flex rounded-lg overflow-hidden border border-brand-border">
                      <button
                        type="button"
                        onClick={() => setEditArquitetoModo('cadastro')}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${editArquitetoModo === 'cadastro' ? 'bg-gold-primary text-white' : 'bg-brand-input text-text-secondary hover:bg-brand-border'}`}
                      >
                        Cadastrado
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditArquitetoModo('manual')}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${editArquitetoModo === 'manual' ? 'bg-gold-primary text-white' : 'bg-brand-input text-text-secondary hover:bg-brand-border'}`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>
                  {editArquitetoModo === 'cadastro' ? (
                    <select value={editForm.arquitetoSelecionado} onChange={e => setEditForm(p => ({ ...p, arquitetoSelecionado: e.target.value }))} className="input-base">
                      <option value="">Sem arquiteto / RT</option>
                      {(drawerCliente.arquitetosDisponiveis?.length ? drawerCliente.arquitetosDisponiveis : arquitetos).map(arquiteto => (
                        <option key={arquiteto.id} value={arquiteto.nome}>{arquiteto.nome}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={editForm.arquitetoManual} onChange={e => setEditForm(p => ({ ...p, arquitetoManual: e.target.value }))} className="input-base" />
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-brand-border space-y-2">
              <button onClick={baixarFichaCliente} disabled={baixandoFicha} className="w-full h-11 rounded-[8px] text-sm font-semibold flex items-center justify-center gap-2 border border-brand-border text-text-secondary hover:bg-brand-input transition-colors disabled:opacity-70">
                {baixandoFicha ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
                Baixar ficha do cliente
              </button>
              <button onClick={salvarEdicao} disabled={saving} className="btn-gold w-full h-11 rounded-[8px] text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {novoDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setNovoDrawer(false)} />
          <div className="w-full max-w-[400px] bg-white h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h3 className="text-base font-semibold text-text-primary">Novo Cliente</h3>
              <button onClick={() => setNovoDrawer(false)} className="p-1.5 rounded hover:bg-brand-input text-text-secondary"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome completo *</label>
                <input type="text" value={novoForm.nome} onChange={e => setNovoForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do cliente" className="input-base" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Telefone</label>
                <input type="tel" value={novoForm.telefone} onChange={e => setNovoForm(p => ({ ...p, telefone: mascaraTelefone(e.target.value) }))} placeholder="(11) 99999-9999" className="input-base" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Email</label>
                <input type="email" value={novoForm.email} onChange={e => setNovoForm(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" className="input-base" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Endereço</label>
                <input type="text" value={novoForm.endereco} onChange={e => setNovoForm(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua, número" className="input-base" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Bairro</label>
                <input type="text" value={novoForm.bairro} onChange={e => setNovoForm(p => ({ ...p, bairro: e.target.value }))} placeholder="Bairro" className="input-base" />
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Arquiteto / RT</label>
                  <div className="flex rounded-lg overflow-hidden border border-brand-border">
                    <button
                      type="button"
                      onClick={() => setNovoArquitetoModo('cadastro')}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors ${novoArquitetoModo === 'cadastro' ? 'bg-gold-primary text-white' : 'bg-brand-input text-text-secondary hover:bg-brand-border'}`}
                    >
                      Cadastrado
                    </button>
                    <button
                      type="button"
                      onClick={() => setNovoArquitetoModo('manual')}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors ${novoArquitetoModo === 'manual' ? 'bg-gold-primary text-white' : 'bg-brand-input text-text-secondary hover:bg-brand-border'}`}
                    >
                      Manual
                    </button>
                  </div>
                </div>
                {novoArquitetoModo === 'cadastro' ? (
                  <select value={novoForm.arquitetoSelecionado} onChange={e => setNovoForm(p => ({ ...p, arquitetoSelecionado: e.target.value }))} className="input-base">
                    <option value="">Sem arquiteto / RT</option>
                    {arquitetos.map(arquiteto => (
                      <option key={arquiteto.id} value={arquiteto.nome}>{arquiteto.nome}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={novoForm.arquitetoManual} onChange={e => setNovoForm(p => ({ ...p, arquitetoManual: e.target.value }))} placeholder="Nome do arquiteto (opcional)" className="input-base" />
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-brand-border">
              <button onClick={criarCliente} disabled={saving || !novoForm.nome} className="btn-gold w-full h-11 rounded-[8px] text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Criar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
