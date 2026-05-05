'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, FileDown, MessageCircle, Plus, Save, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useOrcamento, ambienteVazio } from '@/context/OrcamentoContext'
import { useSession } from 'next-auth/react'

type ResultadoAmbientePublico = {
  nomeAmbiente: string
  quantidadeTecido: number
  quantidadeBlackout: number | null
  bainhaNaoCabe: boolean
  bainhaAlerta: string | null
  precoFinalVenda: number
}

type ResultadoAdminAmbiente = ResultadoAmbientePublico & {
  custoTotal: number
  precoComMarkup: number
  valorRt: number
  valorComissao: number
  margem: number
  markup: number
}

type ResultadoAPI = {
  orcamento: { id: string; numero: number }
  resultado: {
    ambientes: ResultadoAmbientePublico[] | ResultadoAdminAmbiente[]
    totalPrecoFinalVenda: number
    totalCusto?: number
    totalComissao?: number
    totalRt?: number
    totalMargem?: number
  }
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ResultadoOrcamento() {
  const { data: session } = useSession()
  const { cliente, ambientes, setAmbientes, setAmbienteAtual, setEtapa, resetOrcamento } = useOrcamento()
  const [resultado, setResultado] = useState<ResultadoAPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [adminExpanded, setAdminExpanded] = useState(false)
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    async function salvar() {
      try {
        const payload = {
          clienteId: cliente?.id ?? undefined,
          ambientes: ambientes.map(a => ({
            nomeAmbiente: a.nomeAmbiente,
            largura: parseFloat(a.largura),
            altura: parseFloat(a.altura),
            modeloCortina: a.modeloCortina,
            tipoAbertura: a.tipoAbertura,
            tecidoId: a.tecidoId,
            tecido: { id: a.tecidoId, larguraMaxima: a.tecidoLargura, valorMetro: a.tecidoValor },
            blackoutId: a.blackoutAtivo && a.blackoutId ? a.blackoutId : undefined,
            blackout: a.blackoutAtivo && a.blackoutId
              ? { id: a.blackoutId, larguraMaxima: a.blackoutLargura, valorMetro: a.blackoutValor }
              : null,
            bainhaDesejada: a.bainhaDesejada ? parseFloat(a.bainhaDesejada) : null,
            instalacao: a.instalacao,
            trilhoAcessoriosValor: a.trilhoAcessoriosValor ? parseFloat(a.trilhoAcessoriosValor) : null,
            outrosValor: a.outrosValor ? parseFloat(a.outrosValor) : null,
            observacoes: a.observacoes || null,
          })),
        }

        const res = await fetch('/api/orcamentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error('Erro ao salvar orçamento')
        const data = await res.json()
        setResultado(data)
      } catch (e) {
        setErro('Erro ao salvar o orçamento. Tente novamente.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    salvar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function adicionarAmbiente() {
    const novos = [...ambientes, { ...ambienteVazio, nomeAmbiente: `Ambiente ${ambientes.length + 1}` }]
    setAmbientes(novos)
    setAmbienteAtual(novos.length - 1)
    setEtapa(3)
  }

  function whatsapp() {
    if (!resultado) return
    const nome = cliente?.nome ?? 'Cliente'
    const total = fmt(resultado.resultado.totalPrecoFinalVenda)
    const resumo = resultado.resultado.ambientes.map(a => `• ${a.nomeAmbiente}: ${fmt(a.precoFinalVenda)}`).join('\n')
    const msg = encodeURIComponent(`Olá ${nome}! Segue o orçamento Casa Estampa Interiores:\n\n${resumo}\n\n*Total: ${total}*\n\nOrçamento nº ${resultado.orcamento.numero}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={32} className="animate-spin text-gold-primary" />
        <p className="text-sm text-text-muted">Calculando e salvando orçamento...</p>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="card-base p-8 text-center space-y-4">
        <p className="text-red-500 font-medium">{erro}</p>
        <button onClick={() => setEtapa(4)} className="text-sm text-gold-primary hover:underline">Voltar para revisão</button>
      </div>
    )
  }

  if (!resultado) return null

  const { orcamento, resultado: res } = resultado

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header sucesso */}
      <div className="card-base p-6 text-center space-y-2">
        <CheckCircle size={48} className="text-gold-primary mx-auto" />
        <h3 className="text-xl font-semibold text-text-primary">Orçamento Calculado</h3>
        <span className="inline-block px-3 py-1 bg-gold-primary/10 text-gold-dark text-sm font-semibold rounded-full">
          Orçamento #{orcamento.numero}
        </span>
        {cliente && <p className="text-sm text-text-muted">{cliente.nome}</p>}
      </div>

      {/* Cards por ambiente */}
      {res.ambientes.map((a, i) => (
        <div key={i} className="card-base p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-text-primary">{a.nomeAmbiente || `Ambiente ${i + 1}`}</p>
            <p className="text-2xl font-extrabold text-text-primary">{fmt(a.precoFinalVenda)}</p>
          </div>
          <div className="flex gap-4 text-sm text-text-secondary">
            <span>Tecido: <strong className="text-text-primary">{a.quantidadeTecido.toFixed(2)}m</strong></span>
            {a.quantidadeBlackout && <span>Blackout: <strong className="text-text-primary">{a.quantidadeBlackout.toFixed(2)}m</strong></span>}
          </div>
        </div>
      ))}

      {/* Total */}
      <div className="p-6 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #FFFBF2, #FFF8EC)', border: '1px solid #E8C97A' }}>
        <p className="text-[11px] font-semibold text-gold-dark uppercase tracking-widest mb-1">Valor Total</p>
        <p className="text-5xl font-extrabold text-text-primary">{fmt(res.totalPrecoFinalVenda)}</p>
        <p className="text-xs text-text-muted mt-2">em até 10x sem juros</p>
      </div>

      {/* Botões primários */}
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-gold flex items-center justify-center gap-2 py-3 rounded-[10px] text-sm font-semibold">
          <FileDown size={16} />
          Gerar PDF
        </button>
        <button
          onClick={whatsapp}
          className="flex items-center justify-center gap-2 py-3 rounded-[10px] text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#25D366' }}
        >
          <MessageCircle size={16} />
          Enviar por WhatsApp
        </button>
      </div>

      {/* Botões secundários */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={adicionarAmbiente}
          className="flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-semibold border border-gold-primary text-gold-primary hover:bg-gold-primary/5 transition-colors"
        >
          <Plus size={15} />
          Adicionar ambiente
        </button>
        <button
          onClick={resetOrcamento}
          className="flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-semibold border border-brand-border text-text-secondary hover:bg-brand-input transition-colors"
        >
          <Save size={15} />
          Novo orçamento
        </button>
      </div>

      {/* Painel admin */}
      {isAdmin && res.totalCusto !== undefined && (
        <div className="rounded-xl overflow-hidden border border-brand-border">
          <button
            onClick={() => setAdminExpanded(!adminExpanded)}
            className="w-full flex items-center justify-between px-5 py-3 bg-[#FFFBF2] border-l-[3px] border-l-gold-primary"
          >
            <span className="text-[11px] font-semibold text-gold-primary uppercase tracking-wider">Detalhes financeiros (Admin)</span>
            {adminExpanded ? <ChevronUp size={16} className="text-gold-primary" /> : <ChevronDown size={16} className="text-gold-primary" />}
          </button>

          {adminExpanded && (
            <div className="p-5 space-y-4 bg-[#FFFBF2]">
              {(res.ambientes as ResultadoAdminAmbiente[]).map((a, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-xs font-semibold text-text-primary">{a.nomeAmbiente || `Ambiente ${i + 1}`}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-text-muted">Custo total: <strong className="text-text-primary">{fmt(a.custoTotal)}</strong></span>
                    <span className="text-text-muted">Markup ({a.markup}%): <strong className="text-text-primary">{fmt(a.precoComMarkup)}</strong></span>
                    <span className="text-text-muted">RT: <strong className="text-text-primary">{fmt(a.valorRt)}</strong></span>
                    <span className="text-text-muted">Comissão: <strong className="text-text-primary">{fmt(a.valorComissao)}</strong></span>
                    <span className="text-text-muted">Margem: <strong className="text-green-600">{fmt(a.margem)}</strong></span>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-brand-border grid grid-cols-2 gap-2 text-xs">
                <span className="text-text-muted">Custo total geral: <strong className="text-text-primary">{fmt(res.totalCusto!)}</strong></span>
                <span className="text-text-muted">Comissão total: <strong className="text-text-primary">{fmt(res.totalComissao!)}</strong></span>
                <span className="text-text-muted">RT total: <strong className="text-text-primary">{fmt(res.totalRt!)}</strong></span>
                <span className="text-text-muted">Margem total: <strong className="text-green-600">{fmt(res.totalMargem!)}</strong></span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
