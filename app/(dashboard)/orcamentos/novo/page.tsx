'use client'

import { Suspense } from 'react'
import { useOrcamento } from '@/context/OrcamentoContext'
import ProgressBar from '@/components/ui/ProgressBar'
import Etapa1Cliente from './Etapa1Cliente'
import Etapa2Produto from './Etapa2Produto'
import Etapa3Cortina from './Etapa3Cortina'
import RevisaoOrcamento from './RevisaoOrcamento'
import ResultadoOrcamento from './ResultadoOrcamento'

export default function NovoOrcamentoPage() {
  const { etapa } = useOrcamento()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-2">
        <h2 className="text-2xl font-semibold text-text-primary">Novo Orçamento</h2>
        <p className="text-sm text-text-muted mt-0.5">Preencha as informações para gerar o orçamento</p>
      </div>

      {etapa <= 3 && <ProgressBar etapaAtual={etapa} />}

      {etapa === 1 && <Suspense fallback={null}><Etapa1Cliente /></Suspense>}
      {etapa === 2 && <Etapa2Produto />}
      {etapa === 3 && <Etapa3Cortina />}
      {etapa === 4 && <RevisaoOrcamento />}
      {etapa === 5 && <ResultadoOrcamento />}
    </div>
  )
}
