'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { ModeloCortina, TipoAbertura } from '@/lib/calculoCortina'

interface OrcamentoHydrated {
  id: string
  numero: number
  token?: string | null
  cliente: ClienteOrcamento | null
  ambientes: Array<{
    nomeAmbiente: string
    largura: string | number
    altura: string | number
    modeloCortina: ModeloCortina
    tipoAbertura: TipoAbertura
    tipoAberturaBlackout?: TipoAbertura | null
    trilhoTipo?: 'trilho_suico' | 'varao' | null
    bainhaDesejada?: string | number | null
    tecidoExtra?: boolean
    tecidoId: string
    tecido?: { nome: string; larguraMaxima: string | number; valorMetro: string | number }
    blackoutId?: string | null
    blackout?: { nome: string; larguraMaxima: string | number; valorMetro: string | number } | null
    instalacao?: boolean
    instalador?: { id: string; nome: string; telefone?: string | null } | null
    trilhoVarao?: { id: string; nome: string; valorUnitario: string | number } | null
    outrosValor?: string | number | null
    observacoes?: string | null
    blackoutExtra?: boolean
  }>
  ambientesPapel?: Array<{
    nomeAmbiente: string
    papelId: string
    papel?: { id: string; album: string; referencia: string; dimensao: string; valorRolo: string | number }
    medicoes: Array<{ largura: number; altura: number; m2: number }>
    observacoes?: string | null
  }>
}

export interface ClienteOrcamento {
  id?: string
  nome: string
  telefone?: string
  email?: string
  endereco?: string
  arquiteto?: string
}

export interface AmbienteForm {
  nomeAmbiente: string
  largura: string
  altura: string
  modeloCortina: ModeloCortina
  tipoAbertura: TipoAbertura
  tipoAberturaBlackout: TipoAbertura
  trilhoTipo: 'trilho_suico' | 'varao'
  bainhaDesejada: string
  tecidoExtra: boolean
  tecidoId: string
  tecidoNome: string
  tecidoLargura: number
  tecidoValor: number
  blackoutAtivo: boolean
  blackoutExtra: boolean
  blackoutId: string
  blackoutNome: string
  blackoutLargura: number
  blackoutValor: number
  instalacao: boolean
  instaladorId: string
  instaladorNome: string
  instaladorTelefone: string
  trilhoId: string
  trilhoNome: string
  trilhoValorUnitario: number
  outrosValor: string
  observacoes: string
}

export const ambienteVazio: AmbienteForm = {
  nomeAmbiente: '',
  largura: '',
  altura: '',
  modeloCortina: 'prega_macho',
  tipoAbertura: 'INTEIRA',
  tipoAberturaBlackout: 'INTEIRA',
  trilhoTipo: 'trilho_suico',
  bainhaDesejada: '0.20',
  tecidoExtra: false,
  tecidoId: '',
  tecidoNome: '',
  tecidoLargura: 0,
  tecidoValor: 0,
  blackoutAtivo: false,
  blackoutExtra: false,
  blackoutId: '',
  blackoutNome: '',
  blackoutLargura: 0,
  blackoutValor: 0,
  instalacao: false,
  instaladorId: '',
  instaladorNome: '',
  instaladorTelefone: '',
  trilhoId: '',
  trilhoNome: '',
  trilhoValorUnitario: 0,
  outrosValor: '',
  observacoes: '',
}

export interface MedicaoPapelForm {
  largura: string
  altura: string
}

export interface AmbientePapelForm {
  nomeAmbiente: string
  papelId: string
  papelAlbum: string
  papelReferencia: string
  papelDimensao: string
  papelValorRolo: number
  medicoes: MedicaoPapelForm[]
  observacoes: string
}

export const ambientePapelVazio: AmbientePapelForm = {
  nomeAmbiente: '',
  papelId: '',
  papelAlbum: '',
  papelReferencia: '',
  papelDimensao: '',
  papelValorRolo: 0,
  medicoes: [{ largura: '', altura: '' }],
  observacoes: '',
}

interface OrcamentoContextType {
  etapa: number
  setEtapa: (e: number) => void
  cliente: ClienteOrcamento | null
  setCliente: (c: ClienteOrcamento | null) => void
  produto: string
  setProduto: (p: string) => void
  ambientes: AmbienteForm[]
  setAmbientes: (a: AmbienteForm[]) => void
  ambienteAtual: number
  setAmbienteAtual: (i: number) => void
  ambientesPapel: AmbientePapelForm[]
  setAmbientesPapel: (a: AmbientePapelForm[]) => void
  ambientePapelAtual: number
  setAmbientePapelAtual: (i: number) => void
  orcamentoId: string | null
  setOrcamentoId: (id: string | null) => void
  orcamentoNumero: number | null
  setOrcamentoNumero: (numero: number | null) => void
  orcamentoToken: string | null
  setOrcamentoToken: (token: string | null) => void
  modoEdicao: boolean
  hidratando: boolean
  hidratarOrcamento: (orcamento: OrcamentoHydrated) => void
  iniciarNovoOrcamento: () => void
  resetOrcamento: () => void
}

const OrcamentoContext = createContext<OrcamentoContextType | null>(null)

