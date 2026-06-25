'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, User, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

type Evento = {
  id: string; titulo: string; descricao?: string | null; inicio: string; fim?: string | null
  diaInteiro: boolean; tipo: string; cor: string
  usuario: { id: string; nome: string; role: string }
  instalador?: { id: string; nome: string } | null
  orcamentoId?: string | null
}

type Instalador = { id: string; nome: string; ativo: boolean }
type Usuario = { id: string; nome: string; role: string }

const TIPOS = [
  { value: 'visita', label: 'Visita', cor: '#C9A84C' },
  { value: 'instalacao', label: 'Instalação', cor: '#22C55E' },
  { value: 'entrega', label: 'Entrega', cor: '#3B82F6' },
  { value: 'outro', label: 'Outro', cor: '#A855F7' },
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtHora(d: string) { return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
function fmtData(d: string) { return new Date(d).toLocaleDateString('pt-BR') }
function isMesmodia(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate() }

export default function AgendaPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const isInstalador = session?.user?.role === 'INSTALADOR' || session?.user?.soAgenda === true

  const [hoje] = useState(new Date())
  const [mesAtual, setMesAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const [eventos, setEventos] = useState<Evento[]>([])
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null)
  const [modal, setModal] = useState(false)
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null)
  const [instaladores, setInstaladores] = useState<Instalador[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroInstalador, setFiltroInstalador] = useState('')
  const [erroSalvar, setErroSalvar] = useState('')

  const [form, setForm] = useState({
    titulo: '', descricao: '', inicio: '', fim: '', diaInteiro: false,
    tipo: 'visita', cor: '#C9A84C', instaladorId: '',
  })

  const fetchEventos = useCallback(async () => {
    const inicio = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).toISOString()
    const fim = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0, 23, 59).toISOString()
    const params = new URLSearchParams({ inicio, fim })
    if (filtroUsuario) params.set('usuarioId', filtroUsuario)
    if (filtroInstalador) params.set('instaladorId', filtroInstalador)
    const data = await fetch(`/api/agenda?${params}`).then(r => r.json())
    setEventos(Array.isArray(data) ? data : [])
  }, [mesAtual, filtroUsuario, filtroInstalador])

  useEffect(() => { fetchEventos() }, [fetchEventos])

  useEffect(() => {
    fetch('/api/instaladores').then(r => r.json()).then(d => setInstaladores(Array.isArray(d) ? d : []))
    if (isAdmin) fetch('/api/usuarios').then(r => r.json()).then(setUsuarios)
  }, [isAdmin])

  // Dias do calendário
  const primeiroDia = mesAtual.getDay()
  const ultimoDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate()
  const diasCalendario: (Date | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: ultimoDia }, (_, i) => new Date(mesAtual.getFullYear(), mesAtual.getMonth(), i + 1)),
  ]

  function eventosNoDia(dia: Date) {
    return eventos.filter(e => isMesmodia(new Date(e.inicio), dia))
  }

  function abrirModal(dia?: Date) {
    const dataBase = dia ?? diaSelecionado ?? new Date()
    const h = dataBase.toISOString().slice(0, 10)
    setForm({ titulo: '', descricao: '', inicio: `${h}T09:00`, fim: `${h}T10:00`, diaInteiro: false, tipo: 'visita', cor: '#C9A84C', instaladorId: '' })
    setEventoSelecionado(null)
    setModal(true)
  }

  async function salvar() {
    if (!form.titulo || !form.inicio) { setErroSalvar('Título e data são obrigatórios'); return }
    setErroSalvar('')
    const tipo = TIPOS.find(t => t.value === form.tipo)
    const cor = tipo?.cor ?? form.cor
    const res = await fetch('/api/agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, cor }),
    })
    if (res.ok) { await fetchEventos(); setModal(false) }
    else {
      const data = await res.json().catch(() => null)
      setErroSalvar(data?.error ?? 'Erro ao salvar evento')
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este evento?')) return
    await fetch(`/api/agenda/${id}`, { method: 'DELETE' })
    setEventos(prev => prev.filter(e => e.id !== id))
    setEventoSelecionado(null)
  }

  const eventosDiaSelecionado = diaSelecionado ? eventosNoDia(diaSelecionado) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-text-primary">Agenda</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setMesAtual(m => new Date(m.getFullYear(), m.getMonth()-1, 1))} className="p-1.5 rounded-lg hover:bg-brand-input text-text-secondary">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-text-primary min-w-[140px] text-center">
              {MESES[mesAtual.getMonth()]} {mesAtual.getFullYear()}
            </span>
            <button onClick={() => setMesAtual(m => new Date(m.getFullYear(), m.getMonth()+1, 1))} className="p-1.5 rounded-lg hover:bg-brand-input text-text-secondary">
              <ChevronRight size={18} />
            </button>
            <button onClick={() => setMesAtual(new Date(hoje.getFullYear(), hoje.getMonth(), 1))} className="text-xs px-2 py-1 rounded border border-brand-border text-text-secondary hover:bg-brand-input ml-1">
              Hoje
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <select value={filtroUsuario} onChange={e => setFiltroUsuario(e.target.value)} className="input-base text-sm py-1.5 w-40">
                <option value="">Todos vendedores</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
              <select value={filtroInstalador} onChange={e => setFiltroInstalador(e.target.value)} className="input-base text-sm py-1.5 w-40">
                <option value="">Todos instaladores</option>
                {instaladores.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
              </select>
            </>
          )}
          {!isInstalador && (
            <button onClick={() => abrirModal()} className="btn-gold flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold">
              <Plus size={15} /> Novo evento
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-2 card-base p-4">
          <div className="grid grid-cols-7 mb-2">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-text-muted py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-brand-border rounded-xl overflow-hidden">
            {diasCalendario.map((dia, i) => {
              if (!dia) return <div key={i} className="bg-brand-bg min-h-[80px]" />
              const evts = eventosNoDia(dia)
              const ehHoje = isMesmodia(dia, hoje)
              const selecionado = diaSelecionado && isMesmodia(dia, diaSelecionado)
              return (
                <div
                  key={i}
                  onClick={() => setDiaSelecionado(dia)}
                  onDoubleClick={() => abrirModal(dia)}
                  className={`bg-white min-h-[80px] p-1.5 cursor-pointer hover:bg-gold-primary/4 transition-colors ${selecionado ? 'ring-2 ring-inset ring-gold-primary' : ''}`}
                >
                  <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${ehHoje ? 'bg-gold-primary text-white' : 'text-text-secondary'}`}>
                    {dia.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {evts.slice(0, 3).map(e => (
                      <div
                        key={e.id}
                        onClick={ev => { ev.stopPropagation(); setEventoSelecionado(e); setDiaSelecionado(dia) }}
                        className="text-[10px] font-medium px-1 py-0.5 rounded truncate cursor-pointer text-white"
                        style={{ backgroundColor: e.cor }}
                      >
                        {!e.diaInteiro && <span className="opacity-80">{fmtHora(e.inicio)} </span>}
                        {e.titulo}
                      </div>
                    ))}
                    {evts.length > 3 && <div className="text-[10px] text-text-muted pl-1">+{evts.length-3} mais</div>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-brand-border">
            {TIPOS.map(t => (
              <div key={t.value} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.cor }} />
                <span className="text-xs text-text-muted">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Painel lateral */}
        <div className="space-y-4">
          {/* Dia selecionado */}
          <div className="card-base p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-text-primary">
                {diaSelecionado ? fmtData(diaSelecionado.toISOString()) : 'Selecione um dia'}
              </p>
              {diaSelecionado && !isInstalador && (
                <button onClick={() => abrirModal(diaSelecionado)} className="text-xs text-gold-primary hover:text-gold-dark flex items-center gap-1">
                  <Plus size={12} /> Evento
                </button>
              )}
            </div>
            {eventosDiaSelecionado.length === 0 && diaSelecionado && (
              <p className="text-xs text-text-muted">Nenhum evento neste dia</p>
            )}
            <div className="space-y-2">
              {eventosDiaSelecionado.map(e => (
                <div
                  key={e.id}
                  onClick={() => setEventoSelecionado(eventoSelecionado?.id === e.id ? null : e)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${eventoSelecionado?.id === e.id ? 'border-gold-primary bg-gold-primary/4' : 'border-brand-border hover:border-gold-primary/40'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.cor }} />
                    <p className="text-sm font-medium text-text-primary truncate">{e.titulo}</p>
                  </div>
                  {!e.diaInteiro && (
                    <p className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={11} /> {fmtHora(e.inicio)}{e.fim ? ` – ${fmtHora(e.fim)}` : ''}
                    </p>
                  )}
                  {e.instalador && (
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                      <User size={11} /> {e.instalador.nome}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detalhe do evento */}
          {eventoSelecionado && (
            <div className="card-base p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: eventoSelecionado.cor }} />
                  <p className="text-sm font-semibold text-text-primary">{eventoSelecionado.titulo}</p>
                </div>
                {!isInstalador && (
                  <button onClick={() => excluir(eventoSelecionado.id)} className="p-1 text-text-muted hover:text-red-500 transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {eventoSelecionado.descricao && <p className="text-xs text-text-secondary">{eventoSelecionado.descricao}</p>}
              <div className="space-y-1.5 text-xs text-text-muted">
                <div className="flex items-center gap-1.5"><Clock size={12} />
                  {eventoSelecionado.diaInteiro ? 'Dia inteiro' : `${fmtHora(eventoSelecionado.inicio)}${eventoSelecionado.fim ? ` – ${fmtHora(eventoSelecionado.fim)}` : ''}`}
                </div>
                <div className="flex items-center gap-1.5"><User size={12} />{eventoSelecionado.usuario.nome}</div>
                {eventoSelecionado.instalador && (
                  <div className="flex items-center gap-1.5"><MapPin size={12} />Instalador: {eventoSelecionado.instalador.nome}</div>
                )}
                {eventoSelecionado.orcamentoId && (
                  <a href={`/painel-pedidos`} className="flex items-center gap-1.5 text-gold-primary hover:text-gold-dark">
                    Ver orçamento
                  </a>
                )}
              </div>
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: eventoSelecionado.cor }}>
                {TIPOS.find(t => t.value === eventoSelecionado.tipo)?.label ?? eventoSelecionado.tipo}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal novo evento */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">Novo evento</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded hover:bg-brand-input text-text-secondary"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <input
                type="text" placeholder="Título do evento *" value={form.titulo}
                onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                className="input-base w-full"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-text-muted uppercase font-medium tracking-wider">Início</label>
                  <input type={form.diaInteiro ? 'date' : 'datetime-local'} value={form.diaInteiro ? form.inicio.slice(0,10) : form.inicio}
                    onChange={e => setForm(p => ({ ...p, inicio: e.target.value }))}
                    className="input-base w-full text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-text-muted uppercase font-medium tracking-wider">Fim</label>
                  <input type={form.diaInteiro ? 'date' : 'datetime-local'} value={form.diaInteiro ? form.fim.slice(0,10) : form.fim}
                    onChange={e => setForm(p => ({ ...p, fim: e.target.value }))}
                    className="input-base w-full text-sm" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.diaInteiro} onChange={e => setForm(p => ({ ...p, diaInteiro: e.target.checked }))} className="rounded" />
                <span className="text-sm text-text-primary">Dia inteiro</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-text-muted uppercase font-medium tracking-wider">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} className="input-base w-full text-sm">
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-text-muted uppercase font-medium tracking-wider">Instalador</label>
                  <select value={form.instaladorId} onChange={e => setForm(p => ({ ...p, instaladorId: e.target.value }))} className="input-base w-full text-sm">
                    <option value="">Nenhum</option>
                    {instaladores.filter(i => i.ativo).map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                  </select>
                </div>
              </div>

              <textarea
                placeholder="Descrição / observações..."
                value={form.descricao}
                onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                rows={2}
                className="input-base w-full text-sm resize-none"
              />
            </div>

            {erroSalvar && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{erroSalvar}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setModal(false); setErroSalvar('') }} className="flex-1 py-2.5 rounded-[10px] border border-brand-border text-sm font-medium text-text-secondary hover:bg-brand-input transition-colors">
                Cancelar
              </button>
              <button onClick={salvar} className="flex-1 btn-gold py-2.5 rounded-[10px] text-sm font-semibold">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
