'use client'

import { useState } from 'react'
import { Home, Pencil, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useOrcamento } from '@/context/OrcamentoContext'
import { calcularAmbiente, Configuracoes } from '@/lib/calculoCortina'

type ConfigsRaw = Record<string, string>

function toConfigs(c: ConfigsRaw): Configuracoes {
  return {
    markup_padrao: parseFloat(c.markup_padrao ?? '40'),
    comissao_padrao: parseFloat(c.comissao_padrao ?? '8'),
    rt_padrao: parseFloat(c.rt_padrao ?? '5'),
    confeccao_prega_macho: parseFloat(c.confeccao_prega_macho ?? '27'),
    confeccao_prega_femea: parseFloat(c.confeccao_prega_femea ?? '27'),
    confeccao_prega_americana: parseFloat(c.confeccao_prega_americana ?? '30'),
    confeccao_prega_franzida: parseFloat(c.confeccao_prega_franzida ?? '27'),
    confeccao_prega_reta: parseFloat(c.confeccao_prega_reta ?? '24'),
    confeccao_wave: parseFloat(c.confeccao_wave ?? '38'),
    confeccao_soft_wave: parseFloat(c.confeccao_soft_wave ?? '30'),
    confeccao_varao: parseFloat(c.confeccao_varao ?? '39'),
    instalacao_valor_m2: parseFloat(c.instalacao_valor_m2 ?? '35'),
    fator_prega_macho: parseFloat(c.fator_prega_macho ?? '3'),
    fator_prega_femea: parseFloat(c.fator_prega_femea ?? '2.5'),
    fator_prega_americana: parseFloat(c.fator_prega_americana ?? '2.5'),
    fator_prega_franzida: parseFloat(c.fator_prega_franzida ?? '3'),
    fator_prega_reta: parseFloat(c.fator_prega_reta ?? '1'),
    fator_wave: parseFloat(c.fator_wave ?? '2'),
    fator_soft_wave: parseFloat(c.fator_soft_wave ?? '2'),
    fator_varao: parseFloat(c.fator_varao ?? '1.5'),
  }
}

const MODELO_LABELS: Record<string, string> = {
  prega_macho: 'Prega Macho', prega_femea: 'Prega Fêmea', prega_americana: 'Prega Americana',
  prega_franzida: 'Prega Franzida', prega_reta: 'Prega Reta / Blackout',
  wave: 'Wave', soft_wave: 'Soft Wave', varao: 'Varão',
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-medium text-text-primary">{value}</p>
    </div>
  )
}

