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
    instalacao?: boolean
    observacoes?: string | null
  }>
  ambientesPersiana?: Array<{
    nomeAmbiente: string
    persianaId: string
    persiana?: { id: string; fornecedor: string; tipo: string; colecao: string; modelo: string; valorM2: string | number; minM2: string | number }
    fornecedor: string
    tipo: string
    colecao: string
    modelo: string
    largura: string | number
    altura: string | number
    quantidade: number
    lado?: string | null
    acionamento: string
    instalacaoLocal?: string | null
    instalacao: boolean
    bandoId?: string | null
    bandoNome?: string | null
    bandoValorMetro?: string | number | null
    bandoLado?: string | null
    guiaLateralId?: string | null
    guiaLateralNome?: string | null
    guiaLateralValorMetro?: string | number | null
    guiaLateralFator?: number | null
    guiaBaseId?: string | null
    guiaBaseNome?: string | null
    guiaBaseValorMetro?: string | number | null
    motorId?: string | null
    motorNome?: string | null
    motorValor?: string | number | null
    controleRemotoId?: string | null
    controleRemotoNome?: string | null
    controleRemotoValor?: string | number | null
    valorM2: string | number
    minM2: string | number
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
  instalacao: boolean
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
  instalacao: false,
  medicoes: [{ largura: '', altura: '' }],
  observacoes: '',
}

export interface AmbientePersianaForm {
  nomeAmbiente: string
  persianaId: string
  fornecedor: string
  tipo: string
  colecao: string
  modelo: string
  largura: string
  altura: string
  quantidade: number
  lado: string
  acionamento: string
  instalacaoLocal: string
  instalacao: boolean
  // Bandô
  bandoAtivo: boolean
  bandoId: string
  bandoNome: string
  bandoValorMetro: number
  bandoLado: string
  // Guia lateral
  guiaLateralAtivo: boolean
  guiaLateralId: string
  guiaLateralNome: string
  guiaLateralValorMetro: number
  guiaLateralFator: 1 | 2
  // Guia base
  guiaBaseAtivo: boolean
  guiaBaseId: string
  guiaBaseNome: string
  guiaBaseValorMetro: number
  // Motor / controle
  motorId: string
  motorNome: string
  motorValor: number
  controleRemotoId: string
  controleRemotoNome: string
  controleRemotoValor: number
  // Catálogo snapshot
  valorM2: number
  minM2: number
  observacoes: string
}

export const ambientePersianaVazio: AmbientePersianaForm = {
  nomeAmbiente: '',
  persianaId: '',
  fornecedor: '',
  tipo: '',
  colecao: '',
  modelo: '',
  largura: '',
  altura: '',
  quantidade: 1,
  lado: '',
  acionamento: 'manual',
  instalacaoLocal: '',
  instalacao: true,
  bandoAtivo: false,
  bandoId: '',
  bandoNome: '',
  bandoValorMetro: 0,
  bandoLado: '',
  guiaLateralAtivo: false,
  guiaLateralId: '',
  guiaLateralNome: '',
  guiaLateralValorMetro: 0,
  guiaLateralFator: 1,
  guiaBaseAtivo: false,
  guiaBaseId: '',
  guiaBaseNome: '',
  guiaBaseValorMetro: 0,
  motorId: '',
  motorNome: '',
  motorValor: 0,
  controleRemotoId: '',
  controleRemotoNome: '',
  controleRemotoValor: 0,
  valorM2: 0,
  minM2: 1.5,
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
  ambientesPersiana: AmbientePersianaForm[]
  setAmbientesPersiana: (a: AmbientePersianaForm[]) => void
  ambientePersianaAtual: number
  setAmbientePersianaAtual: (i: number) => void
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
  const [ambientesPersiana, setAmbientesPersiana] = useState<AmbientePersianaForm[]>([{ ...ambientePersianaVazio }])
  const [ambientePersianaAtual, setAmbientePersianaAtual] = useState(0)
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
    setAmbientesPersiana([{ ...ambientePersianaVazio }])
    setAmbientePersianaAtual(0)
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
          instalacao: a.instalacao ?? false,
          medicoes: a.medicoes.map(m => ({ largura: String(m.largura), altura: String(m.altura) })),
          observacoes: a.observacoes ?? '',
        }))
      : [{ ...ambientePapelVazio }]

    const temPapel = orcamento.ambientesPapel && orcamento.ambientesPapel.length > 0
    const temPersiana = orcamento.ambientesPersiana && orcamento.ambientesPersiana.length > 0

    const ambientesPersianaHydratados: AmbientePersianaForm[] = temPersiana
      ? orcamento.ambientesPersiana!.map(a => ({
          ...ambientePersianaVazio,
          nomeAmbiente: a.nomeAmbiente ?? '',
          persianaId: a.persianaId,
          fornecedor: a.fornecedor,
          tipo: a.tipo,
          colecao: a.colecao,
          modelo: a.modelo,
          largura: a.largura != null ? String(a.largura) : '',
          altura: a.altura != null ? String(a.altura) : '',
          quantidade: a.quantidade,
          lado: a.lado ?? '',
          acionamento: a.acionamento,
          instalacaoLocal: a.instalacaoLocal ?? '',
          instalacao: a.instalacao,
          bandoAtivo: Boolean(a.bandoId),
          bandoId: a.bandoId ?? '',
          bandoNome: a.bandoNome ?? '',
          bandoValorMetro: Number(a.bandoValorMetro ?? 0),
          bandoLado: a.bandoLado ?? '',
          guiaLateralAtivo: Boolean(a.guiaLateralId),
          guiaLateralId: a.guiaLateralId ?? '',
          guiaLateralNome: a.guiaLateralNome ?? '',
          guiaLateralValorMetro: Number(a.guiaLateralValorMetro ?? 0),
          guiaLateralFator: (a.guiaLateralFator ?? 1) as 1 | 2,
          guiaBaseAtivo: Boolean(a.guiaBaseId),
          guiaBaseId: a.guiaBaseId ?? '',
          guiaBaseNome: a.guiaBaseNome ?? '',
          guiaBaseValorMetro: Number(a.guiaBaseValorMetro ?? 0),
          motorId: a.motorId ?? '',
          motorNome: a.motorNome ?? '',
          motorValor: Number(a.motorValor ?? 0),
          controleRemotoId: a.controleRemotoId ?? '',
          controleRemotoNome: a.controleRemotoNome ?? '',
          controleRemotoValor: Number(a.controleRemotoValor ?? 0),
          valorM2: Number(a.valorM2),
          minM2: Number(a.minM2),
          observacoes: a.observacoes ?? '',
        }))
      : [{ ...ambientePersianaVazio }]

    setOrcamentoId(orcamento.id)
    setOrcamentoNumero(orcamento.numero)
    setOrcamentoToken(orcamento.token ?? null)
    setCliente(orcamento.cliente)
    setProduto(temPersiana ? 'persiana' : temPapel ? 'papel_parede' : 'cortina')
    setAmbientes(ambientesHydratados)
    setAmbienteAtual(0)
    setAmbientesPapel(ambientesPapelHydratados)
    setAmbientePapelAtual(0)
    setAmbientesPersiana(ambientesPersianaHydratados)
    setAmbientePersianaAtual(0)
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
      ambientesPersiana, setAmbientesPersiana,
      ambientePersianaAtual, setAmbientePersianaAtual,
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
