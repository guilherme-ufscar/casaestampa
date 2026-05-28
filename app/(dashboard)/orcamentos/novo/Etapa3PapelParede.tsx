'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronDown, Plus, Trash2, Calculator, ToggleLeft, ToggleRight } from 'lucide-react'
import { useOrcamento, AmbientePapelForm, ambientePapelVazio } from '@/context/OrcamentoContext'
import { getFatorDimensao, calcularInstalacaoPapel } from '@/lib/calculoPapelParede'

type PapelParede = {
  id: string
  album: string
  referencia: string | null
  dimensao: string
  valorRolo: number
  categoria: string | null
  ativo: boolean
}

const DIMENSAO_LABELS: Record<string, string> = {
  '0.53x10': '0,53 × 10m (4,5 m²/rolo)',
  '0.70x10': '0,70 × 10m (6,5 m²/rolo)',
  '1.00x10': '1,00 × 10m (9,0 m²/rolo)',
  '1.06x10': '1,06 × 10m (9,0 m²/rolo)',
}

export default function Etapa3PapelParede() {
  const {
    ambientesPapel, setAmbientesPapel,
    ambientePapelAtual, setAmbientePapelAtual,
    setEtapa,
  } = useOrcamento()

  const [papeis, setPapeis] = useState<PapelParede[]>([])
  const [loading, setLoading] = useState(true)
  const [configInstalacao, setConfigInstalacao] = useState({ por1: 150, por2: 200, porRolo: 90 })

  useEffect(() => {
    fetch('/api/configuracoes').then(r => r.json()).then((cfg: Record<string, string>) => {
      setConfigInstalacao({
        por1: parseFloat(cfg.instalacao_papel_1rolo ?? '150'),
        por2: parseFloat(cfg.instalacao_papel_2rolos ?? '200'),
        porRolo: parseFloat(cfg.instalacao_papel_por_rolo ?? '90'),
      })
    })
  }, [])

  useEffect(() => {
    fetch('/api/papeis-parede').then(r => r.json()).then(data => {
      setPapeis(data.filter((p: PapelParede) => p.ativo))
      setLoading(false)
    })
  }, [])

  const amb = ambientesPapel[ambientePapelAtual]

  function updateAmb(partial: Partial<AmbientePapelForm>) {
    const updated = [...ambientesPapel]
    updated[ambientePapelAtual] = { ...updated[ambientePapelAtual], ...partial }
    setAmbientesPapel(updated)
  }

  const albumsFiltrados = useMemo(() => {
    const set = new Set(papeis.map(p => p.album))
    return Array.from(set).sort()
  }, [papeis])

  const referenciasDoAlbum = useMemo(() => {
    if (!amb.papelAlbum) return []
    return papeis.filter(p => p.album === amb.papelAlbum)
  }, [papeis, amb.papelAlbum])

  const papelSelecionadoSemRef = useMemo(() => {
    if (!amb.papelId) return false
    const papel = papeis.find(p => p.id === amb.papelId)
    return papel && !papel.referencia
  }, [papeis, amb.papelId])

  function selecionarAlbum(album: string) {
    updateAmb({ papelAlbum: album, papelId: '', papelReferencia: '', papelDimensao: '', papelValorRolo: 0 })
  }

  function selecionarReferencia(papelId: string) {
    const papel = papeis.find(p => p.id === papelId)
    if (papel) {
      updateAmb({
        papelId: papel.id,
        papelReferencia: papel.referencia ?? '',
        papelDimensao: papel.dimensao,
        papelValorRolo: papel.valorRolo,
      })
    }
  }

  function selecionarAlbumSemRef(album: string) {
    const papel = papeis.find(p => p.album === album)
    if (papel) {
      updateAmb({
        papelAlbum: album,
        papelId: papel.id,
        papelReferencia: '',
        papelDimensao: papel.dimensao,
        papelValorRolo: papel.valorRolo,
      })
    } else {
      updateAmb({ papelAlbum: album, papelId: '', papelReferencia: '', papelDimensao: '', papelValorRolo: 0 })
    }
  }

  function updateMedicao(idx: number, field: 'largura' | 'altura', value: string) {
    const medicoes = [...amb.medicoes]
    medicoes[idx] = { ...medicoes[idx], [field]: value }
    updateAmb({ medicoes })
  }

  function addMedicao() {
    updateAmb({ medicoes: [...amb.medicoes, { largura: '', altura: '' }] })
  }

  function removeMedicao(idx: number) {
    if (amb.medicoes.length <= 1) return
    const medicoes = amb.medicoes.filter((_, i) => i !== idx)
    updateAmb({ medicoes })
  }

  function addAmbiente() {
    setAmbientesPapel([...ambientesPapel, { ...ambientePapelVazio }])
    setAmbientePapelAtual(ambientesPapel.length)
  }

  function removeAmbiente(idx: number) {
    if (ambientesPapel.length <= 1) return
    const updated = ambientesPapel.filter((_, i) => i !== idx)
    setAmbientesPapel(updated)
    setAmbientePapelAtual(Math.min(ambientePapelAtual, updated.length - 1))
  }

  const metrosQuadrados = amb.medicoes.reduce((sum, m) => {
    const l = parseFloat(m.largura)
    const a = parseFloat(m.altura)
    return sum + (Number.isFinite(l) && Number.isFinite(a) ? l * a : 0)
  }, 0)

  const fator = getFatorDimensao(amb.papelDimensao)
  const rolos = metrosQuadrados > 0 ? Math.ceil(metrosQuadrados / fator) : 0

  const podeAvancar = ambientesPapel.every(a =>
    a.nomeAmbiente && a.papelId && a.medicoes.some(m => parseFloat(m.largura) > 0 && parseFloat(m.altura) > 0)
  )

  if (loading) {
    return <div className="flex justify-center py-16"><div className="animate-spin w-6 h-6 border-2 border-gold-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Tabs de ambientes */}
      {ambientesPapel.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ambientesPapel.map((a, i) => (
            <button
              key={i}
              onClick={() => setAmbientePapelAtual(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                i === ambientePapelAtual ? 'bg-gold-primary text-white' : 'bg-brand-input text-text-secondary border border-brand-border'
              }`}
            >
              {a.nomeAmbiente || `Ambiente ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="card-base p-6 md:p-8 space-y-6">
        <h3 className="text-lg font-semibold text-text-primary">
          Papel de Parede — {amb.nomeAmbiente || `Ambiente ${ambientePapelAtual + 1}`}
        </h3>

        {/* Ambiente */}
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

        {/* Álbum */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Álbum / Modelo</label>
          <div className="relative">
            <select
              value={amb.papelAlbum}
              onChange={e => {
                const album = e.target.value
                const papeisAlbum = papeis.filter(p => p.album === album)
                const temRef = papeisAlbum.some(p => p.referencia)
                if (temRef) {
                  selecionarAlbum(album)
                } else {
                  selecionarAlbumSemRef(album)
                }
              }}
              className="input-base appearance-none pr-8"
            >
              <option value="">Selecione o álbum...</option>
              {albumsFiltrados.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </div>

        {/* Referência — select quando tem referências cadastradas */}
        {amb.papelAlbum && referenciasDoAlbum.length > 0 && referenciasDoAlbum.some(p => p.referencia) && (
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Referência</label>
            <div className="relative">
              <select value={amb.papelId} onChange={e => selecionarReferencia(e.target.value)} className="input-base appearance-none pr-8">
                <option value="">Selecione a referência...</option>
                {referenciasDoAlbum.filter(p => p.referencia).map(p => (
                  <option key={p.id} value={p.id}>{p.referencia}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>
        )}

        {/* Referência manual — campo texto quando não tem referência cadastrada */}
        {amb.papelId && papelSelecionadoSemRef && (
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Referência (digitar)</label>
            <input
              type="text"
              value={amb.papelReferencia}
              onChange={e => updateAmb({ papelReferencia: e.target.value })}
              placeholder="Digite a referência do papel..."
              className="input-base"
            />
          </div>
        )}

        {/* Dimensão automática */}
        {amb.papelDimensao && (
          <div className="flex items-center gap-3 px-4 py-3 bg-brand-bg border border-brand-border rounded-xl">
            <Calculator size={16} className="text-gold-primary" />
            <div>
              <p className="text-xs font-medium text-text-primary">Dimensão: {DIMENSAO_LABELS[amb.papelDimensao] ?? amb.papelDimensao}</p>
            </div>
          </div>
        )}

        {/* Medições */}
        <div className="space-y-3">
          <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Medições das Paredes</label>
          {amb.medicoes.map((m, i) => {
            const l = parseFloat(m.largura)
            const a = parseFloat(m.altura)
            const m2 = Number.isFinite(l) && Number.isFinite(a) ? l * a : 0
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.01"
                    value={m.largura}
                    onChange={e => updateMedicao(i, 'largura', e.target.value)}
                    placeholder="Largura (m)"
                    className="input-base text-sm"
                  />
                </div>
                <span className="text-text-muted text-sm">×</span>
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.01"
                    value={m.altura}
                    onChange={e => updateMedicao(i, 'altura', e.target.value)}
                    placeholder="Altura (m)"
                    className="input-base text-sm"
                  />
                </div>
                <span className="text-sm text-text-secondary w-16 text-right">{m2 > 0 ? `${m2.toFixed(2)} m²` : '—'}</span>
                <button onClick={() => removeMedicao(i)} disabled={amb.medicoes.length <= 1} className="p-1.5 rounded hover:bg-red-50 text-red-400 disabled:opacity-30 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
          <button onClick={addMedicao} className="flex items-center gap-1.5 text-sm font-medium text-gold-primary hover:text-gold-dark transition-colors">
            <Plus size={14} /> Adicionar parede
          </button>
        </div>

        {/* Resultado */}
        {metrosQuadrados > 0 && amb.papelId && (
          <div className="bg-brand-bg border border-brand-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Metragem total</span>
              <span className="font-medium text-text-primary">{metrosQuadrados.toFixed(2)} m²</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Divisor ({DIMENSAO_LABELS[amb.papelDimensao]?.split('(')[0]?.trim()})</span>
              <span className="font-medium text-text-primary">÷ {fator}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Quantidade de rolos</span>
              <span className="font-semibold text-gold-primary">{rolos} {rolos === 1 ? 'rolo' : 'rolos'}</span>
            </div>
            {rolos > 0 && (
              <div className="flex justify-between text-sm pt-1 border-t border-brand-border">
                <span className="text-text-secondary">Instalação estimada</span>
                <span className="font-medium text-text-primary">
                  R$ {calcularInstalacaoPapel(rolos, { instalacao_papel_1rolo: configInstalacao.por1, instalacao_papel_2rolos: configInstalacao.por2, instalacao_papel_por_rolo: configInstalacao.porRolo }).toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
          </div>
        )}

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
            {ambientesPapel.length > 1 && (
              <button onClick={() => removeAmbiente(ambientePapelAtual)} className="px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                Remover ambiente
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