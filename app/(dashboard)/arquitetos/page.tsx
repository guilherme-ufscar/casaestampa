'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, Pencil, Plus, X } from 'lucide-react'

type Arquiteto = {
  id: string
  nome: string
  telefone: string
  email: string
  observacoes: string
  ativo: boolean
  createdAt: string
  updatedAt: string
}

function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

export default function ArquitetosPage() {
  const [arquitetos, setArquitetos] = useState<Arquiteto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editando, setEditando] = useState<Arquiteto | null>(null)
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', observacoes: '', ativo: true })

  const carregar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/arquitetos?incluirInativos=true')
    setArquitetos(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function abrirNovo() {
    setEditando(null)
    setForm({ nome: '', telefone: '', email: '', observacoes: '', ativo: true })
    setDrawerOpen(true)
  }

  function abrirEdicao(arquiteto: Arquiteto) {
    setEditando(arquiteto)
    setForm({ nome: arquiteto.nome, telefone: arquiteto.telefone, email: arquiteto.email, observacoes: arquiteto.observacoes, ativo: arquiteto.ativo })
    setDrawerOpen(true)
  }

  async function salvar() {
    if (!form.nome) return
    setSaving(true)
    const payload = { ...form, telefone: mascaraTelefone(form.telefone) }
    const res = await fetch(editando ? `/api/arquitetos/${editando.id}` : '/api/arquitetos', {
      method: editando ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setDrawerOpen(false)
      setEditando(null)
      setForm({ nome: '', telefone: '', email: '', observacoes: '', ativo: true })
      carregar()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Arquitetos</h2>
          <p className="text-sm text-text-muted mt-0.5">Cadastro de arquitetos e responsáveis técnicos</p>
        </div>
        <button onClick={abrirNovo} className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-semibold">
          <Plus size={16} />
          Novo Arquiteto
        </button>
      </div>

      <div className="card-base overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-gold-primary" /></div>
        ) : arquitetos.length === 0 ? (
          <div className="px-4 py-12 text-center text-text-muted text-sm">Nenhum arquiteto cadastrado</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg">
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Contato</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {arquitetos.map(arquiteto => (
                <tr key={arquiteto.id} className="border-b border-brand-border last:border-0 hover:bg-brand-bg/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{arquiteto.nome}</p>
                    {arquiteto.observacoes && <p className="text-xs text-text-muted mt-0.5 truncate max-w-md">{arquiteto.observacoes}</p>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    <p>{arquiteto.telefone || '—'}</p>
                    <p className="text-xs text-text-muted mt-0.5">{arquiteto.email || 'Sem e-mail'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${arquiteto.ativo ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-text-muted'}`}>
                      {arquiteto.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => abrirEdicao(arquiteto)} className="p-1.5 rounded hover:bg-brand-input text-text-muted hover:text-gold-primary transition-colors">
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <div className="w-full max-w-[420px] bg-white h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h3 className="text-base font-semibold text-text-primary">{editando ? 'Editar Arquiteto' : 'Novo Arquiteto'}</h3>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded hover:bg-brand-input text-text-secondary"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome *</label>
                <input type="text" value={form.nome} onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))} className="input-base" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">WhatsApp</label>
                <input type="tel" value={form.telefone} onChange={e => setForm(prev => ({ ...prev, telefone: mascaraTelefone(e.target.value) }))} className="input-base" placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} className="input-base" placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))} rows={4} className="input-base h-auto py-3 resize-none" />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-text-primary">Ativo</span>
                <button onClick={() => setForm(prev => ({ ...prev, ativo: !prev.ativo }))} className="text-gold-primary">
                  {form.ativo ? <Check size={16} /> : <X size={16} />}
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-brand-border">
              <button onClick={salvar} disabled={saving || !form.nome} className="btn-gold w-full h-11 rounded-[8px] text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {editando ? 'Salvar alterações' : 'Criar arquiteto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
