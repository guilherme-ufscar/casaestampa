'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Check, Loader2, ToggleLeft, ToggleRight, Star } from 'lucide-react'

type Tecido = {
  id: string
  nome: string
  larguraMaxima: number
  valorMetro: number
  tipo: 'PRINCIPAL' | 'BLACKOUT' | 'DECORACAO'
  categoria: string | null
  ativo: boolean
  favorito: boolean
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

type PapelParede = {
  id: string
  album: string
  referencia: string
  dimensao: string
  valorRolo: number
  ativo: boolean
}

const DIMENSOES_PAPEL = [
  { value: '0.53x10', label: '0,53 × 10m' },
  { value: '0.70x10', label: '0,70 × 10m' },
  { value: '1.00x10', label: '1,00 × 10m' },
]

function PapeisTab() {
  const [papeis, setPapeis] = useState<PapelParede[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editando, setEditando] = useState<PapelParede | null>(null)
  const [form, setForm] = useState({ album: '', referencia: '', dimensao: '0.53x10', valorRolo: '' })

  async function carregar() {
    const r = await fetch('/api/papeis-parede')
    setPapeis(await r.json())
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function iniciarEdicao(p: PapelParede) {
    setEditando(p)
    setForm({ album: p.album, referencia: p.referencia, dimensao: p.dimensao, valorRolo: String(p.valorRolo) })
  }

  function cancelar() {
    setEditando(null)
    setForm({ album: '', referencia: '', dimensao: '0.53x10', valorRolo: '' })
  }

  async function salvar() {
    if (!form.album || !form.referencia || !form.valorRolo) return
    setSaving(true)
    if (editando) {
      await fetch(`/api/papeis-parede/${editando.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/papeis-parede', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    cancelar()
    setSaving(false)
    carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este papel de parede?')) return
    await fetch(`/api/papeis-parede/${id}`, { method: 'DELETE' })
    carregar()
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="card-base p-6 space-y-4">
        <p className="text-sm font-semibold text-text-primary">{editando ? 'Editar Papel de Parede' : 'Novo Papel de Parede'}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Álbum / Modelo *</label>
            <input value={form.album} onChange={e => setForm(p => ({ ...p, album: e.target.value }))} placeholder="Ex: Sugestões, Eco, Tropical" className="input-base" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Referência *</label>
            <input value={form.referencia} onChange={e => setForm(p => ({ ...p, referencia: e.target.value }))} placeholder="Ex: REF-001" className="input-base" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Dimensão</label>
            <select value={form.dimensao} onChange={e => setForm(p => ({ ...p, dimensao: e.target.value }))} className="input-base">
              {DIMENSOES_PAPEL.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Valor do Rolo (R$) *</label>
            <input type="number" step="0.01" value={form.valorRolo} onChange={e => setForm(p => ({ ...p, valorRolo: e.target.value }))} placeholder="0,00" className="input-base" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          {editando && <button onClick={cancelar} className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:bg-brand-input transition-colors">Cancelar</button>}
          <button onClick={salvar} disabled={!form.album || !form.referencia || !form.valorRolo || saving} className="btn-gold flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-semibold disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {editando ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>

      <div className="card-base overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-text-muted text-sm">Carregando...</p>
        ) : papeis.length === 0 ? (
          <p className="p-6 text-center text-text-muted text-sm">Nenhum papel de parede cadastrado</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg">
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Álbum</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Referência</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Dimensão</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Valor/Rolo</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {papeis.map(p => (
                <tr key={p.id} className="border-b border-brand-border last:border-0 hover:bg-brand-bg/50">
                  <td className="px-4 py-3 font-medium text-text-primary">{p.album}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.referencia}</td>
                  <td className="px-4 py-3 text-text-secondary">{DIMENSOES_PAPEL.find(d => d.value === p.dimensao)?.label ?? p.dimensao}</td>
                  <td className="px-4 py-3 text-text-secondary">R$ {Number(p.valorRolo).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => iniciarEdicao(p)} className="p-1.5 rounded hover:bg-brand-input text-text-muted hover:text-gold-primary transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => excluir(p.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors"><Trash2 size={14} /></button>
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

type FornecedorCadastro = {
  id: string
  nomeEmpresa: string
  vendedor: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  contaBancaria: string | null
  pix: string | null
  observacoes: string | null
  ativo: boolean
}

function FornecedoresTab() {
  const [fornecedores, setFornecedores] = useState<FornecedorCadastro[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editando, setEditando] = useState<FornecedorCadastro | null>(null)
  const [form, setForm] = useState({
    nomeEmpresa: '', vendedor: '', telefone: '', email: '',
    endereco: '', contaBancaria: '', pix: '', observacoes: '',
  })

  async function carregar() {
    const r = await fetch('/api/fornecedores-cadastro')
    setFornecedores(await r.json())
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function iniciarEdicao(f: FornecedorCadastro) {
    setEditando(f)
    setForm({ nomeEmpresa: f.nomeEmpresa, vendedor: f.vendedor ?? '', telefone: f.telefone ?? '', email: f.email ?? '', endereco: f.endereco ?? '', contaBancaria: f.contaBancaria ?? '', pix: f.pix ?? '', observacoes: f.observacoes ?? '' })
  }

  function cancelar() {
    setEditando(null)
    setForm({ nomeEmpresa: '', vendedor: '', telefone: '', email: '', endereco: '', contaBancaria: '', pix: '', observacoes: '' })
  }

  async function salvar() {
    if (!form.nomeEmpresa) return
    setSaving(true)
    if (editando) {
      await fetch(`/api/fornecedores-cadastro/${editando.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/fornecedores-cadastro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    cancelar()
    setSaving(false)
    carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este fornecedor?')) return
    await fetch(`/api/fornecedores-cadastro/${id}`, { method: 'DELETE' })
    carregar()
  }

  const campos = [
    { key: 'nomeEmpresa', label: 'Nome da Empresa *', placeholder: 'Ex: Deccor Casa' },
    { key: 'vendedor', label: 'Vendedor / Atendente', placeholder: 'Nome do contato' },
    { key: 'telefone', label: 'Telefone / WhatsApp', placeholder: '(11) 99999-9999' },
    { key: 'email', label: 'E-mail', placeholder: 'vendedor@empresa.com.br' },
    { key: 'endereco', label: 'Endereço', placeholder: 'Rua, número, bairro, cidade' },
    { key: 'contaBancaria', label: 'Conta Bancária', placeholder: 'Banco, agência, conta' },
    { key: 'pix', label: 'Pix', placeholder: 'Chave Pix' },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="card-base p-6 space-y-4">
        <p className="text-sm font-semibold text-text-primary">{editando ? 'Editar Fornecedor' : 'Novo Fornecedor'}</p>
        <div className="grid grid-cols-2 gap-3">
          {campos.map(({ key, label, placeholder }) => (
            <div key={key} className={`space-y-1.5 ${key === 'endereco' || key === 'contaBancaria' ? 'col-span-2' : ''}`}>
              <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</label>
              <input
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="input-base"
              />
            </div>
          ))}
          <div className="col-span-2 space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} placeholder="Informações adicionais..." className="input-base h-auto py-3 resize-none" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          {editando && <button onClick={cancelar} className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:bg-brand-input transition-colors">Cancelar</button>}
          <button onClick={salvar} disabled={!form.nomeEmpresa || saving} className="btn-gold flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-semibold disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {editando ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>

      <div className="card-base overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-text-muted text-sm">Carregando...</p>
        ) : fornecedores.length === 0 ? (
          <p className="p-6 text-center text-text-muted text-sm">Nenhum fornecedor cadastrado</p>
        ) : (
          <div className="divide-y divide-brand-border">
            {fornecedores.map(f => (
              <div key={f.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-semibold text-text-primary">{f.nomeEmpresa}</p>
                    {f.vendedor && <p className="text-xs text-text-secondary">Vendedor: {f.vendedor}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      {f.telefone && <span className="text-xs text-text-muted">Tel: {f.telefone}</span>}
                      {f.email && <span className="text-xs text-text-muted">Email: {f.email}</span>}
                      {f.pix && <span className="text-xs text-text-muted">Pix: {f.pix}</span>}
                    </div>
                    {f.endereco && <p className="text-xs text-text-muted">Endereço: {f.endereco}</p>}
                    {f.contaBancaria && <p className="text-xs text-text-muted">Banco: {f.contaBancaria}</p>}
                    {f.observacoes && <p className="text-xs italic text-text-muted mt-1">{f.observacoes}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => iniciarEdicao(f)} className="p-1.5 rounded hover:bg-brand-input text-text-muted hover:text-gold-primary transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => excluir(f.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConfiguracoesPage() {
  const [aba, setAba] = useState<'tecidos' | 'blackouts' | 'decoracao' | 'trilhos' | 'papeis' | 'instaladores' | 'fatores' | 'markup' | 'confeccao' | 'pdf' | 'fornecedores'>('tecidos')
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
    tipo: 'PRINCIPAL' as 'PRINCIPAL' | 'BLACKOUT' | 'DECORACAO',
    categoria: '',
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
          categoria: t.categoria ?? '',
          ativo: t.ativo,
        })
      } else {
        const tr = item as Trilho
        setForm({ nome: tr.nome, larguraMaxima: '2.80', larguraCustom: '', valorMetro: '', valorUnitario: String(tr.valorUnitario), tipo: 'PRINCIPAL', categoria: '', ativo: tr.ativo })
      }
    } else {
      setEditingId(null)
      setForm({ nome: '', larguraMaxima: '2.80', larguraCustom: '', valorMetro: '', valorUnitario: '', tipo: tipo === 'tecido' ? (aba === 'blackouts' ? 'BLACKOUT' : aba === 'decoracao' ? 'DECORACAO' : 'PRINCIPAL') : 'PRINCIPAL', categoria: '', ativo: true })
    }
    setDrawerOpen(true)
  }

  async function saveDrawer() {
    setSaving(true)
    const largura = form.larguraMaxima === 'personalizado' ? form.larguraCustom : form.larguraMaxima
    try {
      if (drawerTipo === 'tecido') {
        const payload = { nome: form.nome, larguraMaxima: largura, valorMetro: form.valorMetro, tipo: form.tipo, categoria: form.categoria || null, ativo: form.ativo }
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

  const tecidosFiltrados = tecidos.filter(t => {
    if (aba === 'tecidos') return t.tipo === 'PRINCIPAL'
    if (aba === 'blackouts') return t.tipo === 'BLACKOUT'
    if (aba === 'decoracao') return t.tipo === 'DECORACAO'
    return false
  })

  const abas = [
    { key: 'tecidos', label: 'Tecidos' },
    { key: 'blackouts', label: 'Blackouts' },
    { key: 'decoracao', label: 'Decoração' },
    { key: 'trilhos', label: 'Trilhos e Varões' },
    { key: 'papeis', label: 'Papéis de Parede' },
    { key: 'instaladores', label: 'Instaladores' },
    { key: 'fornecedores', label: 'Fornecedores' },
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
          {(aba === 'tecidos' || aba === 'blackouts' || aba === 'decoracao') && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => openDrawer('tecido', 'create')}
                  className="btn-gold flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-semibold"
                >
                  <Plus size={16} />
                  {aba === 'tecidos' ? 'Novo Tecido' : aba === 'blackouts' ? 'Novo Blackout' : 'Novo Tecido Decoração'}
                </button>
              </div>
              <div className="card-base overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-bg">
                      <th className="px-4 py-3 w-8" />
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
                        <td className="px-4 py-3">
                          <button
                            onClick={async () => {
                              await fetch(`/api/tecidos/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ favorito: !t.favorito }) })
                              fetchAll()
                            }}
                            className="p-0.5"
                            title={t.favorito ? 'Remover dos favoritos' : 'Marcar como favorito'}
                          >
                            <Star size={15} className={t.favorito ? 'fill-gold-primary text-gold-primary' : 'text-text-muted'} />
                          </button>
                        </td>
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
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">Markup por Produto</p>
                {[
                  { chave: 'markup_cortina', label: 'Markup Cortinas', suffix: '%' },
                  { chave: 'markup_papel_parede', label: 'Markup Papel de Parede', suffix: '%' },
                  { chave: 'markup_persiana', label: 'Markup Persianas', suffix: '%' },
                  { chave: 'markup_piso', label: 'Markup Piso', suffix: '%' },
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
                <div className="pt-2 border-t border-brand-border space-y-5">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">Comissão e RT</p>
                  {[
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
                <div className="pt-4 border-t border-brand-border space-y-4">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">Instalação — Cortina</p>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Instalação cortina (R$/m²)</label>
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

                <div className="pt-4 border-t border-brand-border space-y-4">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">Instalação — Papel de Parede</p>
                  {[
                    { chave: 'instalacao_papel_1rolo', label: '1 rolo (R$ fixo)' },
                    { chave: 'instalacao_papel_2rolos', label: '2 rolos (R$ fixo)' },
                    { chave: 'instalacao_papel_por_rolo', label: 'A partir de 3 rolos (R$/rolo)' },
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

          {aba === 'papeis' && (
            <PapeisTab />
          )}

          {aba === 'fornecedores' && (
            <FornecedoresTab />
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
                {drawerTipo === 'tecido' ? (aba === 'blackouts' ? 'Blackout' : aba === 'decoracao' ? 'Tecido Decoração' : 'Tecido') : 'Trilho/Varão'}
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
                    <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as 'PRINCIPAL' | 'BLACKOUT' | 'DECORACAO' }))} className="input-base">
                      <option value="PRINCIPAL">Principal</option>
                      <option value="BLACKOUT">Blackout</option>
                      <option value="DECORACAO">Decoração</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Categoria / Fornecedor</label>
                    <input type="text" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))} className="input-base" placeholder="Ex: Deccor Casa, Persianas Amorim" />
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
