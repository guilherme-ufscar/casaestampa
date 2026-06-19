'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronDown, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useOrcamento, AmbientePisoForm, ambientePisoVazio, PerfilPisoForm, AcabamentoPisoForm } from '@/context/OrcamentoContext'

type ProdutoPiso = {
  id: string
  categoria: string
  fabricante: string | null
  modelo: string
  unidade: string
  valor: number
  medidaPeca: number | null
  rendimento: number | null
  observacao: string | null
}

const PERFIL_CATEGORIAS = [
  { key: 'REDUTOR', label: 'Perfil Redutor' },
  { key: 'TRANSICAO', label: 'Perfil de Transição' },
  { key: 'CANTONEIRA', label: 'Cantoneira' },
  { key: 'OUTROS', label: 'Outros Perfis' },
]

export default function Etapa3Piso() {
  const {
    ambientesPiso, setAmbientesPiso,
    ambientePisoAtual, setAmbientePisoAtual,
    setEtapa,
  } = useOrcamento()

  const [catalogo, setCatalogo] = useState<ProdutoPiso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/produtos-piso')
      .then(r => r.json())
      .then((data: ProdutoPiso[]) => {
        setCatalogo(data.map(p => ({ ...p, valor: Number(p.valor), medidaPeca: p.medidaPeca != null ? Number(p.medidaPeca) : null, rendimento: p.rendimento != null ? Number(p.rendimento) : null })))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const amb = ambientesPiso[ambientePisoAtual]

  function updateAmb(partial: Partial<AmbientePisoForm>) {
    const updated = [...ambientesPiso]
    updated[ambientePisoAtual] = { ...updated[ambientePisoAtual], ...partial }
    setAmbientesPiso(updated)
  }

  const porCategoria = (cat: string) => catalogo.filter(p => p.categoria === cat)

  const pisosFiltrados = useMemo(() => porCategoria(amb.tipoPiso), [catalogo, amb.tipoPiso])
  const mantas = useMemo(() => porCategoria('MANTA'), [catalogo])
  const rodapes = useMemo(() => porCategoria(amb.tipoPiso === 'LAMINADO' ? 'RODAPE_LAMINADO' : 'RODAPE_VINILICO'), [catalogo, amb.tipoPiso])
  const perfisCatalogo = useMemo(() => porCategoria('PERFIL'), [catalogo])
  const pregos = useMemo(() => porCategoria('PREGO'), [catalogo])
  const colas = useMemo(() => porCategoria('COLA'), [catalogo])
  const massas = useMemo(() => porCategoria('MASSA'), [catalogo])
  const chapas = useMemo(() => porCategoria('CHAPA'), [catalogo])

  // Define cola padrão (Globalfix) automaticamente para vinílico
  useEffect(() => {
    if (amb.tipoPiso === 'VINILICO' && !amb.colaId && colas.length > 0) {
      const globalfix = colas.find(c => c.modelo.toUpperCase().includes('GLOBALFIX')) ?? colas[0]
      updateAmb({ colaId: globalfix.id, colaNome: globalfix.modelo, colaValorGalao: globalfix.valor })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amb.tipoPiso, colas])

  const areaTotalBruta = useMemo(
    () => amb.medicoes.reduce((s, m) => {
      const l = parseFloat(m.largura); const c = parseFloat(m.comprimento)
      return s + (Number.isFinite(l) && Number.isFinite(c) ? l * c : 0)
    }, 0),
    [amb.medicoes]
  )

  const podeAvancar = ambientesPiso.every(a =>
    a.nomeAmbiente && a.pisoId && a.medicoes.some(m => parseFloat(m.largura) > 0 && parseFloat(m.comprimento) > 0)
  )

  function addAmbiente() {
    setAmbientesPiso([...ambientesPiso, { ...ambientePisoVazio }])
    setAmbientePisoAtual(ambientesPiso.length)
  }

  function removeAmbiente(idx: number) {
    if (ambientesPiso.length <= 1) return
    const updated = ambientesPiso.filter((_, i) => i !== idx)
    setAmbientesPiso(updated)
    setAmbientePisoAtual(Math.min(ambientePisoAtual, updated.length - 1))
  }

  // Medições
  function updateMedicao(i: number, campo: 'largura' | 'comprimento', valor: string) {
    const medicoes = amb.medicoes.map((m, idx) => idx === i ? { ...m, [campo]: valor } : m)
    updateAmb({ medicoes })
  }
  function addMedicao() { updateAmb({ medicoes: [...amb.medicoes, { largura: '', comprimento: '' }] }) }
  function removeMedicao(i: number) { if (amb.medicoes.length > 1) updateAmb({ medicoes: amb.medicoes.filter((_, idx) => idx !== i) }) }

  // Medidas lineares genéricas (rodapé)
  function setRodapeMedida(i: number, v: string) { updateAmb({ rodapeMedidas: amb.rodapeMedidas.map((m, idx) => idx === i ? v : m) }) }
  function addRodapeMedida() { updateAmb({ rodapeMedidas: [...amb.rodapeMedidas, ''] }) }
  function removeRodapeMedida(i: number) { if (amb.rodapeMedidas.length > 1) updateAmb({ rodapeMedidas: amb.rodapeMedidas.filter((_, idx) => idx !== i) }) }

  // Perfis
  function addPerfil(categoria: string) {
    const novo: PerfilPisoForm = { categoria, produtoId: '', nome: '', valorPc: 0, medidaPeca: 2.1, medidas: [''] }
    updateAmb({ perfis: [...amb.perfis, novo] })
  }
  function updatePerfil(idx: number, partial: Partial<PerfilPisoForm>) {
    updateAmb({ perfis: amb.perfis.map((p, i) => i === idx ? { ...p, ...partial } : p) })
  }
  function removePerfil(idx: number) { updateAmb({ perfis: amb.perfis.filter((_, i) => i !== idx) }) }

  // Acabamentos
  function addAcabamento() {
    const novo: AcabamentoPisoForm = { produtoId: '', nome: '', valorMetro: 0, medidas: [''] }
    updateAmb({ acabamentos: [...amb.acabamentos, novo] })
  }
  function updateAcabamento(idx: number, partial: Partial<AcabamentoPisoForm>) {
    updateAmb({ acabamentos: amb.acabamentos.map((a, i) => i === idx ? { ...a, ...partial } : a) })
  }
  function removeAcabamento(idx: number) { updateAmb({ acabamentos: amb.acabamentos.filter((_, i) => i !== idx) }) }

  if (loading) {
    return <div className="flex justify-center py-16"><div className="animate-spin w-6 h-6 border-2 border-gold-primary border-t-transparent rounded-full" /></div>
  }

  const ehLaminado = amb.tipoPiso === 'LAMINADO'

  return (
    <div className="space-y-4">
      {/* Tabs de ambientes */}
      {ambientesPiso.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ambientesPiso.map((a, i) => (
            <button key={i} onClick={() => setAmbientePisoAtual(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${i === ambientePisoAtual ? 'bg-gold-primary text-white' : 'bg-brand-input text-text-secondary border border-brand-border'}`}>
              {a.nomeAmbiente || `Ambiente ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="card-base p-6 md:p-8 space-y-6">
        <h3 className="text-lg font-semibold text-text-primary">
          Piso — {amb.nomeAmbiente || `Ambiente ${ambientePisoAtual + 1}`}
        </h3>

        {/* Tipo de piso */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Tipo de Piso</label>
          <div className="flex gap-3">
            {(['LAMINADO', 'VINILICO'] as const).map(t => (
              <button key={t}
                onClick={() => updateAmb({ tipoPiso: t, pisoId: '', pisoModelo: '', pisoValorM2: 0, rodapeId: '', rodapeNome: '', rodapeValorPc: 0 })}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${amb.tipoPiso === t ? 'border-gold-primary bg-gold-primary/5 text-gold-dark' : 'border-brand-border text-text-secondary hover:border-gold-light'}`}>
                {t === 'LAMINADO' ? 'Laminado' : 'Vinílico'}
              </button>
            ))}
          </div>
        </div>

        {/* Nome do ambiente + fabricante */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Ambiente</label>
            <input type="text" value={amb.nomeAmbiente} onChange={e => updateAmb({ nomeAmbiente: e.target.value })} placeholder="Ex: Sala, Quarto" className="input-base" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Cor</label>
            <input type="text" value={amb.fabricante} onChange={e => updateAmb({ fabricante: e.target.value })} placeholder="Ex: Carvalho acinzentado" className="input-base" />
          </div>
        </div>

        {/* Modelo do piso */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Modelo do Piso</label>
          <PisoCombobox
            produtos={pisosFiltrados}
            valueId={amb.pisoId}
            onChange={p => updateAmb({ pisoId: p?.id ?? '', pisoModelo: p?.modelo ?? '', pisoValorM2: p?.valor ?? 0 })}
          />
        </div>

        {/* Área do piso (medições) */}
        <div className="space-y-2">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Área do Piso (largura × comprimento)</label>
          <div className="space-y-2">
            {amb.medicoes.map((m, i) => {
              const sub = (parseFloat(m.largura) || 0) * (parseFloat(m.comprimento) || 0)
              return (
                <div key={i} className="flex items-center gap-2">
                  <input type="number" step="0.01" value={m.largura} onChange={e => updateMedicao(i, 'largura', e.target.value)} placeholder="Largura" className="input-base flex-1" />
                  <span className="text-text-muted">×</span>
                  <input type="number" step="0.01" value={m.comprimento} onChange={e => updateMedicao(i, 'comprimento', e.target.value)} placeholder="Comprimento" className="input-base flex-1" />
                  <span className="text-xs text-text-secondary w-20 text-right">{sub > 0 ? `${sub.toFixed(2)} m²` : '—'}</span>
                  <button onClick={() => removeMedicao(i)} className="text-text-muted hover:text-red-500 p-1"><Trash2 size={14} /></button>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between">
            <button onClick={addMedicao} className="flex items-center gap-1 text-xs font-medium text-gold-primary"><Plus size={13} /> Adicionar medição</button>
            <span className="text-sm font-semibold text-text-primary">Total: {areaTotalBruta.toFixed(2)} m² <span className="text-xs font-normal text-text-muted">(+10% = {(areaTotalBruta * 1.1).toFixed(2)} m²)</span></span>
          </div>
        </div>

        {/* Manta (laminado) */}
        {ehLaminado && (
          <ToggleSection titulo="Manta" descricao="Manta acústica (+3% de área)" ativo={amb.mantaAtivo} onToggle={() => updateAmb({ mantaAtivo: !amb.mantaAtivo })}>
            <SelectProduto produtos={mantas} valueId={amb.mantaId} placeholder="Selecione a manta..." unidadeLabel="/m²"
              onChange={p => updateAmb({ mantaId: p?.id ?? '', mantaNome: p?.modelo ?? '', mantaValorM2: p?.valor ?? 0 })} />
          </ToggleSection>
        )}

        {/* Rodapé */}
        <ToggleSection titulo="Rodapé" descricao="Metragem linear (+2% de perda)" ativo={amb.rodapeAtivo} onToggle={() => updateAmb({ rodapeAtivo: !amb.rodapeAtivo })}>
          <SelectProduto produtos={rodapes} valueId={amb.rodapeId} placeholder="Selecione o rodapé..." unidadeLabel="/pç"
            onChange={p => updateAmb({ rodapeId: p?.id ?? '', rodapeNome: p?.modelo ?? '', rodapeValorPc: p?.valor ?? 0, rodapeMedidaPeca: p?.medidaPeca ?? 2.1 })} />
          <MedidasLineares medidas={amb.rodapeMedidas} onSet={setRodapeMedida} onAdd={addRodapeMedida} onRemove={removeRodapeMedida} />
        </ToggleSection>

        {/* Perfis (laminado) */}
        {ehLaminado && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Perfis e Acabamentos</p>
                <p className="text-xs text-text-muted">Redutor, transição, cantoneira e outros</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PERFIL_CATEGORIAS.map(c => (
                <button key={c.key} onClick={() => addPerfil(c.key)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gold-primary border border-gold-primary/30 hover:bg-gold-primary/5">
                  <Plus size={12} /> {c.label}
                </button>
              ))}
            </div>
            {amb.perfis.map((p, idx) => (
              <div key={idx} className="pl-4 border-l-2 border-gold-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary">{PERFIL_CATEGORIAS.find(c => c.key === p.categoria)?.label ?? p.categoria}</span>
                  <button onClick={() => removePerfil(idx)} className="text-text-muted hover:text-red-500 p-1"><Trash2 size={13} /></button>
                </div>
                <SelectProduto produtos={perfisCatalogo} valueId={p.produtoId} placeholder="Selecione o perfil..." unidadeLabel="/pç"
                  onChange={prod => updatePerfil(idx, { produtoId: prod?.id ?? '', nome: prod?.modelo ?? '', valorPc: prod?.valor ?? 0, medidaPeca: prod?.medidaPeca ?? 2.1 })} />
                <MedidasLineares medidas={p.medidas}
                  onSet={(i, v) => updatePerfil(idx, { medidas: p.medidas.map((m, j) => j === i ? v : m) })}
                  onAdd={() => updatePerfil(idx, { medidas: [...p.medidas, ''] })}
                  onRemove={(i) => p.medidas.length > 1 && updatePerfil(idx, { medidas: p.medidas.filter((_, j) => j !== i) })} />
              </div>
            ))}
          </div>
        )}

        {/* Prego (laminado) */}
        {ehLaminado && (
          <ToggleSection titulo="Prego" descricao="Quantidade de pacotes (100 un.)" ativo={amb.pregoAtivo} onToggle={() => updateAmb({ pregoAtivo: !amb.pregoAtivo })}>
            <SelectProduto produtos={pregos} valueId={amb.pregoId} placeholder="Selecione o prego..." unidadeLabel="/pct"
              onChange={p => updateAmb({ pregoId: p?.id ?? '', pregoNome: p?.modelo ?? '', pregoValorPct: p?.valor ?? 0 })} />
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted">Pacotes:</label>
              <input type="number" min="1" value={amb.pregoPacotes} onChange={e => updateAmb({ pregoPacotes: parseInt(e.target.value) || 1 })} className="input-base w-24" />
            </div>
          </ToggleSection>
        )}

        {/* Cola (vinílico — automática) */}
        {!ehLaminado && (
          <div className="py-2 px-3 bg-brand-input rounded-xl border border-brand-border">
            <p className="text-sm font-medium text-text-primary">Cola (automática)</p>
            <p className="text-xs text-text-muted">{amb.colaNome || 'Cola vinílica'} — 1 galão a cada 12 m² · {areaTotalBruta > 0 ? Math.ceil(areaTotalBruta / 12) : 0} galão(ões)</p>
          </div>
        )}

        {/* Massa niveladora (vinílico) */}
        {!ehLaminado && (
          <ToggleSection titulo="Massa Niveladora" descricao="1 saco a cada 10 m²" ativo={amb.massaAtivo} onToggle={() => updateAmb({ massaAtivo: !amb.massaAtivo })}>
            <SelectProduto produtos={massas} valueId={amb.massaId} placeholder="Selecione a massa..." unidadeLabel="/saco"
              onChange={p => updateAmb({ massaId: p?.id ?? '', massaNome: p?.modelo ?? '', massaValorSaco: p?.valor ?? 0, massaRendimento: p?.rendimento ?? 10 })} />
            <p className="text-xs text-text-muted">{areaTotalBruta > 0 ? Math.ceil(areaTotalBruta / (amb.massaRendimento || 10)) : 0} saco(s)</p>
          </ToggleSection>
        )}

        {/* Acabamentos / chapas (vinílico) */}
        {!ehLaminado && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Acabamentos (chapas de alumínio)</p>
                <p className="text-xs text-text-muted">Metragem linear × preço/metro</p>
              </div>
              <button onClick={addAcabamento} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gold-primary border border-gold-primary/30 hover:bg-gold-primary/5"><Plus size={12} /> Adicionar</button>
            </div>
            {amb.acabamentos.map((a, idx) => (
              <div key={idx} className="pl-4 border-l-2 border-gold-primary/20 space-y-2">
                <div className="flex items-center justify-end">
                  <button onClick={() => removeAcabamento(idx)} className="text-text-muted hover:text-red-500 p-1"><Trash2 size={13} /></button>
                </div>
                <SelectProduto produtos={chapas} valueId={a.produtoId} placeholder="Selecione a chapa..." unidadeLabel="/m"
                  onChange={prod => updateAcabamento(idx, { produtoId: prod?.id ?? '', nome: prod?.modelo ?? '', valorMetro: prod?.valor ?? 0 })} />
                <MedidasLineares medidas={a.medidas}
                  onSet={(i, v) => updateAcabamento(idx, { medidas: a.medidas.map((m, j) => j === i ? v : m) })}
                  onAdd={() => updateAcabamento(idx, { medidas: [...a.medidas, ''] })}
                  onRemove={(i) => a.medidas.length > 1 && updateAcabamento(idx, { medidas: a.medidas.filter((_, j) => j !== i) })} />
              </div>
            ))}
          </div>
        )}

        {/* Outros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Outros (descrição)</label>
            <input type="text" value={amb.outrosDescricao} onChange={e => updateAmb({ outrosDescricao: e.target.value })} placeholder="Ex: tarugo, material extra" className="input-base" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Outros (valor R$)</label>
            <input type="number" step="0.01" value={amb.outrosValor} onChange={e => updateAmb({ outrosValor: e.target.value })} placeholder="0,00" className="input-base" />
          </div>
        </div>

        {/* Instalação + frete */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between py-2 px-3 bg-brand-input rounded-xl border border-brand-border">
            <div>
              <p className="text-sm font-medium text-text-primary">Instalação</p>
              <p className="text-xs text-text-muted">{ehLaminado ? 'R$ 25,00/m²' : 'R$ 30,00/m²'} da área bruta</p>
            </div>
            <button onClick={() => updateAmb({ instalacao: !amb.instalacao })} className="text-gold-primary">
              {amb.instalacao ? <ToggleRight size={30} /> : <ToggleLeft size={30} className="text-text-muted" />}
            </button>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Frete (R$)</label>
            <input type="number" step="0.01" value={amb.frete} onChange={e => updateAmb({ frete: e.target.value })} placeholder="190,00" className="input-base" />
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Observações</label>
          <textarea value={amb.observacoes} onChange={e => updateAmb({ observacoes: e.target.value })} rows={2} placeholder="Informações adicionais..." className="input-base h-auto py-3 resize-none" />
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setEtapa(2)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-brand-input transition-colors">
            <ChevronLeft size={16} /> Voltar
          </button>
          <div className="flex items-center gap-2">
            {ambientesPiso.length > 1 && (
              <button onClick={() => removeAmbiente(ambientePisoAtual)} className="px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1.5">
                <Trash2 size={14} /> Remover
              </button>
            )}
            <button onClick={addAmbiente} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-gold-primary border border-gold-primary/30 hover:bg-gold-primary/5 transition-colors">
              <Plus size={14} /> Outro ambiente
            </button>
            <button onClick={() => setEtapa(4)} disabled={!podeAvancar} className="btn-gold px-6 py-2.5 rounded-[10px] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              Revisar Orçamento
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleSection({ titulo, descricao, ativo, onToggle, children }: { titulo: string; descricao: string; ativo: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between py-2 px-3 bg-brand-input rounded-xl border border-brand-border">
        <div>
          <p className="text-sm font-medium text-text-primary">{titulo}</p>
          <p className="text-xs text-text-muted">{descricao}</p>
        </div>
        <button onClick={onToggle} className="text-gold-primary">
          {ativo ? <ToggleRight size={30} /> : <ToggleLeft size={30} className="text-text-muted" />}
        </button>
      </div>
      {ativo && <div className="pl-4 border-l-2 border-gold-primary/20 space-y-3">{children}</div>}
    </div>
  )
}

function PisoCombobox({ produtos, valueId, onChange }: {
  produtos: ProdutoPiso[]; valueId: string; onChange: (p: ProdutoPiso | undefined) => void
}) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selecionado = produtos.find(p => p.id === valueId)

  const filtrados = produtos.filter(p => {
    const q = busca.toLowerCase()
    return p.modelo.toLowerCase().includes(q) || (p.fabricante ?? '').toLowerCase().includes(q)
  })

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false); setBusca('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function selecionar(p: ProdutoPiso) { onChange(p); setAberto(false); setBusca('') }
  function limpar() { onChange(undefined); setBusca(''); setAberto(true) }

  return (
    <div className="relative" ref={ref}>
      <div
        className="input-base flex items-center justify-between cursor-pointer gap-2"
        onClick={() => { setAberto(o => !o); setBusca('') }}
      >
        {selecionado ? (
          <span className="truncate text-sm text-text-primary">
            {selecionado.fabricante ? <span className="text-text-muted">{selecionado.fabricante} – </span> : null}
            {selecionado.modelo}
          </span>
        ) : (
          <span className="text-text-muted text-sm">Selecione o modelo...</span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {selecionado && (
            <button type="button" onMouseDown={e => { e.stopPropagation(); limpar() }} className="text-text-muted hover:text-red-400 text-xs px-1">✕</button>
          )}
          <ChevronDown size={14} className="text-text-muted" />
        </div>
      </div>

      {aberto && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por modelo ou fabricante..."
              className="w-full text-sm px-3 py-1.5 border border-border rounded-md outline-none focus:border-gold-primary"
              onKeyDown={e => {
                if (e.key === 'Escape') { setAberto(false); setBusca('') }
                if (e.key === 'Enter' && filtrados.length === 1) selecionar(filtrados[0])
              }}
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtrados.length === 0 && <li className="px-3 py-2 text-sm text-text-muted">Nenhum modelo encontrado</li>}
            {filtrados.map(p => (
              <li
                key={p.id}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gold-primary/8 ${p.id === valueId ? 'bg-gold-primary/12 font-medium' : ''}`}
                onMouseDown={() => selecionar(p)}
              >
                {p.fabricante && <span className="text-text-muted">{p.fabricante} – </span>}
                {p.modelo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SelectProduto({ produtos, valueId, placeholder, unidadeLabel, onChange }: {
  produtos: ProdutoPiso[]; valueId: string; placeholder: string; unidadeLabel: string; onChange: (p: ProdutoPiso | undefined) => void
}) {
  return (
    <div className="relative">
      <select value={valueId} onChange={e => onChange(produtos.find(p => p.id === e.target.value))} className="input-base appearance-none pr-8">
        <option value="">{placeholder}</option>
        {produtos.map(p => <option key={p.id} value={p.id}>{p.modelo}{unidadeLabel ? ` (R$ ${p.valor.toFixed(2)}${unidadeLabel})` : ''}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
    </div>
  )
}

function MedidasLineares({ medidas, onSet, onAdd, onRemove }: {
  medidas: string[]; onSet: (i: number, v: string) => void; onAdd: () => void; onRemove: (i: number) => void
}) {
  const total = medidas.reduce((s, m) => s + (parseFloat(m) || 0), 0)
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {medidas.map((m, i) => (
          <div key={i} className="flex items-center gap-1">
            <input type="number" step="0.01" value={m} onChange={e => onSet(i, e.target.value)} placeholder="m" className="input-base w-24" />
            {medidas.length > 1 && <button onClick={() => onRemove(i)} className="text-text-muted hover:text-red-500"><Trash2 size={12} /></button>}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button onClick={onAdd} className="flex items-center gap-1 text-xs font-medium text-gold-primary"><Plus size={12} /> Adicionar medida</button>
        <span className="text-xs text-text-secondary">Total linear: {total.toFixed(2)} m</span>
      </div>
    </div>
  )
}
