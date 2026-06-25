'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronDown, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useOrcamento, AmbientePersianaForm, ambientePersianaVazio } from '@/context/OrcamentoContext'

type CatalogoPersiana = {
  id: string
  fornecedor: string
  tipo: string
  colecao: string
  modelo: string
  codigo: string | null
  valorM2: number
  minM2: number
  larguraMaxima: number | null
  observacao: string | null
}

type AcessorioPersiana = {
  id: string
  fornecedor: string
  tipo: string
  nome: string
  valorMetro: number
}

type MotorPersiana = {
  id: string
  fornecedor: string
  nome: string
  marca: string | null
  valor: number
  larguraMax: number | null
  cargaMaxKg: number | null
}

type ControlePersiana = {
  id: string
  fornecedor: string
  nome: string
  canais: number | null
  valor: number
}

const TIPO_LABELS: Record<string, string> = {
  ROLO: 'Rolo',
  ROMANA: 'Romana',
  PAINEL_COM_HASTES: 'Painel com hastes',
  PAINEL_SEM_HASTES: 'Painel sem hastes',
  HORIZONTAL_16: 'Horizontal 16mm',
  HORIZONTAL_25: 'Horizontal 25mm',
  HORIZONTAL_50: 'Horizontal 50mm',
  HORIZONTAL_75: 'Horizontal 75mm',
  VERTICAL: 'Vertical',
  CELULAR: 'Celular / Vert Gliss',
  PLISSADA: 'Plissada',
}

const FORNECEDOR_LABELS: Record<string, string> = {
  GABRIEL: 'Gabriel Persianas',
  RIOFLEX: 'Rio Flex',
  AMORIM: 'Amorim',
}

