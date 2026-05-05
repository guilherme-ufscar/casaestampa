'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, Info, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react'
import { useOrcamento, AmbienteForm, ambienteVazio } from '@/context/OrcamentoContext'
import { calcularAmbiente, Configuracoes, ModeloCortina, TipoAbertura } from '@/lib/calculoCortina'

type Tecido = { id: string; nome: string; larguraMaxima: number; valorMetro: number; tipo: string }

const MODELOS: { value: ModeloCortina; label: string }[] = [
  { value: 'prega_macho', label: 'Prega Macho' },
  { value: 'prega_femea', label: 'Prega Fêmea' },
  { value: 'prega_americana', label: 'Prega Americana' },
  { value: 'prega_franzida', label: 'Prega Franzida' },
  { value: 'prega_reta', label: 'Prega Reta / Blackout' },
  { value: 'wave', label: 'Wave' },
  { value: 'soft_wave', label: 'Soft Wave' },
  { value: 'varao', label: 'Varão' },
]

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mt-6 mb-3">
      <span className="text-[11px] font-semibold text-gold-primary uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-gold-primary/30 to-transparent" />
    </div>
  )
}

export default function Etapa3Cortina() {
  const { cliente, ambientes, setAmbientes, ambienteAtual, setAmbienteAtual, setEtapa } = useOrcamento()
  const [tecidos, setTecidos] = useState<Tecido[]>([])
  const [configs, setConfigs] = useState<Configs | null>(null)
  const [previa, setPrevia] = useState<PreviaCalc | null>(null)

  type Configs = Record<string, string>
  type PreviaCalc = { metros: number; bainhaNaoCabe: boolean; alerta: string | null }

  const form = ambientes[ambienteAtual]

  function setForm(updater: (prev: AmbienteForm) => AmbienteForm) {
    setAmbientes(ambientes.map((a, i) => i === ambienteAtual ? updater(a) : a))
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/tecidos').then(r => r.json()),
      fetch('/api/configuracoes').then(r => r.json()),
    ]).then(([t, c]) => {
      setTecidos(t)
      setConfigs(c)
    })
  }, [])

  // Prévia em tempo real
  useEffect(() => {
    if (!configs || !form.tecidoId || !form.largura || !form.altura) {
      setPrevia(null)
      return
    }
    const cfg: Configuracoes = {
      markup_padrao: parseFloat(configs.markup_padrao ?? '40'),
      comissao_padrao: parseFloat(configs.comissao_padrao ?? '8'),
      rt_padrao: parseFloat(configs.rt_padrao ?? '5'),
      confeccao_valor_metro: parseFloat(configs.confeccao_valor_metro ?? '25'),
      instalacao_valor_fixo: parseFloat(configs.instalacao_valor_fixo ?? '150'),
      fator_prega_macho: parseFloat(configs.fator_prega_macho ?? '3'),
      fator_prega_femea: parseFloat(configs.fator_prega_femea ?? '2.5'),
      fator_prega_americana: parseFloat(configs.fator_prega_americana ?? '2.5'),
      fator_prega_franzida: parseFloat(configs.fator_prega_franzida ?? '3'),
      fator_prega_reta: parseFloat(configs.fator_prega_reta ?? '1'),
      fator_wave: parseFloat(configs.fator_wave ?? '2'),
      fator_soft_wave: parseFloat(configs.fator_soft_wave ?? '2'),
      fator_varao: parseFloat(configs.fator_varao ?? '1.5'),
    }
    try {
      const r = calcularAmbiente({
        nomeAmbiente: form.nomeAmbiente,
        largura: parseFloat(form.largura),
        altura: parseFloat(form.altura),
        modeloCortina: form.modeloCortina,
        tipoAbertura: form.tipoAbertura,
        tecido: { id: form.tecidoId, larguraMaxima: form.tecidoLargura, valorMetro: form.tecidoValor },
        blackout: form.blackoutAtivo && form.blackoutId ? { id: form.blackoutId, larguraMaxima: form.blackoutLargura, valorMetro: form.blackoutValor } : null,
        bainhaDesejada: form.bainhaDesejada ? parseFloat(form.bainhaDesejada) : null,
        instalacao: form.instalacao,
        trilhoAcessoriosValor: form.trilhoAcessoriosValor ? parseFloat(form.trilhoAcessoriosValor) : null,
        outrosValor: form.outrosValor ? parseFloat(form.outrosValor) : null,
      }, cfg)
      setPrevia({ metros: r.quantidadeTecido, bainhaNaoCabe: r.bainhaNaoCabe, alerta: r.bainhaAlerta })
    } catch {
      setPrevia(null)
    }
  }, [form, configs])

  const tecidosPrincipais = tecidos.filter(t => t.tipo === 'PRINCIPAL' && (t as { ativo?: boolean }).ativo !== false)
  const tecidosBlackout = tecidos.filter(t => t.tipo === 'BLACKOUT' && (t as { ativo?: boolean }).ativo !== false)

  function adicionarAmbiente() {
    const novos = [...ambientes, { ...ambienteVazio, nomeAmbiente: `Ambiente ${ambientes.length + 1}` }]
    setAmbientes(novos)
    setAmbienteAtual(novos.length - 1)
  }

  function irParaRevisao() {
    setEtapa(4)
  }

  return (
    <div className="flex gap-6">
      {/* Formulário principal */}
      <div className="flex-1 min-w-0">
        {/* Resumo cliente */}
        {cliente && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border border-brand-border rounded-xl mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-primary to-gold-light flex items-center justify-center">
                <span className="text-xs font-semibold text-white">{cliente.nome.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-text-primary">{cliente.nome}</span>
              {cliente.telefone && <span className="text-sm text-text-muted">· {cliente.telefone}</span>}
            </div>
            <button onClick={() => setEtapa(1)} className="text-xs font-medium text-gold-primary hover:text-gold-dark transition-colors">Editar</button>
          </div>
        )}

        {/* Tabs de ambientes */}
        {ambientes.length > 1 && (
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {ambientes.map((a, i) => (
              <button
                key={i}
                onClick={() => setAmbienteAtual(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  i === ambienteAtual ? 'bg-gold-primary text-white' : 'bg-brand-input text-text-secondary hover:bg-brand-border'
                }`}
              >
                {a.nomeAmbiente || `Ambiente ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        <div className="card-base p-6">
          <h3 className="text-base font-semibold text-text-primary">
            Etapa 3 — Detalhes da Cortina
            {ambientes.length > 1 && <span className="text-text-muted font-normal ml-2">· Ambiente {ambienteAtual + 1}</span>}
          </h3>

          {/* IDENTIFICAÇÃO */}
          <SectionLabel label="Identificação" />
          <input
            type="text"
            value={form.nomeAmbiente}
            onChange={e => setForm(p => ({ ...p, nomeAmbiente: e.target.value }))}
            placeholder="Ex: Sala de Estar, Quarto Principal..."
            className="input-base"
          />

          {/* MEDIDAS */}
          <SectionLabel label="Medidas" />
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'largura', label: 'Largura (m)' },
              { key: 'altura', label: 'Altura (m)' },
              { key: 'bainhaDesejada', label: 'Bainha (m)' },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</label>
                  {key === 'bainhaDesejada' && (
                    <div className="relative group">
                      <Info size={12} className="text-text-muted cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-text-primary text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        A bainha é dobrada na parte inferior. O sistema verifica se cabe na largura útil do tecido e alerta se precisar de tecido extra.
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(form as unknown as Record<string, string>)[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder="0,00"
                  className="input-base"
                />
              </div>
            ))}
          </div>

          {/* SUPORTE E MODELO */}
          <SectionLabel label="Suporte e Modelo" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Tipo de suporte</label>
              <select value={form.trilhoTipo} onChange={e => setForm(p => ({ ...p, trilhoTipo: e.target.value as 'trilho_suico' | 'varao' }))} className="input-base">
                <option value="trilho_suico">Trilho Suíço</option>
                <option value="varao">Varão</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Modelo da cortina</label>
              <select value={form.modeloCortina} onChange={e => setForm(p => ({ ...p, modeloCortina: e.target.value as ModeloCortina }))} className="input-base">
                {MODELOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          {/* TECIDOS */}
          <SectionLabel label="Tecidos" />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Tecido principal</label>
              <select
                value={form.tecidoId}
                onChange={e => {
                  const t = tecidosPrincipais.find(x => x.id === e.target.value)
                  setForm(p => ({ ...p, tecidoId: e.target.value, tecidoNome: t?.nome ?? '', tecidoLargura: t?.larguraMaxima ?? 0, tecidoValor: t?.valorMetro ?? 0 }))
                }}
                className="input-base"
              >
                <option value="">Selecione o tecido...</option>
                {tecidosPrincipais.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
              {form.tecidoId && (
                <div className="flex gap-2 mt-1">
                  <span className="px-2.5 py-1 bg-brand-input border border-brand-border rounded-full text-[11px] font-medium text-text-secondary">
                    Largura: {form.tecidoLargura.toFixed(2)}m
                  </span>
                  <span className="px-2.5 py-1 bg-brand-input border border-brand-border rounded-full text-[11px] font-medium text-text-secondary">
                    R$ {form.tecidoValor.toFixed(2)}/m
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-text-primary">Forro / Blackout</span>
              <button onClick={() => setForm(p => ({ ...p, blackoutAtivo: !p.blackoutAtivo }))} className="text-gold-primary">
                {form.blackoutAtivo ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-text-muted" />}
              </button>
            </div>

            {form.blackoutAtivo && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Tecido blackout</label>
                <select
                  value={form.blackoutId}
                  onChange={e => {
                    const t = tecidosBlackout.find(x => x.id === e.target.value)
                    setForm(p => ({ ...p, blackoutId: e.target.value, blackoutNome: t?.nome ?? '', blackoutLargura: t?.larguraMaxima ?? 0, blackoutValor: t?.valorMetro ?? 0 }))
                  }}
                  className="input-base"
                >
                  <option value="">Selecione o blackout...</option>
                  {tecidosBlackout.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
                {form.blackoutId && (
                  <div className="flex gap-2 mt-1">
                    <span className="px-2.5 py-1 bg-brand-input border border-brand-border rounded-full text-[11px] font-medium text-text-secondary">
                      Largura: {form.blackoutLargura.toFixed(2)}m
                    </span>
                    <span className="px-2.5 py-1 bg-brand-input border border-brand-border rounded-full text-[11px] font-medium text-text-secondary">
                      R$ {form.blackoutValor.toFixed(2)}/m
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* INSTALAÇÃO E ACABAMENTO */}
          <SectionLabel label="Instalação e Acabamento" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">Instalação</span>
              <button onClick={() => setForm(p => ({ ...p, instalacao: !p.instalacao }))} className="text-gold-primary">
                {form.instalacao ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-text-muted" />}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Abertura</label>
              <div className="flex rounded-lg overflow-hidden border border-brand-border">
                {(['INTEIRA', 'CENTRAL'] as TipoAbertura[]).map(op => (
                  <button
                    key={op}
                    onClick={() => setForm(p => ({ ...p, tipoAbertura: op }))}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      form.tipoAbertura === op
                        ? 'bg-gold-primary text-white'
                        : 'bg-brand-input text-text-secondary hover:bg-brand-border'
                    }`}
                  >
                    {op === 'INTEIRA' ? 'Inteira' : 'Central'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Trilho e Acessórios (R$)</label>
                <input type="number" step="0.01" min="0" value={form.trilhoAcessoriosValor} onChange={e => setForm(p => ({ ...p, trilhoAcessoriosValor: e.target.value }))} placeholder="0,00" className="input-base" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Outros (R$)</label>
                <input type="number" step="0.01" min="0" value={form.outrosValor} onChange={e => setForm(p => ({ ...p, outrosValor: e.target.value }))} placeholder="Custos adicionais" className="input-base" />
              </div>
            </div>
          </div>

          {/* OBSERVAÇÕES */}
          <SectionLabel label="Observações" />
          <textarea
            value={form.observacoes}
            onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
            rows={3}
            placeholder="Observações sobre este ambiente..."
            className="input-base h-auto py-3 resize-none"
          />

          {/* Alerta bainha */}
          {previa?.bainhaNaoCabe && previa.alerta && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mt-4">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">{previa.alerta}</p>
            </div>
          )}

          {/* Ações sticky */}
          <div className="flex items-center justify-between pt-6 mt-4 border-t border-brand-border">
            <button onClick={() => setEtapa(2)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-50 transition-colors">
              <ChevronLeft size={16} />
              Cancelar
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={adicionarAmbiente}
                className="px-4 py-2.5 rounded-[10px] text-sm font-semibold border border-gold-primary text-gold-primary hover:bg-gold-primary/5 transition-colors"
              >
                + Adicionar outro ambiente
              </button>
              <button
                onClick={irParaRevisao}
                disabled={!form.tecidoId || !form.largura || !form.altura}
                className="btn-gold flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Calcular Orçamento
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de prévia */}
      {previa && (
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-6 card-base border-l-[3px] border-l-gold-primary p-5 space-y-3">
            <p className="text-[11px] font-semibold text-gold-primary uppercase tracking-wider">Estimativa</p>
            <div>
              <p className="text-xs text-text-muted">Metros de tecido</p>
              <p className="text-2xl font-bold text-text-primary">{previa.metros.toFixed(2)}m</p>
            </div>
            {form.blackoutAtivo && (
              <div>
                <p className="text-xs text-text-muted">Metros de blackout</p>
                <p className="text-lg font-semibold text-text-primary">—</p>
              </div>
            )}
            {previa.bainhaNaoCabe && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">Bainha requer tecido extra</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
