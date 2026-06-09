'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useOrcamento } from '@/context/OrcamentoContext'
import ProgressBar from '@/components/ui/ProgressBar'
import Etapa1Cliente from './Etapa1Cliente'
import Etapa2Produto from './Etapa2Produto'
import Etapa3Cortina from './Etapa3Cortina'
import Etapa3PapelParede from './Etapa3PapelParede'
import Etapa3Persiana from './Etapa3Persiana'
import Etapa3Piso from './Etapa3Piso'
import RevisaoOrcamento from './RevisaoOrcamento'
import ResultadoOrcamento from './ResultadoOrcamento'

function NovoOrcamentoContent() {
  const searchParams = useSearchParams()
  const { etapa, produto, hidratarOrcamento, iniciarNovoOrcamento, modoEdicao, hidratando } = useOrcamento()
  const [loadingEdicao, setLoadingEdicao] = useState(false)
  const inicializadoRef = useRef(false)

  useEffect(() => {
    if (inicializadoRef.current) return
    inicializadoRef.current = true

    const editarId = searchParams.get('editar')
    if (!editarId) {
      iniciarNovoOrcamento()
      return
    }

    setLoadingEdicao(true)
    fetch(`/api/orcamentos/${editarId}`)
      .then(async r => {
        if (!r.ok) throw new Error('Erro ao carregar orçamento')
        return r.json()
      })
      .then(hidratarOrcamento)
      .catch(() => iniciarNovoOrcamento())
      .finally(() => setLoadingEdicao(false))
  }, [hidratarOrcamento, iniciarNovoOrcamento, searchParams])

  if (loadingEdicao || hidratando) {
    return (
      <div className="max-w-4xl mx-auto py-20 flex flex-col items-center gap-4">
        <Loader2 size={28} className="animate-spin text-gold-primary" />
        <p className="text-sm text-text-muted">Carregando orçamento...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-2">
        <h2 className="text-2xl font-semibold text-text-primary">{modoEdicao ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
        <p className="text-sm text-text-muted mt-0.5">{modoEdicao ? 'Atualize as informações para recalcular o orçamento' : 'Preencha as informações para gerar o orçamento'}</p>
      </div>

      {etapa <= 3 && <ProgressBar etapaAtual={etapa} />}

      {etapa === 1 && <Suspense fallback={null}><Etapa1Cliente /></Suspense>}
      {etapa === 2 && <Etapa2Produto />}
      {etapa === 3 && produto === 'papel_parede' && <Etapa3PapelParede />}
      {etapa === 3 && produto === 'persiana' && <Etapa3Persiana />}
      {etapa === 3 && produto === 'piso' && <Etapa3Piso />}
      {etapa === 3 && produto !== 'papel_parede' && produto !== 'persiana' && produto !== 'piso' && <Etapa3Cortina />}
      {etapa === 4 && <RevisaoOrcamento />}
      {etapa === 5 && <ResultadoOrcamento />}
    </div>
  )
}

export default function NovoOrcamentoPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto py-20 flex flex-col items-center gap-4">
        <Loader2 size={28} className="animate-spin text-gold-primary" />
        <p className="text-sm text-text-muted">Carregando orçamento...</p>
      </div>
    }>
      <NovoOrcamentoContent />
    </Suspense>
  )
}
