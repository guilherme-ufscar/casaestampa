'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Pencil, Check, X, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useSession } from 'next-auth/react'

type Usuario = { id: string; nome: string; email: string; role: string; ativo: boolean; createdAt: string }

export default function UsuariosPage() {
  const { data: session } = useSession()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', role: 'VENDEDOR', ativo: true })
  const [erro, setErro] = useState('')

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/usuarios')
    setUsuarios(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsuarios() }, [fetchUsuarios])

  function abrirNovo() {
    setEditando(null)
    setForm({ nome: '', email: '', senha: '', role: 'VENDEDOR', ativo: true })
    setErro('')
    setDrawerOpen(true)
  }

  function abrirEditar(u: Usuario) {
    setEditando(u)
    setForm({ nome: u.nome, email: u.email, senha: '', role: u.role, ativo: u.ativo })
    setErro('')
    setDrawerOpen(true)
  }

  async function salvar() {
    if (!form.nome || !form.email) { setErro('Nome e email são obrigatórios'); return }
    if (!editando && !form.senha) { setErro('Senha obrigatória para novo usuário'); return }
    setSaving(true)
    setErro('')
    try {
      const payload: Record<string, unknown> = { nome: form.nome, email: form.email, role: form.role, ativo: form.ativo }
      if (form.senha) payload.senha = form.senha
      const url = editando ? `/api/usuarios/${editando.id}` : '/api/usuarios'
      const method = editando ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const data = await res.json()
        setErro(data.error ?? 'Erro ao salvar')
        return
      }
      setDrawerOpen(false)
      fetchUsuarios()
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtivo(u: Usuario) {
    if (u.id === session?.user?.id) return
    await fetch(`/api/usuarios/${u.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: !u.ativo }) })
    fetchUsuarios()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Usuários</h2>
          <p className="text-sm text-text-muted mt-0.5">{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''} cadastrado{usuarios.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={abrirNovo} className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-semibold">
          <UserPlus size={16} /> Adicionar Usuário
        </button>
      </div>

      <div className="card-base overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-bg">
              <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Perfil</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Criado em</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 size={20} className="animate-spin text-gold-primary mx-auto" /></td></tr>
            ) : usuarios.map((u, i) => (
              <tr key={u.id} className={`border-b border-[#F8F6F2] hover:bg-[#FDF8EE] transition-colors ${i % 2 === 1 ? 'bg-brand-bg/50' : ''}`}>
                <td className="px-4 py-3 font-medium text-text-primary">{u.nome}</td>
                <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${u.role === 'ADMIN' ? 'bg-gold-primary/10 text-gold-dark' : 'bg-blue-50 text-blue-600'}`}>
                    {u.role === 'ADMIN' ? 'Admin' : 'Vendedor'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleAtivo(u)} disabled={u.id === session?.user?.id} className="disabled:opacity-40 disabled:cursor-not-allowed">
                    {u.ativo
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-600">Ativo</span>
                      : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-text-muted">Inativo</span>
                    }
                  </button>
                </td>
                <td className="px-4 py-3 text-text-muted">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => abrirEditar(u)} className="p-1.5 rounded hover:bg-brand-input text-text-muted hover:text-gold-primary transition-colors">
                    <Pencil size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <div className="w-full max-w-[400px] bg-white h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h3 className="text-base font-semibold text-text-primary">{editando ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded hover:bg-brand-input text-text-secondary"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {[
                { key: 'nome', label: 'Nome completo *', type: 'text' },
                { key: 'email', label: 'Email *', type: 'email' },
                { key: 'senha', label: editando ? 'Nova senha (deixe em branco para manter)' : 'Senha temporária *', type: 'password' },
              ].map(({ key, label, type }) => (
                <div key={key} className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</label>
                  <input type={type} value={(form as unknown as Record<string, string>)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="input-base" />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Perfil</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="input-base">
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-text-primary">Ativo</span>
                <button onClick={() => setForm(p => ({ ...p, ativo: !p.ativo }))} className="text-gold-primary">
                  {form.ativo ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-text-muted" />}
                </button>
              </div>
              {erro && <p className="text-sm text-red-500">{erro}</p>}
            </div>
            <div className="px-6 py-4 border-t border-brand-border">
              <button onClick={salvar} disabled={saving} className="btn-gold w-full h-11 rounded-[8px] text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {editando ? 'Salvar Alterações' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
