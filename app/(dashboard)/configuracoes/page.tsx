'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Check, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'

type Tecido = {
  id: string
  nome: string
  larguraMaxima: number
  valorMetro: number
  tipo: 'PRINCIPAL' | 'BLACKOUT'
  ativo: boolean
}

type Trilho = {
  id: string
  nome: string
  valorUnitario: number
  ativo: boolean
}

type Instalador = {
  id: string
  nome: string
  telefone: string | null
  ativo: boolean
  especialidades: string[]
}

type Configs = Record<string, string>
type DrawerMode = 'create' | 'edit'

const LARGURAS = ['2.80', '3.00', '3.30', 'personalizado']
const ESPECIALIDADES_OPCOES = [
  { value: 'CORTINA', label: 'Cortina' },
  { value: 'PERSIANA', label: 'Persiana' },
  { value: 'PAPEL_PAREDE', label: 'Papel de Parede' },
  { value: 'PISO', label: 'Piso' },
]

const FATORES_LABELS: Record<string, string> = {
  fator_prega_macho: 'Prega Macho',
  fator_prega_femea: 'Prega Fêmea',
  fator_prega_americana: 'Prega Americana',
  fator_prega_franzida: 'Prega Franzida',
  fator_prega_reta: 'Prega Reta / Blackout',
  fator_wave: 'Wave',
  fator_soft_wave: 'Soft Wave',
  fator_varao: 'Varão',
}

