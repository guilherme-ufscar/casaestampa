'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ToggleLeft, ToggleRight, AlertTriangle, Ruler, Layers, Wrench, FileText, ChevronDown } from 'lucide-react'
import { useOrcamento, AmbienteForm, ambienteVazio } from '@/context/OrcamentoContext'
import { calcularAmbiente, Configuracoes, ModeloCortina, TipoAbertura } from '@/lib/calculoCortina'

type Tecido = { id: string; nome: string; larguraMaxima: number; valorMetro: number; tipo: string; ativo?: boolean }
type Configs = Record<string, string>
type Trilho = { id: string; nome: string; valorUnitario: number; ativo: boolean }
type Instalador = { id: string; nome: string; telefone: string | null; especialidades?: string[] }
type PreviaCalc = {
  metros: number
  metrosBlackout: number | null
  precisaTecidoExtra: boolean
  precisaBlackoutExtra: boolean
  bainhaDisponivel: number
  alerta: string | null
}

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

function nomeLimpo(nome: string) {
  return nome.replace(/\s+\d+%[A-Z]+(\s+\d+%[A-Z]+)*/g, '').replace(/\s{2,}/g, ' ').trim()
}

function composicao(nome: string) {
  const match = nome.match(/(\d+%[A-Z]+(\s+\d+%[A-Z]+)*)/)
  return match ? match[0] : null
}

function SectionLabel({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mt-7 mb-4">
      {icon && <span className="text-gold-primary">{icon}</span>}
      <span className="text-[11px] font-semibold text-gold-primary uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-gold-primary/30 to-transparent" />
    </div>
  )
}

