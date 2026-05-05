'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, ChevronRight, SkipForward } from 'lucide-react'
import { useOrcamento, ClienteOrcamento } from '@/context/OrcamentoContext'

type ClienteAPI = {
  id: string
  nome: string
  telefone?: string
  email?: string
  endereco?: string
  arquiteto?: string
}

export default function Etapa1Cliente() {
  const { setCliente, setEtapa } = useOrcamento()
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<ClienteAPI[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteAPI | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', endereco: '', arquiteto: '' })
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (busca.length < 2) { setResultados([]); setShowDropdown(false); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(busca)}`)
      const data = await res.json()
      setResultados(data.slice(0, 6))
      setShowDropdown(true)
    }, 300)
    return () => clearTimeout(t)
  }, [busca])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selecionarCliente(c: ClienteAPI) {
    setClienteSelecionado(c)
    setBusca(c.nome)
    setShowDropdown(false)
  }

  function usarClienteSelecionado() {
    if (!clienteSelecionado) return
    setCliente({ id: clienteSelecionado.id, nome: clienteSelecionado.nome, telefone: clienteSelecionado.telefone, email: clienteSelecionado.email, endereco: clienteSelecionado.endereco, arquiteto: clienteSelecionado.arquiteto })
    setEtapa(2)
  }

  function pular() {
    setCliente(null)
    setEtapa(2)
  }

  function proximo() {
    if (!form.nome || !form.telefone) return
    const c: ClienteOrcamento = { nome: form.nome, telefone: form.telefone, email: form.email, endereco: form.endereco, arquiteto: form.arquiteto }
    setCliente(c)
    setEtapa(2)
  }

  return (
    <div className="card-base p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Etapa 1 — Cliente</h3>
        <button onClick={pular} className="flex items-center gap-1.5 text-sm font-medium text-gold-primary hover:text-gold-dark transition-colors">
          <SkipForward size={15} />
          Pular esta etapa
        </button>
      </div>

      {/* Busca */}
      <div className="space-y-2">
        <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Buscar cliente existente</label>
        <div className="relative" ref={dropdownRef}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={busca}
            onChange={e => { setBusca(e.target.value); setClienteSelecionado(null) }}
            placeholder="Nome, telefone ou email..."
            className="input-base pl-9"
          />
          {showDropdown && resultados.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded-xl shadow-card-hover z-20 overflow-hidden">
              {resultados.map(c => (
                <button
                  key={c.id}
                  onClick={() => selecionarCliente(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-bg text-left transition-colors border-b border-brand-border last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-primary to-gold-light flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-white">{c.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{c.nome}</p>
                    <p className="text-xs text-text-muted truncate">{c.telefone}{c.email ? ` · ${c.email}` : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {clienteSelecionado && (
          <div className="flex items-center justify-between p-4 bg-brand-bg border border-brand-border rounded-xl mt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-primary to-gold-light flex items-center justify-center">
                <span className="text-sm font-semibold text-white">{clienteSelecionado.nome.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{clienteSelecionado.nome}</p>
                <p className="text-xs text-text-muted">{clienteSelecionado.telefone}{clienteSelecionado.email ? ` · ${clienteSelecionado.email}` : ''}</p>
              </div>
            </div>
            <button onClick={usarClienteSelecionado} className="btn-gold flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold">
              Usar este cliente
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-brand-border" />
        <span className="text-xs text-text-muted font-medium">ou cadastre um novo cliente</span>
        <div className="flex-1 h-px bg-brand-border" />
      </div>

      {/* Formulário */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome completo *</label>
          <input type="text" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do cliente" className="input-base" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Telefone *</label>
          <input type="tel" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(11) 99999-9999" className="input-base" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Email</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" className="input-base" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Endereço</label>
          <input type="text" value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua, número, bairro" className="input-base" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Arquiteto / RT responsável</label>
          <input type="text" value={form.arquiteto} onChange={e => setForm(p => ({ ...p, arquiteto: e.target.value }))} placeholder="Nome do arquiteto (opcional)" className="input-base" />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={proximo}
          disabled={!form.nome || !form.telefone}
          className="btn-gold flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próximo — Produto
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
