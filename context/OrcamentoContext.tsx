'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { ModeloCortina, TipoAbertura } from '@/lib/calculoCortina'

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
  bainhaDesejada: string
  modeloCortina: ModeloCortina
  tipoAbertura: TipoAbertura
  trilhoTipo: 'trilho_suico' | 'varao'
  tecidoId: string
  tecidoNome: string
  tecidoLargura: number
  tecidoValor: number
  blackoutAtivo: boolean
  blackoutId: string
  blackoutNome: string
  blackoutLargura: number
  blackoutValor: number
  instalacao: boolean
  trilhoAcessoriosValor: string
  outrosValor: string
  observacoes: string
}

export const ambienteVazio: AmbienteForm = {
  nomeAmbiente: '',
  largura: '',
  altura: '',
  bainhaDesejada: '',
  modeloCortina: 'prega_macho',
  tipoAbertura: 'INTEIRA',
  trilhoTipo: 'trilho_suico',
  tecidoId: '',
  tecidoNome: '',
  tecidoLargura: 0,
  tecidoValor: 0,
  blackoutAtivo: false,
  blackoutId: '',
  blackoutNome: '',
  blackoutLargura: 0,
  blackoutValor: 0,
  instalacao: false,
  trilhoAcessoriosValor: '',
  outrosValor: '',
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
  resetOrcamento: () => void
}

const OrcamentoContext = createContext<OrcamentoContextType | null>(null)

export function OrcamentoProvider({ children }: { children: ReactNode }) {
  const [etapa, setEtapa] = useState(1)
  const [cliente, setCliente] = useState<ClienteOrcamento | null>(null)
  const [produto, setProduto] = useState('cortina')
  const [ambientes, setAmbientes] = useState<AmbienteForm[]>([{ ...ambienteVazio }])
  const [ambienteAtual, setAmbienteAtual] = useState(0)

  function resetOrcamento() {
    setEtapa(1)
    setCliente(null)
    setProduto('cortina')
    setAmbientes([{ ...ambienteVazio }])
    setAmbienteAtual(0)
  }

  return (
    <OrcamentoContext.Provider value={{
      etapa, setEtapa,
      cliente, setCliente,
      produto, setProduto,
      ambientes, setAmbientes,
      ambienteAtual, setAmbienteAtual,
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