function InstaladorTab() {
  const [instaladores, setInstaladores] = useState<Instalador[]>([])
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [especialidades, setEspecialidades] = useState<string[]>(['CORTINA', 'PERSIANA'])
  const [saving, setSaving] = useState(false)
  const [editando, setEditando] = useState<Instalador | null>(null)

  async function carregar() {
    const r = await fetch('/api/instaladores?incluirInativos=true')
    setInstaladores(await r.json())
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function toggleEspecialidade(value: string) {
    setEspecialidades(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value])
  }

  async function salvar() {
    setSaving(true)
    const payload = { nome, telefone, especialidades }
    if (editando) {
      await fetch(`/api/instaladores/${editando.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setEditando(null)
    } else {
      await fetch('/api/instaladores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setNome('')
    setTelefone('')
    setEspecialidades(['CORTINA', 'PERSIANA'])
    setSaving(false)
    carregar()
  }

  async function toggleAtivo(ins: Instalador) {
    await fetch(`/api/instaladores/${ins.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !ins.ativo }),
    })
    carregar()
  }

  function iniciarEdicao(ins: Instalador) {
    setEditando(ins)
    setNome(ins.nome)
    setTelefone(ins.telefone ?? '')
    setEspecialidades(ins.especialidades?.length ? ins.especialidades : ['CORTINA', 'PERSIANA'])
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="card-base p-6 space-y-4">
        <p className="text-sm font-semibold text-text-primary">{editando ? 'Editar Instalador' : 'Novo Instalador'}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do instalador" className="input-base" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">WhatsApp</label>
            <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" className="input-base" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Especialidades</label>
          <div className="flex flex-wrap gap-2">
            {ESPECIALIDADES_OPCOES.map(opcao => (
              <button
                key={opcao.value}
                type="button"
                onClick={() => toggleEspecialidade(opcao.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${especialidades.includes(opcao.value) ? 'bg-gold-primary text-white' : 'bg-brand-input text-text-secondary hover:bg-brand-border'}`}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          {editando && (
            <button onClick={() => { setEditando(null); setNome(''); setTelefone(''); setEspecialidades(['CORTINA', 'PERSIANA']) }} className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:bg-brand-input transition-colors">
              Cancelar
            </button>
          )}
          <button onClick={salvar} disabled={!nome || saving || especialidades.length === 0} className="btn-gold flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-semibold disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {editando ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>

      <div className="card-base overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-text-muted text-sm">Carregando...</p>
        ) : instaladores.length === 0 ? (
          <p className="p-6 text-center text-text-muted text-sm">Nenhum instalador cadastrado</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg">
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">WhatsApp</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Especialidades</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody>
              {instaladores.map(ins => (
                <tr key={ins.id} className="border-b border-brand-border last:border-0 hover:bg-brand-bg/50">
                  <td className="px-4 py-3 font-medium text-text-primary">{ins.nome}</td>
                  <td className="px-4 py-3 text-text-secondary">{ins.telefone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(ins.especialidades ?? []).map(esp => (
                        <span key={esp} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-input text-text-secondary">
                          {ESPECIALIDADES_OPCOES.find(item => item.value === esp)?.label ?? esp}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => iniciarEdicao(ins)} className="p-1.5 rounded hover:bg-brand-input text-text-muted hover:text-gold-primary transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => toggleAtivo(ins)} className="text-xs px-2 py-1 rounded border border-brand-border text-text-secondary hover:bg-brand-input transition-colors">
                        {ins.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function ConfiguracoesPage() {
  const [aba, setAba] = useState<'tecidos' | 'blackouts' | 'trilhos' | 'instaladores' | 'fatores' | 'markup' | 'confeccao' | 'pdf'>('tecidos')
  const [tecidos, setTecidos] = useState<Tecido[]>([])
  const [trilhos, setTrilhos] = useState<Trilho[]>([])
  const [configs, setConfigs] = useState<Configs>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create')
  const [drawerTipo, setDrawerTipo] = useState<'tecido' | 'trilho'>('tecido')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    larguraMaxima: '2.80',
    larguraCustom: '',
    valorMetro: '',
    valorUnitario: '',
    tipo: 'PRINCIPAL' as 'PRINCIPAL' | 'BLACKOUT',
    ativo: true,
  })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [tRes, trRes, cRes] = await Promise.all([
      fetch('/api/tecidos'),
      fetch('/api/trilhos'),
      fetch('/api/configuracoes'),
    ])
    setTecidos(await tRes.json())
    setTrilhos(await trRes.json())
    setConfigs(await cRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function openDrawer(tipo: 'tecido' | 'trilho', mode: DrawerMode, item?: Tecido | Trilho) {
    setDrawerTipo(tipo)
    setDrawerMode(mode)
    if (mode === 'edit' && item) {
      setEditingId(item.id)
      if (tipo === 'tecido') {
        const t = item as Tecido
        const larg = String(t.larguraMaxima)
        setForm({
          nome: t.nome,
          larguraMaxima: LARGURAS.includes(larg) ? larg : 'personalizado',
          larguraCustom: LARGURAS.includes(larg) ? '' : larg,
          valorMetro: String(t.valorMetro),
          valorUnitario: '',
          tipo: t.tipo,
          ativo: t.ativo,
        })
      } else {
        const tr = item as Trilho
        setForm({ nome: tr.nome, larguraMaxima: '2.80', larguraCustom: '', valorMetro: '', valorUnitario: String(tr.valorUnitario), tipo: 'PRINCIPAL', ativo: tr.ativo })
      }
    } else {
      setEditingId(null)
      setForm({ nome: '', larguraMaxima: '2.80', larguraCustom: '', valorMetro: '', valorUnitario: '', tipo: tipo === 'tecido' ? (aba === 'blackouts' ? 'BLACKOUT' : 'PRINCIPAL') : 'PRINCIPAL', ativo: true })
    }
    setDrawerOpen(true)
  }

  async function saveDrawer() {
    setSaving(true)
    const largura = form.larguraMaxima === 'personalizado' ? form.larguraCustom : form.larguraMaxima
    try {
      if (drawerTipo === 'tecido') {
        const payload = { nome: form.nome, larguraMaxima: largura, valorMetro: form.valorMetro, tipo: form.tipo, ativo: form.ativo }
        if (drawerMode === 'create') {
          await fetch('/api/tecidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        } else {
          await fetch(`/api/tecidos/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        }
      } else {
        const payload = { nome: form.nome, valorUnitario: form.valorUnitario, ativo: form.ativo }
        if (drawerMode === 'create') {
          await fetch('/api/trilhos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        } else {
          await fetch(`/api/trilhos/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        }
      }
      setDrawerOpen(false)
      fetchAll()
    } finally {
      setSaving(false)
    }
  }

  async function deleteTecido(id: string) {
    if (!confirm('Excluir este tecido?')) return
    await fetch(`/api/tecidos/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  async function deleteTrilho(id: string) {
    if (!confirm('Excluir este trilho/varão?')) return
    await fetch(`/api/trilhos/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  async function saveConfigs() {
    setSaving(true)
    await fetch('/api/configuracoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(configs) })
    setSaving(false)
  }

  const tecidosFiltrados = tecidos.filter(t => aba === 'tecidos' ? t.tipo === 'PRINCIPAL' : t.tipo === 'BLACKOUT')

  const abas = [
    { key: 'tecidos', label: 'Tecidos' },
    { key: 'blackouts', label: 'Blackouts' },
    { key: 'trilhos', label: 'Trilhos e Varões' },
    { key: 'instaladores', label: 'Instaladores' },
    { key: 'fatores', label: 'Fatores de Prega' },
    { key: 'markup', label: 'Markup e Comissões' },
    { key: 'confeccao', label: 'Confecção e Instalação' },
    { key: 'pdf', label: 'PDF e WhatsApp' },
  ] as const

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-text-primary">Configurações</h2>

      <div className="flex gap-1 border-b border-brand-border overflow-x-auto">
        {abas.map(a => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              aba === a.key
                ? 'border-gold-primary text-gold-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gold-primary" />
        </div>
      ) : (
        <>
          {(aba === 'tecidos' || aba === 'blackouts') && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => openDrawer('tecido', 'create')}
                  className="btn-gold flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-semibold"
                >
                  <Plus size={16} />
                  {aba === 'tecidos' ? 'Novo Tecido' : 'Novo Blackout'}
                </button>
              </div>
              <div className="card-base overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-bg">
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Largura</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">R$/metro</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {tecidosFiltrados.map((t, i) => (
                      <tr key={t.id} className={`border-b border-brand-border last:border-0 ${i % 2 === 0 ? '' : 'bg-brand-bg/50'}`}>
                        <td className="px-4 py-3 font-medium text-text-primary">{t.nome}</td>
                        <td className="px-4 py-3 text-text-secondary">{Number(t.larguraMaxima).toFixed(2)}m</td>
                        <td className="px-4 py-3 text-text-secondary">R$ {Number(t.valorMetro).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${t.ativo ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-text-muted'}`}>
                            {t.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => openDrawer('tecido', 'edit', t)} className="p-1.5 rounded hover:bg-brand-input text-text-secondary transition-colors">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => deleteTecido(t.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tecidosFiltrados.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">Nenhum item cadastrado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {aba === 'trilhos' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => openDrawer('trilho', 'create')} className="btn-gold flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-semibold">
                  <Plus size={16} />
                  Novo Trilho/Varão
                </button>
              </div>
              <div className="card-base overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-bg">
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Valor Unitário</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {trilhos.map((tr, i) => (
                      <tr key={tr.id} className={`border-b border-brand-border last:border-0 ${i % 2 === 0 ? '' : 'bg-brand-bg/50'}`}>
                        <td className="px-4 py-3 font-medium text-text-primary">{tr.nome}</td>
                        <td className="px-4 py-3 text-text-secondary">R$ {Number(tr.valorUnitario).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${tr.ativo ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-text-muted'}`}>
                            {tr.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => openDrawer('trilho', 'edit', tr)} className="p-1.5 rounded hover:bg-brand-input text-text-secondary transition-colors">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => deleteTrilho(tr.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {trilhos.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted text-sm">Nenhum item cadastrado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {aba === 'fatores' && (
            <div className="space-y-4">
              <div className="card-base overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-bg">
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Modelo</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Fator Multiplicador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(FATORES_LABELS).map(([chave, label], i) => (
                      <tr key={chave} className={`border-b border-brand-border last:border-0 ${i % 2 === 0 ? '' : 'bg-brand-bg/50'}`}>
                        <td className="px-4 py-3 font-medium text-text-primary">{label}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={configs[chave] ?? ''}
                            onChange={e => setConfigs(prev => ({ ...prev, [chave]: e.target.value }))}
                            className="w-28 input-base h-9 text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button onClick={saveConfigs} disabled={saving} className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-sm font-semibold disabled:opacity-70">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Salvar Fatores
                </button>
              </div>
            </div>
          )}

          {aba === 'markup' && (
            <div className="space-y-4 max-w-md">
              <div className="card-base p-6 space-y-5">
                {[
                  { chave: 'markup_padrao', label: 'Markup Padrão', suffix: '%' },
                  { chave: 'comissao_padrao', label: 'Comissão Vendedor', suffix: '%' },
                  { chave: 'rt_padrao', label: 'RT / Arquiteto', suffix: '%' },
                ].map(({ chave, label, suffix }) => (
                  <div key={chave} className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={configs[chave] ?? ''}
                        onChange={e => setConfigs(prev => ({ ...prev, [chave]: e.target.value }))}
                        className="input-base pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">{suffix}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={saveConfigs} disabled={saving} className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-sm font-semibold disabled:opacity-70">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Salvar
                </button>
              </div>
            </div>
          )}

          {aba === 'confeccao' && (
            <div className="space-y-4 max-w-md">
              <div className="card-base p-6 space-y-5">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">Confecção por m² — Costureira Cici</p>
                {[
                  { chave: 'confeccao_prega_macho', label: 'Prega Macho (R$/m²)' },
                  { chave: 'confeccao_prega_femea', label: 'Prega Fêmea (R$/m²)' },
                  { chave: 'confeccao_prega_americana', label: 'Prega Americana (R$/m²)' },
                  { chave: 'confeccao_prega_franzida', label: 'Prega Franzida (R$/m²)' },
                  { chave: 'confeccao_prega_reta', label: 'Prega Reta / Blackout (R$/m²)' },
                  { chave: 'confeccao_wave', label: 'Wave (R$/m²)' },
                  { chave: 'confeccao_soft_wave', label: 'Soft Wave (R$/m²)' },
                  { chave: 'confeccao_varao', label: 'Varão / Ilhões (R$/m²)' },
                ].map(({ chave, label }) => (
                  <div key={chave} className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm leading-none pointer-events-none">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={configs[chave] ?? ''}
                        onChange={e => setConfigs(prev => ({ ...prev, [chave]: e.target.value }))}
                        className="input-base pl-12"
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-brand-border">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-4">Instalação</p>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Instalação (R$/m²)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm leading-none pointer-events-none">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={configs['instalacao_valor_m2'] ?? ''}
                        onChange={e => setConfigs(prev => ({ ...prev, instalacao_valor_m2: e.target.value }))}
                        className="input-base pl-12"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={saveConfigs} disabled={saving} className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-sm font-semibold disabled:opacity-70">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Salvar
                </button>
              </div>
            </div>
          )}

          {aba === 'instaladores' && (
            <InstaladorTab />
          )}

          {aba === 'pdf' && (
            <div className="space-y-4 max-w-2xl">
              <div className="card-base p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Condições Comerciais</label>
                  <textarea
                    rows={5}
                    value={configs.condicoes_comerciais ?? ''}
                    onChange={e => setConfigs(prev => ({ ...prev, condicoes_comerciais: e.target.value }))}
                    placeholder="Ex: Este orçamento tem validade de 15 dias..."
                    className="input-base h-auto py-3 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Validade padrão do orçamento (dias)</label>
                  <input
                    type="number"
                    min="1"
                    value={configs.validade_orcamento_dias ?? '15'}
                    onChange={e => setConfigs(prev => ({ ...prev, validade_orcamento_dias: e.target.value }))}
                    className="input-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Texto de encerramento WhatsApp</label>
                  <textarea
                    rows={3}
                    value={configs.whatsapp_encerramento ?? ''}
                    onChange={e => setConfigs(prev => ({ ...prev, whatsapp_encerramento: e.target.value }))}
                    placeholder="Ex: Qualquer dúvida estou à disposição! Att, Equipe Casa Estampa"
                    className="input-base h-auto py-3 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Telefone da empresa (para o PDF)</label>
                  <input
                    type="tel"
                    value={configs.telefone_empresa ?? ''}
                    onChange={e => setConfigs(prev => ({ ...prev, telefone_empresa: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="input-base"
                  />
                </div>
              </div>

              <div className="card-base p-6 space-y-5">
                <p className="text-sm font-semibold text-text-primary">WhatsApp dos Fornecedores</p>
                {[
                  { key: 'whatsapp_deccor', label: 'Deccor (Tecidos)' },
                  { key: 'whatsapp_venetillo', label: 'Venetillo (Trilhos)' },
                  { key: 'whatsapp_rioflex', label: 'Rio Flex (Trilhos)' },
                  { key: 'whatsapp_costureira_cici', label: 'Costureira Cici (Confecção)' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</label>
                    <input
                      type="tel"
                      value={(configs as Record<string, string>)[key] ?? ''}
                      onChange={e => setConfigs(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="input-base"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={saveConfigs} disabled={saving} className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-sm font-semibold disabled:opacity-70">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Salvar
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <div className="w-full max-w-[400px] bg-white h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h3 className="text-base font-semibold text-text-primary">
                {drawerMode === 'create' ? 'Novo' : 'Editar'}{' '}
                {drawerTipo === 'tecido' ? (aba === 'blackouts' ? 'Blackout' : 'Tecido') : 'Trilho/Varão'}
              </h3>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded hover:bg-brand-input text-text-secondary">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome</label>
                <input type="text" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="input-base" placeholder="Nome do item" />
              </div>

              {drawerTipo === 'tecido' && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Largura Máxima</label>
                    <select value={form.larguraMaxima} onChange={e => setForm(p => ({ ...p, larguraMaxima: e.target.value }))} className="input-base">
                      <option value="2.80">2,80m</option>
                      <option value="3.00">3,00m</option>
                      <option value="3.30">3,30m</option>
                      <option value="personalizado">Personalizado</option>
                    </select>
                  </div>
                  {form.larguraMaxima === 'personalizado' && (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Largura (metros)</label>
                      <input type="number" step="0.01" value={form.larguraCustom} onChange={e => setForm(p => ({ ...p, larguraCustom: e.target.value }))} className="input-base" placeholder="Ex: 2.60" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Valor por Metro (R$)</label>
                    <input type="number" step="0.01" value={form.valorMetro} onChange={e => setForm(p => ({ ...p, valorMetro: e.target.value }))} className="input-base" placeholder="0,00" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Tipo</label>
                    <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as 'PRINCIPAL' | 'BLACKOUT' }))} className="input-base">
                      <option value="PRINCIPAL">Principal</option>
                      <option value="BLACKOUT">Blackout</option>
                    </select>
                  </div>
                </>
              )}

              {drawerTipo === 'trilho' && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Valor Unitário (R$)</label>
                  <input type="number" step="0.01" value={form.valorUnitario} onChange={e => setForm(p => ({ ...p, valorUnitario: e.target.value }))} className="input-base" placeholder="0,00" />
                </div>
              )}

              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-text-primary">Ativo</span>
                <button onClick={() => setForm(p => ({ ...p, ativo: !p.ativo }))} className="text-gold-primary">
                  {form.ativo ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-text-muted" />}
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-brand-border">
              <button onClick={saveDrawer} disabled={saving} className="btn-gold w-full h-11 rounded-[8px] text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {drawerMode === 'create' ? 'Criar' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