export default function Etapa3Persiana() {
  const {
    ambientesPersiana, setAmbientesPersiana,
    ambientePersianaAtual, setAmbientePersianaAtual,
    setEtapa,
  } = useOrcamento()

  const [catalogo, setCatalogo] = useState<CatalogoPersiana[]>([])
  const [acessorios, setAcessorios] = useState<AcessorioPersiana[]>([])
  const [motores, setMotores] = useState<MotorPersiana[]>([])
  const [controles, setControles] = useState<ControlePersiana[]>([])
  const [cfgMotorInstalacao, setCfgMotorInstalacao] = useState(120)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/persianas').then(r => r.json()),
      fetch('/api/acessorios-persiana').then(r => r.json()),
      fetch('/api/motores-persiana').then(r => r.json()),
      fetch('/api/controles-persiana').then(r => r.json()),
      fetch('/api/configuracoes').then(r => r.json()),
    ]).then(([cats, aces, mots, ctrls, cfg]) => {
      setCatalogo(cats.map((c: CatalogoPersiana) => ({ ...c, valorM2: Number(c.valorM2), minM2: Number(c.minM2) })))
      setAcessorios(aces.map((a: AcessorioPersiana) => ({ ...a, valorMetro: Number(a.valorMetro) })))
      setMotores(mots.map((m: MotorPersiana) => ({ ...m, valor: Number(m.valor) })))
      setControles(ctrls.map((c: ControlePersiana) => ({ ...c, valor: Number(c.valor) })))
      setCfgMotorInstalacao(parseFloat(cfg.instalacao_motor_persiana ?? '120'))
      setLoading(false)
    })
  }, [])

  const amb = ambientesPersiana[ambientePersianaAtual]

  function updateAmb(partial: Partial<AmbientePersianaForm>) {
    const updated = [...ambientesPersiana]
    updated[ambientePersianaAtual] = { ...updated[ambientePersianaAtual], ...partial }
    setAmbientesPersiana(updated)
  }

  // Derived catalog slices
  const fornecedoresDisponiveis = useMemo(() => Array.from(new Set(catalogo.map(c => c.fornecedor))).sort(), [catalogo])

  const tiposDoFornecedor = useMemo(() => {
    if (!amb.fornecedor) return []
    return Array.from(new Set(catalogo.filter(c => c.fornecedor === amb.fornecedor).map(c => c.tipo))).sort()
  }, [catalogo, amb.fornecedor])

  const modelosFiltrados = useMemo(() => {
    if (!amb.fornecedor || !amb.tipo) return []
    return catalogo.filter(c => c.fornecedor === amb.fornecedor && c.tipo === amb.tipo)
  }, [catalogo, amb.fornecedor, amb.tipo])

  const bandosFiltrados = useMemo(() => acessorios.filter(a => a.tipo === 'BANDO' && (!amb.fornecedor || a.fornecedor === amb.fornecedor)), [acessorios, amb.fornecedor])
  const guiasLateraisFiltradas = useMemo(() => acessorios.filter(a => a.tipo === 'GUIA_LATERAL' && (!amb.fornecedor || a.fornecedor === amb.fornecedor)), [acessorios, amb.fornecedor])
  const guiasBaseFiltradas = useMemo(() => acessorios.filter(a => a.tipo === 'GUIA_BASE' && (!amb.fornecedor || a.fornecedor === amb.fornecedor)), [acessorios, amb.fornecedor])
  const motoresFiltrados = useMemo(() => motores.filter(m => !amb.fornecedor || m.fornecedor === amb.fornecedor), [motores, amb.fornecedor])
  const controlesFiltrados = useMemo(() => controles.filter(c => !amb.fornecedor || c.fornecedor === amb.fornecedor), [controles, amb.fornecedor])

  function selecionarFornecedor(fornecedor: string) {
    updateAmb({ fornecedor, tipo: '', colecao: '', modelo: '', persianaId: '', valorM2: 0, minM2: 1.5 })
  }

  function selecionarTipo(tipo: string) {
    const ehPainel = tipo === 'PAINEL_COM_HASTES' || tipo === 'PAINEL_SEM_HASTES'
    updateAmb({
      tipo, colecao: '', modelo: '', persianaId: '', valorM2: 0, minM2: 1.5,
      // Painéis não têm guia lateral; painéis RioFlex não têm motorização
      ...(ehPainel ? { guiaLateralAtivo: false } : {}),
      ...(ehPainel && amb.fornecedor === 'RIOFLEX' ? { acionamento: 'manual', motorId: '', motorNome: '', motorValor: 0, controleRemotoId: '', controleRemotoNome: '', controleRemotoValor: 0 } : {}),
    })
  }

  // Painel não tem guia lateral; painel RioFlex não tem motorização
  const ehPainel = amb.tipo === 'PAINEL_COM_HASTES' || amb.tipo === 'PAINEL_SEM_HASTES'
  const semMotorizacao = ehPainel && amb.fornecedor === 'RIOFLEX'

  function selecionarModelo(persianaId: string) {
    const p = catalogo.find(c => c.id === persianaId)
    if (p) updateAmb({ persianaId: p.id, colecao: p.colecao, modelo: p.modelo, valorM2: p.valorM2, minM2: p.minM2 })
  }

  const podeAvancar = ambientesPersiana.every(a =>
    a.nomeAmbiente && a.persianaId && parseFloat(a.largura) > 0 && parseFloat(a.altura) > 0
  )

  function addAmbiente() {
    setAmbientesPersiana([...ambientesPersiana, { ...ambientePersianaVazio }])
    setAmbientePersianaAtual(ambientesPersiana.length)
  }

  function removeAmbiente(idx: number) {
    if (ambientesPersiana.length <= 1) return
    const updated = ambientesPersiana.filter((_, i) => i !== idx)
    setAmbientesPersiana(updated)
    setAmbientePersianaAtual(Math.min(ambientePersianaAtual, updated.length - 1))
  }

  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (loading) {
    return <div className="flex justify-center py-16"><div className="animate-spin w-6 h-6 border-2 border-gold-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Tabs de ambientes */}
      {ambientesPersiana.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ambientesPersiana.map((a, i) => (
            <button
              key={i}
              onClick={() => setAmbientePersianaAtual(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                i === ambientePersianaAtual ? 'bg-gold-primary text-white' : 'bg-brand-input text-text-secondary border border-brand-border'
              }`}
            >
              {a.nomeAmbiente || `Ambiente ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="card-base p-6 md:p-8 space-y-6">
        <h3 className="text-lg font-semibold text-text-primary">
          Persiana — {amb.nomeAmbiente || `Ambiente ${ambientePersianaAtual + 1}`}
        </h3>

        {/* Nome do ambiente */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Ambiente</label>
          <input
            type="text"
            value={amb.nomeAmbiente}
            onChange={e => updateAmb({ nomeAmbiente: e.target.value })}
            placeholder="Ex: Quarto, Sala, Lavabo"
            className="input-base"
          />
        </div>

        {/* Fornecedor */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Fornecedor</label>
          <div className="relative">
            <select value={amb.fornecedor} onChange={e => selecionarFornecedor(e.target.value)} className="input-base appearance-none pr-8">
              <option value="">Selecione o fornecedor...</option>
              {fornecedoresDisponiveis.map(f => <option key={f} value={f}>{FORNECEDOR_LABELS[f] ?? f}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </div>

        {/* Tipo */}
        {amb.fornecedor && (
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Tipo</label>
            <div className="relative">
              <select value={amb.tipo} onChange={e => selecionarTipo(e.target.value)} className="input-base appearance-none pr-8">
                <option value="">Selecione o tipo...</option>
                {tiposDoFornecedor.map(t => <option key={t} value={t}>{TIPO_LABELS[t] ?? t}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>
        )}

        {/* Modelo */}
        {amb.tipo && (
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Modelo / Tecido</label>
            <div className="relative">
              <select value={amb.persianaId} onChange={e => selecionarModelo(e.target.value)} className="input-base appearance-none pr-8">
                <option value="">Selecione o modelo...</option>
                {modelosFiltrados.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.colecao} — {m.modelo}
                    {m.codigo ? ` · Ref. ${m.codigo}` : ''}
                    {m.larguraMaxima ? ` · Larg. máx. ${m.larguraMaxima}m` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>
        )}

        {/* Referência / Cor */}
        {amb.persianaId && (
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Referência / Cor</label>
            <input
              type="text"
              value={amb.referenciaCor}
              onChange={e => updateAmb({ referenciaCor: e.target.value })}
              placeholder="Ex: Screen Rústico 3160"
              className="input-base"
            />
          </div>
        )}

        {/* Dimensões */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Largura (m)</label>
            <input type="number" step="0.01" value={amb.largura} onChange={e => updateAmb({ largura: e.target.value })} placeholder="0,00" className="input-base" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Altura (m)</label>
            <input type="number" step="0.01" value={amb.altura} onChange={e => updateAmb({ altura: e.target.value })} placeholder="0,00" className="input-base" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Quantidade</label>
            <input type="number" min="1" value={amb.quantidade} onChange={e => updateAmb({ quantidade: parseInt(e.target.value) || 1 })} className="input-base" />
          </div>
        </div>

        {/* Lado a lado / transpassada + Instalação local */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Disposição</label>
            <div className="relative">
              <select value={amb.lado} onChange={e => updateAmb({ lado: e.target.value })} className="input-base appearance-none pr-8">
                <option value="">—</option>
                <option value="lado_a_lado">Lado a lado</option>
                <option value="transpassada">Transpassada</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Local de instalação</label>
            <div className="relative">
              <select value={amb.instalacaoLocal} onChange={e => updateAmb({ instalacaoLocal: e.target.value })} className="input-base appearance-none pr-8">
                <option value="">—</option>
                <option value="teto">Teto</option>
                <option value="parede">Parede</option>
                <option value="dentro_vao">Dentro do vão</option>
                <option value="fora_vao">Fora do vão</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Acionamento */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Acionamento</label>
          <div className="flex gap-3">
            {(semMotorizacao ? (['manual'] as const) : (['manual', 'motorizada'] as const)).map(op => (
              <button
                key={op}
                onClick={() => updateAmb({ acionamento: op })}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all capitalize ${
                  amb.acionamento === op ? 'border-gold-primary bg-gold-primary/5 text-gold-dark' : 'border-brand-border text-text-secondary hover:border-gold-light'
                }`}
              >
                {op.charAt(0).toUpperCase() + op.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Motor + controle (se motorizada) */}
        {amb.acionamento === 'motorizada' && (
          <div className="space-y-4 pl-4 border-l-2 border-gold-primary/20">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Motor</label>
              <div className="relative">
                <select
                  value={amb.motorId}
                  onChange={e => {
                    const m = motores.find(x => x.id === e.target.value)
                    updateAmb({ motorId: m?.id ?? '', motorNome: m?.nome ?? '', motorValor: m?.valor ?? 0 })
                  }}
                  className="input-base appearance-none pr-8"
                >
                  <option value="">Selecione o motor...</option>
                  {motoresFiltrados.map(m => (
                    <option key={m.id} value={m.id}>{m.nome} — R$ {fmt(m.valor)}{m.larguraMax ? ` · até ${m.larguraMax}m` : ''}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Controle Remoto</label>
              <div className="relative">
                <select
                  value={amb.controleRemotoId}
                  onChange={e => {
                    const c = controles.find(x => x.id === e.target.value)
                    updateAmb({ controleRemotoId: c?.id ?? '', controleRemotoNome: c?.nome ?? '', controleRemotoValor: c?.valor ?? 0 })
                  }}
                  className="input-base appearance-none pr-8"
                >
                  <option value="">Selecione o controle...</option>
                  {controlesFiltrados.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}{c.canais ? ` (${c.canais} canais)` : ''} — R$ {fmt(c.valor)}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>
            <p className="text-xs text-text-muted">Instalação da motorização: R$ {fmt(cfgMotorInstalacao)} (automático)</p>
          </div>
        )}

        {/* Bandô */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 px-3 bg-brand-input rounded-xl border border-brand-border">
            <div>
              <p className="text-sm font-medium text-text-primary">Bandô</p>
              <p className="text-xs text-text-muted">
                {bandosFiltrados.length === 0 && amb.fornecedor
                  ? `Sem bandôs cadastrados para ${amb.fornecedor}`
                  : 'Cobertura da estrutura superior'}
              </p>
            </div>
            <button
              onClick={() => bandosFiltrados.length > 0 && updateAmb({ bandoAtivo: !amb.bandoAtivo })}
              disabled={bandosFiltrados.length === 0}
              className="text-gold-primary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {amb.bandoAtivo ? <ToggleRight size={30} /> : <ToggleLeft size={30} className="text-text-muted" />}
            </button>
          </div>
          {amb.bandoAtivo && (
            <div className="pl-4 border-l-2 border-gold-primary/20 space-y-3">
              <div className="relative">
                <select
                  value={amb.bandoId}
                  onChange={e => {
                    const b = acessorios.find(x => x.id === e.target.value)
                    updateAmb({ bandoId: b?.id ?? '', bandoNome: b?.nome ?? '', bandoValorMetro: b?.valorMetro ?? 0 })
                  }}
                  className="input-base appearance-none pr-8"
                >
                  <option value="">Selecione o bandô...</option>
                  {bandosFiltrados.map(b => <option key={b.id} value={b.id}>{b.nome} — R$ {fmt(b.valorMetro)}/m</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
              <div className="relative">
                <select value={amb.bandoLado} onChange={e => updateAmb({ bandoLado: e.target.value })} className="input-base appearance-none pr-8">
                  <option value="">Lado do bandô...</option>
                  <option value="ambos">Ambos os lados</option>
                  <option value="direita">Somente direita</option>
                  <option value="esquerda">Somente esquerda</option>
                  <option value="sem">Sem lateral</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Guia lateral — vendida sempre em par (painéis não têm guia lateral) */}
        {!ehPainel && (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 px-3 bg-brand-input rounded-xl border border-brand-border">
            <div>
              <p className="text-sm font-medium text-text-primary">Guia Lateral</p>
              <p className="text-xs text-text-muted">Par completo (sempre os dois lados)</p>
            </div>
            <button onClick={() => updateAmb({ guiaLateralAtivo: !amb.guiaLateralAtivo, guiaLateralFator: 1 })} className="text-gold-primary">
              {amb.guiaLateralAtivo ? <ToggleRight size={30} /> : <ToggleLeft size={30} className="text-text-muted" />}
            </button>
          </div>
          {amb.guiaLateralAtivo && (
            <div className="pl-4 border-l-2 border-gold-primary/20 space-y-3">
              <div className="relative">
                <select
                  value={amb.guiaLateralId}
                  onChange={e => {
                    const g = acessorios.find(x => x.id === e.target.value)
                    updateAmb({ guiaLateralId: g?.id ?? '', guiaLateralNome: g?.nome ?? '', guiaLateralValorMetro: g?.valorMetro ?? 0, guiaLateralFator: 1 })
                  }}
                  className="input-base appearance-none pr-8"
                >
                  <option value="">Selecione a guia...</option>
                  {guiasLateraisFiltradas.map(g => <option key={g.id} value={g.id}>{g.nome} — R$ {fmt(g.valorMetro)}/m (par)</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>
          )}
        </div>
        )}

        {/* Guia base */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 px-3 bg-brand-input rounded-xl border border-brand-border">
            <div>
              <p className="text-sm font-medium text-text-primary">Guia de Base</p>
              <p className="text-xs text-text-muted">Trilho inferior de fixação</p>
            </div>
            <button onClick={() => updateAmb({ guiaBaseAtivo: !amb.guiaBaseAtivo })} className="text-gold-primary">
              {amb.guiaBaseAtivo ? <ToggleRight size={30} /> : <ToggleLeft size={30} className="text-text-muted" />}
            </button>
          </div>
          {amb.guiaBaseAtivo && (
            <div className="pl-4 border-l-2 border-gold-primary/20">
              <div className="relative">
                <select
                  value={amb.guiaBaseId}
                  onChange={e => {
                    const g = acessorios.find(x => x.id === e.target.value)
                    updateAmb({ guiaBaseId: g?.id ?? '', guiaBaseNome: g?.nome ?? '', guiaBaseValorMetro: g?.valorMetro ?? 0 })
                  }}
                  className="input-base appearance-none pr-8"
                >
                  <option value="">Selecione a guia de base...</option>
                  {guiasBaseFiltradas.map(g => <option key={g.id} value={g.id}>{g.nome} — R$ {fmt(g.valorMetro)}/m</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Instalação */}
        <div className="flex items-center justify-between py-2 px-3 bg-brand-input rounded-xl border border-brand-border">
          <div>
            <p className="text-sm font-medium text-text-primary">Instalação</p>
            <p className="text-xs text-text-muted">SIM = entra no total · NÃO = cobrado direto ao instalador</p>
          </div>
          <button onClick={() => updateAmb({ instalacao: !amb.instalacao })} className="text-gold-primary">
            {amb.instalacao ? <ToggleRight size={30} /> : <ToggleLeft size={30} className="text-text-muted" />}
          </button>
        </div>

        {/* Observações */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Observações</label>
          <textarea
            value={amb.observacoes}
            onChange={e => updateAmb({ observacoes: e.target.value })}
            rows={2}
            placeholder="Informações adicionais..."
            className="input-base h-auto py-3 resize-none"
          />
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setEtapa(2)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-brand-input transition-colors">
            <ChevronLeft size={16} /> Voltar
          </button>
          <div className="flex items-center gap-2">
            {ambientesPersiana.length > 1 && (
              <button onClick={() => removeAmbiente(ambientePersianaAtual)} className="px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1.5">
                <Trash2 size={14} /> Remover
              </button>
            )}
            <button onClick={addAmbiente} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-gold-primary border border-gold-primary/30 hover:bg-gold-primary/5 transition-colors">
              <Plus size={14} /> Outro ambiente
            </button>
            <button
              onClick={() => setEtapa(4)}
              disabled={!podeAvancar}
              className="btn-gold px-6 py-2.5 rounded-[10px] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Revisar Orçamento
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