export function OrcamentoProvider({ children }: { children: ReactNode }) {
  const [etapa, setEtapa] = useState(1)
  const [cliente, setCliente] = useState<ClienteOrcamento | null>(null)
  const [produto, setProduto] = useState('cortina')
  const [ambientes, setAmbientes] = useState<AmbienteForm[]>([{ ...ambienteVazio }])
  const [ambienteAtual, setAmbienteAtual] = useState(0)
  const [ambientesPapel, setAmbientesPapel] = useState<AmbientePapelForm[]>([{ ...ambientePapelVazio }])
  const [ambientePapelAtual, setAmbientePapelAtual] = useState(0)
  const [orcamentoId, setOrcamentoId] = useState<string | null>(null)
  const [orcamentoNumero, setOrcamentoNumero] = useState<number | null>(null)
  const [orcamentoToken, setOrcamentoToken] = useState<string | null>(null)
  const [hidratando, setHidratando] = useState(false)

  function iniciarNovoOrcamento() {
    setOrcamentoId(null)
    setOrcamentoNumero(null)
    setOrcamentoToken(null)
    setEtapa(1)
    setCliente(null)
    setProduto('cortina')
    setAmbientes([{ ...ambienteVazio }])
    setAmbienteAtual(0)
    setAmbientesPapel([{ ...ambientePapelVazio }])
    setAmbientePapelAtual(0)
    setHidratando(false)
  }

  function hidratarOrcamento(orcamento: OrcamentoHydrated) {
    setHidratando(true)

    const ambientesHydratados: AmbienteForm[] = orcamento.ambientes.length > 0
      ? orcamento.ambientes.map(a => ({
          ...ambienteVazio,
          nomeAmbiente: a.nomeAmbiente ?? '',
          largura: a.largura != null ? String(a.largura) : '',
          altura: a.altura != null ? String(a.altura) : '',
          modeloCortina: a.modeloCortina,
          tipoAbertura: a.tipoAbertura,
          tipoAberturaBlackout: (a.tipoAberturaBlackout ?? a.tipoAbertura) as TipoAbertura,
          trilhoTipo: a.trilhoTipo ?? 'trilho_suico',
          bainhaDesejada: a.bainhaDesejada != null ? String(a.bainhaDesejada) : '0.20',
          tecidoExtra: a.tecidoExtra ?? false,
          tecidoId: a.tecidoId,
          tecidoNome: a.tecido?.nome ?? '',
          tecidoLargura: Number(a.tecido?.larguraMaxima ?? 0),
          tecidoValor: Number(a.tecido?.valorMetro ?? 0),
          blackoutAtivo: Boolean(a.blackoutId && a.blackout),
          blackoutExtra: a.blackoutExtra ?? false,
          blackoutId: a.blackoutId ?? '',
          blackoutNome: a.blackout?.nome ?? '',
          blackoutLargura: Number(a.blackout?.larguraMaxima ?? 0),
          blackoutValor: Number(a.blackout?.valorMetro ?? 0),
          instalacao: a.instalacao ?? false,
          instaladorId: a.instalador?.id ?? '',
          instaladorNome: a.instalador?.nome ?? '',
          instaladorTelefone: a.instalador?.telefone ?? '',
          trilhoId: a.trilhoVarao?.id ?? '',
          trilhoNome: a.trilhoVarao?.nome ?? '',
          trilhoValorUnitario: Number(a.trilhoVarao?.valorUnitario ?? 0),
          outrosValor: a.outrosValor != null ? String(a.outrosValor) : '',
          observacoes: a.observacoes ?? '',
        }))
      : [{ ...ambienteVazio }]

    const ambientesPapelHydratados: AmbientePapelForm[] = (orcamento.ambientesPapel && orcamento.ambientesPapel.length > 0)
      ? orcamento.ambientesPapel.map(a => ({
          ...ambientePapelVazio,
          nomeAmbiente: a.nomeAmbiente ?? '',
          papelId: a.papelId,
          papelAlbum: a.papel?.album ?? '',
          papelReferencia: a.papel?.referencia ?? '',
          papelDimensao: a.papel?.dimensao ?? '',
          papelValorRolo: Number(a.papel?.valorRolo ?? 0),
          medicoes: a.medicoes.map(m => ({ largura: String(m.largura), altura: String(m.altura) })),
          observacoes: a.observacoes ?? '',
        }))
      : [{ ...ambientePapelVazio }]

    const temPapel = orcamento.ambientesPapel && orcamento.ambientesPapel.length > 0

    setOrcamentoId(orcamento.id)
    setOrcamentoNumero(orcamento.numero)
    setOrcamentoToken(orcamento.token ?? null)
    setCliente(orcamento.cliente)
    setProduto(temPapel ? 'papel_parede' : 'cortina')
    setAmbientes(ambientesHydratados)
    setAmbienteAtual(0)
    setAmbientesPapel(ambientesPapelHydratados)
    setAmbientePapelAtual(0)
    setEtapa(2)
    setHidratando(false)
  }

  function resetOrcamento() {
    iniciarNovoOrcamento()
  }

  return (
    <OrcamentoContext.Provider value={{
      etapa, setEtapa,
      cliente, setCliente,
      produto, setProduto,
      ambientes, setAmbientes,
      ambienteAtual, setAmbienteAtual,
      ambientesPapel, setAmbientesPapel,
      ambientePapelAtual, setAmbientePapelAtual,
      orcamentoId, setOrcamentoId,
      orcamentoNumero, setOrcamentoNumero,
      orcamentoToken, setOrcamentoToken,
      modoEdicao: Boolean(orcamentoId),
      hidratando,
      hidratarOrcamento,
      iniciarNovoOrcamento,
      resetOrcamento,
    }}>
      {children}
    </OrcamentoContext.Provider>
  )
}

export function useOrcamento() {
  const ctx = useContext(OrcamentoContext)
  if (!ctx) throw new Error('useOrcamento must be used within OrcamentoProvider')
  return ctx
}
