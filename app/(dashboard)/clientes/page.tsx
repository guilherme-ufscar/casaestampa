'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, UserPlus, MapPin, Phone, Mail, User, X, Pencil, Loader2, Check, FileText, Plus } from 'lucide-react'
import Link from 'next/link'

type Orcamento = { id: string; precoFinalTotal: number | null; status: string; createdAt: string }
type Cliente = {
  id: string; nome: string; telefone?: string; email?: string
  endereco?: string; arquiteto?: string; createdAt: string
  orcamentos: Orcamento[]
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

function Avatar({ nome }: { nome: string }) {
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-semibold text-lg"
      style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)' }}>
      {nome.charAt(0).toUpperCase()}
    </div>
  )
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [drawerCliente, setDrawerCliente] = useState<Cliente | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', telefone: '', email: '', endereco: '', arquiteto: '' })
  const [saving, setSaving] = useState(false)
  const [novoDrawer, setNovoDrawer] = useState(false)
  const [novoForm, setNovoForm] = useState({ nome: '', telefone: '', email: '', endereco: '', arquiteto: '' })

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ filtro })
    if (busca) params.set('q', busca)
    const res = await fetch(`/api/clientes?${params}`)
    setClientes(await res.json())
    setLoading(false)
  }, [busca, filtro])

  useEffect(() => {
    const t = setTimeout(fetchClientes, busca ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchClientes, busca])

  function abrirDrawer(c: Cliente) {
    setDrawerCliente(c)
    setEditForm({ nome: c.nome, telefone: c.telefone ?? '', email: c.email ?? '', endereco: c.endereco ?? '', arquiteto: c.arquiteto ?? '' })
  }

  async function salvarEdicao() {
    if (!drawerCliente) return
    setSaving(true)
    await fetch(`/api/clientes/${drawerCliente.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setSaving(false)
    setDrawerCliente(null)
    fetchClientes()
  }

  async function criarCliente() {
    if (!novoForm.nome) return
    setSaving(true)
    await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoForm),
    })
    setSaving(false)
    setNovoDrawer(false)
    setNovoForm({ nome: '', telefone: '', email: '', endereco: '', arquiteto: '' })
    fetchClientes()
  }

  const totalOrcamentos = (c: Cliente) => c.orcamentos.length
  const valorTotal = (c: Cliente) => c.orcamentos.reduce((s, o) => s + (o.precoFinalTotal ? Number(o.precoFinalTotal) : 0), 0)
  const ultimoOrcamento = (c: Cliente) => c.orcamentos[0]?.createdAt

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Clientes</h2>
          <p className="text-sm text-text-muted mt-0.5">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} encontrado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setNovoDrawer(true)}
          className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-semibold"
        >
          <UserPlus size={16} />
          Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone ou email..."
          className="input-base pl-9"
        />
      </div>

      {/* Filtros */}
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

      {/* Grid */}
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
              {/* Topo */}
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
                  {c.endereco && (
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-text-muted shrink-0" />
                      <span className="text-xs text-text-muted truncate">{c.endereco}</span>
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

              {/* Divider */}
              <div className="h-px bg-brand-border" />

              {/* Pills */}
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

              {/* Botões */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => abrirDrawer(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-brand-border text-text-secondary hover:bg-brand-input transition-colors"
                >
                  <Pencil size={13} />
                  Ver histórico
                </button>
                <Link
                  href="/orcamentos/novo"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold btn-gold"
                >
                  <Plus size={13} />
                  Novo orçamento
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer edição */}
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
              {/* Histórico */}
              {drawerCliente.orcamentos.length > 0 && (
                <div className="px-6 py-4 border-b border-brand-border">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Histórico de Orçamentos</p>
                  <div className="space-y-2">
                    {drawerCliente.orcamentos.map(o => (
                      <div key={o.id} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0">
                        <div>
                          <p className="text-sm font-medium text-text-primary">Orçamento</p>
                          <p className="text-xs text-text-muted">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-text-primary">{o.precoFinalTotal ? fmt(Number(o.precoFinalTotal)) : '—'}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-input text-text-muted">{o.status.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulário edição */}
              <div className="px-6 py-4 space-y-4">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Dados Cadastrais</p>
                {[
                  { key: 'nome', label: 'Nome completo', type: 'text' },
                  { key: 'telefone', label: 'Telefone', type: 'tel' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'endereco', label: 'Endereço', type: 'text' },
                  { key: 'arquiteto', label: 'Arquiteto / RT', type: 'text' },
                ].map(({ key, label, type }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</label>
                    <input
                      type={type}
                      value={(editForm as Record<string, string>)[key]}
                      onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                      className="input-base"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-brand-border">
              <button onClick={salvarEdicao} disabled={saving} className="btn-gold w-full h-11 rounded-[8px] text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer novo cliente */}
      {novoDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setNovoDrawer(false)} />
          <div className="w-full max-w-[400px] bg-white h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h3 className="text-base font-semibold text-text-primary">Novo Cliente</h3>
              <button onClick={() => setNovoDrawer(false)} className="p-1.5 rounded hover:bg-brand-input text-text-secondary"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {[
                { key: 'nome', label: 'Nome completo *', type: 'text' },
                { key: 'telefone', label: 'Telefone', type: 'tel' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'endereco', label: 'Endereço', type: 'text' },
                { key: 'arquiteto', label: 'Arquiteto / RT', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key} className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</label>
                  <input type={type} value={(novoForm as Record<string, string>)[key]} onChange={e => setNovoForm(p => ({ ...p, [key]: e.target.value }))} className="input-base" />
                </div>
              ))}
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