function TecidoSelect({
  label, tecidos, value, onChange,
}: {
  label: string
  tecidos: Tecido[]
  value: string
  onChange: (id: string, t: Tecido | undefined) => void
}) {
  const selecionado = tecidos.find(t => t.id === value)
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value, tecidos.find(t => t.id === e.target.value))}
          className="input-base appearance-none pr-8"
        >
          <option value="">Selecione o tecido...</option>
          {tecidos.map(t => (
            <option key={t.id} value={t.id}>{nomeLimpo(t.nome)}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>
      {selecionado && (
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gold-primary/8 border border-gold-primary/20 rounded-full text-[11px] font-medium text-gold-dark">
            <Ruler size={10} />
            {Number(selecionado.larguraMaxima).toFixed(2)}m largura
          </span>
          {composicao(selecionado.nome) && (
            <span className="inline-flex items-center px-2.5 py-1 bg-brand-input border border-brand-border rounded-full text-[11px] text-text-muted">
              {composicao(selecionado.nome)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function Etapa3Cortina() {
  const { cliente, ambientes, setAmbientes, ambienteAtual, setAmbienteAtual, setEtapa } = useOrcamento()
  const [tecidos, setTecidos] = useState<Tecido[]>([])
  const [trilhos, setTrilhos] = useState<Trilho[]>([])
  const [instaladores, setInstaladores] = useState<Instalador[]>([])
  const [configs, setConfigs] = useState<Configs | null>(null)
  const [previa, setPrevia] = useState<PreviaCalc | null>(null)

  const form = ambientes[ambienteAtual]

  function setForm(updater: (prev: AmbienteForm) => AmbienteForm) {
    setAmbientes(ambientes.map((a, i) => i === ambienteAtual ? updater(a) : a))
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/tecidos').then(r => r.json()),
      fetch('/api/configuracoes').then(r => r.json()),
      fetch('/api/trilhos').then(r => r.json()),
      fetch('/api/instaladores?tipo=CORTINA,PERSIANA').then(r => r.json()),
    ]).then(([t, c, tr, ins]) => {
      setTecidos(t)
      setConfigs(c)
      setTrilhos(tr.filter((x: { ativo: boolean }) => x.ativo))
      setInstaladores(ins)
    })
  }, [])

  useEffect(() => {
    if (!configs || !form.tecidoId || !form.largura || !form.altura) {
      setPrevia(null)
      return
    }
    const cfg: Configuracoes = {
      markup_padrao: parseFloat(configs.markup_padrao ?? '40'),
      comissao_padrao: parseFloat(configs.comissao_padrao ?? '8'),
      rt_padrao: parseFloat(configs.rt_padrao ?? '5'),
      confeccao_prega_macho: parseFloat(configs.confeccao_prega_macho ?? '27'),
      confeccao_prega_femea: parseFloat(configs.confeccao_prega_femea ?? '27'),
      confeccao_prega_americana: parseFloat(configs.confeccao_prega_americana ?? '30'),
      confeccao_prega_franzida: parseFloat(configs.confeccao_prega_franzida ?? '27'),
      confeccao_prega_reta: parseFloat(configs.confeccao_prega_reta ?? '24'),
      confeccao_wave: parseFloat(configs.confeccao_wave ?? '38'),
      confeccao_soft_wave: parseFloat(configs.confeccao_soft_wave ?? '30'),
      confeccao_varao: parseFloat(configs.confeccao_varao ?? '39'),
      instalacao_valor_m2: parseFloat(configs.instalacao_valor_m2 ?? '35'),
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
        tipoAberturaBlackout: form.blackoutAtivo ? form.tipoAberturaBlackout : null,
        tecido: { id: form.tecidoId, larguraMaxima: form.tecidoLargura, valorMetro: form.tecidoValor },
        blackout: form.blackoutAtivo && form.blackoutId ? { id: form.blackoutId, larguraMaxima: form.blackoutLargura, valorMetro: form.blackoutValor } : null,
        tecidoExtra: form.tecidoExtra,
        blackoutExtra: form.blackoutExtra,
        bainhaDesejada: form.bainhaDesejada ? parseFloat(form.bainhaDesejada) : 0.2,
        instalacao: form.instalacao,
        trilhoValorUnitario: form.trilhoValorUnitario || null,
        outrosValor: form.outrosValor ? parseFloat(form.outrosValor) : null,
      }, cfg)
      setPrevia({
        metros: r.quantidadeTecido,
        metrosBlackout: r.quantidadeBlackout,
        precisaTecidoExtra: r.precisaTecidoExtra,
        precisaBlackoutExtra: r.precisaBlackoutExtra,
        bainhaDisponivel: r.bainhaDisponivel,
        alerta: r.bainhaAlerta,
      })
    } catch {
      setPrevia(null)
    }
  }, [form, configs])

  const tecidosPrincipais = tecidos.filter(t => t.tipo === 'PRINCIPAL' && t.ativo !== false)
  const tecidosBlackout = tecidos.filter(t => t.tipo === 'BLACKOUT' && t.ativo !== false)

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
      <div className="flex-1 min-w-0">
        {cliente && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border border-brand-border rounded-xl mb-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-primary to-gold-light flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">{cliente.nome.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary leading-tight">{cliente.nome}</p>
                {cliente.telefone && <p className="text-xs text-text-muted">{cliente.telefone}</p>}
              </div>
            </div>
            <button onClick={() => setEtapa(1)} className="text-xs font-medium text-gold-primary hover:text-gold-dark transition-colors px-2 py-1 rounded hover:bg-gold-primary/5">Editar</button>
          </div>
        )}

        {ambientes.length > 1 && (
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {ambientes.map((a, i) => (
              <button
                key={i}
                onClick={() => setAmbienteAtual(i)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  i === ambienteAtual
                    ? 'bg-gold-primary text-white shadow-sm'
                    : 'bg-brand-input text-text-secondary hover:bg-brand-border border border-brand-border'
                }`}
              >
                {a.nomeAmbiente || `Ambiente ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        <div className="card-base p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-text-primary">Detalhes da Cortina</h3>
            {ambientes.length > 1 && (
              <span className="text-xs font-medium text-text-muted bg-brand-input px-2.5 py-1 rounded-full border border-brand-border">
                Ambiente {ambienteAtual + 1} de {ambientes.length}
              </span>
            )}
          </div>

          <SectionLabel label="Identificação" icon={<FileText size={13} />} />
          <input
            type="text"
            value={form.nomeAmbiente}
            onChange={e => setForm(p => ({ ...p, nomeAmbiente: e.target.value }))}
            placeholder="Ex: Sala de Estar, Quarto Principal..."
            className="input-base"
          />

          <SectionLabel label="Medidas" icon={<Ruler size={13} />} />
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'largura', label: 'Largura (m)' },
              { key: 'altura', label: 'Altura (m)' },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</label>
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

          {previa && previa.precisaTecidoExtra && !form.tecidoExtra && (
            <div className="flex items-start justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mt-3">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">Tecido extra necessário</p>
                  <p className="text-xs text-amber-600 mt-0.5">Bainha útil: {previa.bainhaDisponivel.toFixed(2)}m. Abaixo de 0,18m, o sistema já considera tecido extra automaticamente.</p>
                </div>
              </div>
            </div>
          )}

          {form.tecidoExtra && (
            <div className="flex items-center justify-between gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mt-3">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-sm font-semibold">Tecido extra ativado</span>
                <span className="text-xs text-green-500">({previa ? `${previa.metros.toFixed(2)}m` : '—'})</span>
              </div>
              <button
                onClick={() => setForm(p => ({ ...p, tecidoExtra: false }))}
                className="text-xs text-green-600 hover:text-red-500 transition-colors font-medium"
              >
                Remover
              </button>
            </div>
          )}

          <SectionLabel label="Suporte e Modelo" icon={<Layers size={13} />} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Tipo de suporte</label>
              <div className="relative">
                <select value={form.trilhoTipo} onChange={e => setForm(p => ({ ...p, trilhoTipo: e.target.value as 'trilho_suico' | 'varao' }))} className="input-base appearance-none pr-8">
                  <option value="trilho_suico">Trilho Suíço</option>
                  <option value="varao">Varão</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Modelo da cortina</label>
              <div className="relative">
                <select value={form.modeloCortina} onChange={e => setForm(p => ({ ...p, modeloCortina: e.target.value as ModeloCortina }))} className="input-base appearance-none pr-8">
                  {MODELOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          <SectionLabel label="Tecidos" icon={<Layers size={13} />} />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Bainha desejada (m)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.18"
                  value={form.bainhaDesejada}
                  onChange={e => setForm(p => ({ ...p, bainhaDesejada: e.target.value || '0.20' }))}
                  className="input-base"
                />
              </div>
            </div>
            <TecidoSelect
              label="Tecido principal"
              tecidos={tecidosPrincipais}
              value={form.tecidoId}
              onChange={(id, t) => setForm(p => ({ ...p, tecidoId: id, tecidoNome: t?.nome ?? '', tecidoLargura: Number(t?.larguraMaxima ?? 0), tecidoValor: Number(t?.valorMetro ?? 0) }))}
            />

            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Abertura da cortina</label>
              <div className="flex rounded-xl overflow-hidden border border-brand-border">
                {(['INTEIRA', 'CENTRAL'] as TipoAbertura[]).map(op => (
                  <button
                    key={op}
                    onClick={() => setForm(p => ({ ...p, tipoAbertura: op }))}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                      form.tipoAbertura === op
                        ? 'bg-gold-primary text-white'
                        : 'bg-brand-input text-text-secondary hover:bg-brand-border'
                    }`}
                  >
                    {op === 'INTEIRA' ? 'Inteira' : 'Central (2 folhas)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 px-3 bg-brand-input rounded-xl border border-brand-border">
              <div>
                <p className="text-sm font-medium text-text-primary">Forro / Blackout</p>
                <p className="text-xs text-text-muted">Adicionar tecido de forro</p>
              </div>
              <button onClick={() => setForm(p => ({ ...p, blackoutAtivo: !p.blackoutAtivo }))} className="text-gold-primary">
                {form.blackoutAtivo ? <ToggleRight size={30} /> : <ToggleLeft size={30} className="text-text-muted" />}
              </button>
            </div>

            {form.blackoutAtivo && (
              <>
                <TecidoSelect
                  label="Tecido blackout"
                  tecidos={tecidosBlackout}
                  value={form.blackoutId}
                  onChange={(id, t) => setForm(p => ({ ...p, blackoutId: id, blackoutNome: t?.nome ?? '', blackoutLargura: Number(t?.larguraMaxima ?? 0), blackoutValor: Number(t?.valorMetro ?? 0) }))}
                />
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Abertura do blackout</label>
                  <div className="flex rounded-xl overflow-hidden border border-brand-border">
                    {(['INTEIRA', 'CENTRAL'] as TipoAbertura[]).map(op => (
                      <button
                        key={op}
                        onClick={() => setForm(p => ({ ...p, tipoAberturaBlackout: op }))}
                        className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                          form.tipoAberturaBlackout === op
                            ? 'bg-gold-primary text-white'
                            : 'bg-brand-input text-text-secondary hover:bg-brand-border'
                        }`}
                      >
                        {op === 'INTEIRA' ? 'Inteira' : 'Central (2 folhas)'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-brand-input rounded-xl border border-brand-border">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Tecido extra no blackout</p>
                    <p className="text-xs text-text-muted">Ative se quiser forçar o cálculo extra além da regra automática</p>
                  </div>
                  <button onClick={() => setForm(p => ({ ...p, blackoutExtra: !p.blackoutExtra }))} className="text-gold-primary">
                    {form.blackoutExtra ? <ToggleRight size={30} /> : <ToggleLeft size={30} className="text-text-muted" />}
                  </button>
                </div>
              </>
            )}
          </div>

          <SectionLabel label="Instalação e Acabamento" icon={<Wrench size={13} />} />
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 px-3 bg-brand-input rounded-xl border border-brand-border">
              <div>
                <p className="text-sm font-medium text-text-primary">Instalação</p>
                <p className="text-xs text-text-muted">Incluir mão de obra</p>
              </div>
              <button onClick={() => setForm(p => ({ ...p, instalacao: !p.instalacao, instaladorId: '', instaladorNome: '', instaladorTelefone: '' }))} className="text-gold-primary">
                {form.instalacao ? <ToggleRight size={30} /> : <ToggleLeft size={30} className="text-text-muted" />}
              </button>
            </div>

            {form.instalacao && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Instalador</label>
                <div className="relative">
                  <select
                    value={form.instaladorId}
                    onChange={e => {
                      const ins = instaladores.find(x => x.id === e.target.value)
                      setForm(p => ({ ...p, instaladorId: e.target.value, instaladorNome: ins?.nome ?? '', instaladorTelefone: ins?.telefone ?? '' }))
                    }}
                    className="input-base appearance-none pr-8"
                  >
                    <option value="">Selecione o instalador...</option>
                    {instaladores.map(ins => (
                      <option key={ins.id} value={ins.id}>{ins.nome}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Trilho / Varão</label>
                <div className="relative">
                  <select
                    value={form.trilhoId}
                    onChange={e => {
                      const t = trilhos.find(x => x.id === e.target.value)
                      setForm(p => ({ ...p, trilhoId: e.target.value, trilhoNome: t?.nome ?? '', trilhoValorUnitario: Number(t?.valorUnitario ?? 0) }))
                    }}
                    className="input-base appearance-none pr-8"
                  >
                    <option value="">Sem trilho</option>
                    {['Rio Flex', 'Venetillo'].map(fornecedor => {
                      const grupo = trilhos.filter(t => t.nome.includes(fornecedor))
                      if (!grupo.length) return null
                      return (
                        <optgroup key={fornecedor} label={fornecedor}>
                          {grupo.map(t => (
                            <option key={t.id} value={t.id}>{t.nome.replace(` (${fornecedor})`, '')}</option>
                          ))}
                        </optgroup>
                      )
                    })}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
                {form.trilhoId && form.largura && (
                  <p className="text-[11px] text-text-muted">
                    {Math.ceil(parseFloat(form.largura) * 2) / 2}m × R$ {Number(form.trilhoValorUnitario).toFixed(2)}/m
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">Outros (R$)</label>
                <input type="number" step="0.01" min="0" value={form.outrosValor} onChange={e => setForm(p => ({ ...p, outrosValor: e.target.value }))} placeholder="Custos adicionais" className="input-base" />
              </div>
            </div>
          </div>

          <SectionLabel label="Observações" icon={<FileText size={13} />} />
          <textarea
            value={form.observacoes}
            onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
            rows={3}
            placeholder="Observações sobre este ambiente..."
            className="input-base h-auto py-3 resize-none"
          />

          {previa?.alerta && form.tecidoExtra && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mt-4">
              <AlertTriangle size={18} className="text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{previa.alerta}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 mt-4 border-t border-brand-border">
            <button onClick={() => setEtapa(2)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-red-400 hover:bg-red-50 transition-colors">
              <ChevronLeft size={16} />
              Voltar
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={adicionarAmbiente}
                className="px-4 py-2.5 rounded-[10px] text-sm font-semibold border border-gold-primary text-gold-primary hover:bg-gold-primary/5 transition-colors"
              >
                + Outro ambiente
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

      <div className="hidden lg:block w-60 shrink-0">
        <div className="sticky top-6 space-y-3">
          {previa ? (
            <div className="card-base border-l-[3px] border-l-gold-primary p-5 space-y-4">
              <p className="text-[11px] font-semibold text-gold-primary uppercase tracking-wider">Estimativa em tempo real</p>
              <div className="space-y-1">
                <p className="text-xs text-text-muted">Metros de tecido</p>
                <p className="text-3xl font-extrabold text-text-primary">{previa.metros.toFixed(2)}<span className="text-base font-medium text-text-muted ml-1">m</span></p>
              </div>
              <div className="space-y-1 pt-2 border-t border-brand-border">
                <p className="text-xs text-text-muted">Bainha disponível</p>
                <p className={`text-lg font-bold ${previa.bainhaDisponivel < 0.18 ? 'text-amber-500' : 'text-text-primary'}`}>
                  {previa.bainhaDisponivel.toFixed(2)}<span className="text-sm font-medium text-text-muted ml-1">m</span>
                </p>
              </div>
              {form.blackoutAtivo && form.blackoutId && (
                <div className="space-y-1 pt-2 border-t border-brand-border">
                  <p className="text-xs text-text-muted">Metros de blackout</p>
                  <p className="text-xl font-bold text-text-primary">{previa?.metrosBlackout?.toFixed(2) ?? '—'}m</p>
                </div>
              )}
              {previa.precisaTecidoExtra && !form.tecidoExtra && (
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 leading-snug">Bainha requer tecido extra</p>
                </div>
              )}
              {form.tecidoExtra && (
                <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                  <AlertTriangle size={13} className="text-green-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-green-700 leading-snug">Tecido extra incluído</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card-base p-5 text-center space-y-2 opacity-50">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Estimativa</p>
              <p className="text-xs text-text-muted">Preencha tecido, largura e altura para ver a prévia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