export default function RevisaoOrcamento() {
  const { cliente, ambientes, setAmbienteAtual, setEtapa } = useOrcamento()
  const [configs, setConfigs] = useState<ConfigsRaw | null>(null)
  const [loading, setLoading] = useState(false)

  // Carrega configs uma vez
  useState(() => {
    fetch('/api/configuracoes').then(r => r.json()).then(setConfigs)
  })

  function editarAmbiente(i: number) {
    setAmbienteAtual(i)
    setEtapa(3)
  }

  async function confirmar() {
    setLoading(true)
    setEtapa(5)
  }

  const cfgs = configs ? toConfigs(configs) : null

  const totalMetros = cfgs
    ? ambientes.reduce((s, a) => {
        if (!a.tecidoId || !a.largura || !a.altura) return s
        try {
          const r = calcularAmbiente({
            nomeAmbiente: a.nomeAmbiente, largura: parseFloat(a.largura), altura: parseFloat(a.altura),
            modeloCortina: a.modeloCortina, tipoAbertura: a.tipoAbertura,
            tecido: { id: a.tecidoId, larguraMaxima: a.tecidoLargura, valorMetro: a.tecidoValor },
            blackout: a.blackoutAtivo && a.blackoutId ? { id: a.blackoutId, larguraMaxima: a.blackoutLargura, valorMetro: a.blackoutValor } : null,
            bainhaDesejada: a.bainhaDesejada ? parseFloat(a.bainhaDesejada) : null,
            instalacao: a.instalacao,
            trilhoAcessoriosValor: a.trilhoAcessoriosValor ? parseFloat(a.trilhoAcessoriosValor) : null,
            outrosValor: a.outrosValor ? parseFloat(a.outrosValor) : null,
          }, cfgs)
          return s + r.quantidadeTecido
        } catch { return s }
      }, 0)
    : 0

  return (
    <div className="space-y-4">
      {/* Resumo cliente */}
      {cliente && (
        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-brand-border rounded-xl">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-primary to-gold-light flex items-center justify-center">
            <span className="text-xs font-semibold text-white">{cliente.nome.charAt(0).toUpperCase()}</span>
          </div>
          <span className="text-sm font-medium text-text-primary">{cliente.nome}</span>
          {cliente.telefone && <span className="text-sm text-text-muted">· {cliente.telefone}</span>}
        </div>
      )}

      <div className="card-base p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Revisão do Orçamento</h3>

        <div className="space-y-4">
          {ambientes.map((a, i) => {
            const resultado = cfgs && a.tecidoId && a.largura && a.altura
              ? (() => {
                  try {
                    return calcularAmbiente({
                      nomeAmbiente: a.nomeAmbiente, largura: parseFloat(a.largura), altura: parseFloat(a.altura),
                      modeloCortina: a.modeloCortina, tipoAbertura: a.tipoAbertura,
                      tecido: { id: a.tecidoId, larguraMaxima: a.tecidoLargura, valorMetro: a.tecidoValor },
                      blackout: a.blackoutAtivo && a.blackoutId ? { id: a.blackoutId, larguraMaxima: a.blackoutLargura, valorMetro: a.blackoutValor } : null,
                      bainhaDesejada: a.bainhaDesejada ? parseFloat(a.bainhaDesejada) : null,
                      instalacao: a.instalacao,
                      trilhoAcessoriosValor: a.trilhoAcessoriosValor ? parseFloat(a.trilhoAcessoriosValor) : null,
                      outrosValor: a.outrosValor ? parseFloat(a.outrosValor) : null,
                    }, cfgs)
                  } catch { return null }
                })()
              : null

            return (
              <div key={i} className="border border-brand-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-brand-bg border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <Home size={16} className="text-gold-primary" />
                    <span className="text-sm font-semibold text-text-primary">{a.nomeAmbiente || `Ambiente ${i + 1}`}</span>
                  </div>
                  <button onClick={() => editarAmbiente(i)} className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-gold-primary transition-colors">
                    <Pencil size={13} />
                    Editar
                  </button>
                </div>

                <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoRow label="Largura" value={a.largura ? `${a.largura}m` : '—'} />
                  <InfoRow label="Altura" value={a.altura ? `${a.altura}m` : '—'} />
                  <InfoRow label="Modelo" value={MODELO_LABELS[a.modeloCortina] ?? a.modeloCortina} />
                  <InfoRow label="Tecido" value={a.tecidoNome || '—'} />
                  <InfoRow label="Blackout" value={a.blackoutAtivo ? (a.blackoutNome || 'Sim') : 'Não'} />
                  <InfoRow label="Instalação" value={a.instalacao ? 'Sim' : 'Não'} />
                  <InfoRow label="Abertura" value={a.tipoAbertura === 'INTEIRA' ? 'Inteira' : 'Central'} />
                  {a.bainhaDesejada && <InfoRow label="Bainha" value={`${a.bainhaDesejada}m`} />}
                </div>

                {resultado && (
                  <div className="mx-4 mb-4 p-3 bg-[#FFFBF2] border-l-[3px] border-l-gold-primary rounded-r-lg">
                    <p className="text-[10px] font-semibold text-gold-primary uppercase tracking-wider mb-2">Cálculo automático</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-text-secondary">Tecido: <strong className="text-text-primary">{resultado.quantidadeTecido.toFixed(2)}m</strong></span>
                      {resultado.quantidadeBlackout && (
                        <span className="text-text-secondary">Blackout: <strong className="text-text-primary">{resultado.quantidadeBlackout.toFixed(2)}m</strong></span>
                      )}
                    </div>
                    {resultado.bainhaNaoCabe && resultado.bainhaAlerta && (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 rounded-lg">
                        <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700">{resultado.bainhaAlerta}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Resumo total */}
        <div className="mt-4 p-4 bg-brand-bg border border-brand-border rounded-xl flex items-center justify-between">
          <div className="flex gap-6">
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider">Ambientes</p>
              <p className="text-lg font-semibold text-text-primary">{ambientes.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider">Total de tecido</p>
              <p className="text-lg font-semibold text-text-primary">{totalMetros.toFixed(2)}m</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-brand-border">
          <button onClick={() => setEtapa(3)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-brand-input transition-colors">
            <ChevronLeft size={16} />
            Editar orçamento
          </button>
          <button
            onClick={confirmar}
            disabled={loading}
            className="btn-gold flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-sm font-semibold disabled:opacity-70"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={16} />}
            Confirmar e ver resultado
          </button>
        </div>
      </div>
    </div>
  )
}
