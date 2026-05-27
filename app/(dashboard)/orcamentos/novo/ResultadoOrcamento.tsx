'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, FileDown, MessageCircle, Plus, Save, ChevronDown, ChevronUp, Loader2, X, CreditCard, Banknote } from 'lucide-react'

const TAXAS_CARTAO = [
  { parcelas: 1, taxa: 3.15 },
  { parcelas: 2, taxa: 5.39 },
  { parcelas: 3, taxa: 6.12 },
  { parcelas: 4, taxa: 6.85 },
  { parcelas: 5, taxa: 7.57 },
  { parcelas: 6, taxa: 8.28 },
  { parcelas: 7, taxa: 8.99 },
  { parcelas: 8, taxa: 9.69 },
  { parcelas: 9, taxa: 10.38 },
  { parcelas: 10, taxa: 11.06 },
]
import { useOrcamento, ambienteVazio } from '@/context/OrcamentoContext'
import { useSession } from 'next-auth/react'

type ResultadoAmbientePublico = {
  nomeAmbiente: string
  quantidadeTecido: number
  quantidadeBlackout: number | null
  precisaTecidoExtra: boolean
  bainhaDisponivel: number
  bainhaAlerta: string | null
  precoFinalVenda: number
  metrosQuadrados?: number
  quantidadeRolos?: number
  valorRt?: number
  valorComissao?: number
}

type ResultadoAdminAmbiente = ResultadoAmbientePublico & {
  custoTecido: number
  custoBlackout: number
  custoConfeccao: number
  custoInstalacao: number
  custoTotal: number
  precoComMarkup: number
  valorRt: number
  valorComissao: number
  margem: number
  markup: number
}

type ResultadoAPI = {
  orcamento: { id: string; numero: number; token?: string }
  resultado: {
    ambientes: ResultadoAmbientePublico[] | ResultadoAdminAmbiente[]
    totalPrecoFinalVenda: number
    totalCusto?: number
    totalComissao?: number
    totalRt?: number
    totalMargem?: number
    comissaoVendedor?: number | null
    clienteTemArquiteto?: boolean
  }
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
      {msg}
      <button onClick={onClose}><X size={15} /></button>
    </div>
  )
}

export default function ResultadoOrcamento() {
  const { data: session } = useSession()
  const {
    cliente,
    produto,
    ambientes,
    ambientesPapel,
    setAmbientes,
    setAmbienteAtual,
    setEtapa,
    resetOrcamento,
    orcamentoId,
    modoEdicao,
    orcamentoNumero,
    orcamentoToken,
    setOrcamentoId,
    setOrcamentoNumero,
    setOrcamentoToken,
  } = useOrcamento()
  const [resultado, setResultado] = useState<ResultadoAPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [adminExpanded, setAdminExpanded] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [pdfMostrarMetragem, setPdfMostrarMetragem] = useState(true)
  const [pdfMostrarRolos, setPdfMostrarRolos] = useState(true)
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    async function salvar() {
      try {
        const payload: Record<string, unknown> = {
          clienteId: cliente?.id ?? undefined,
          produto,
        }

        if (produto === 'papel_parede') {
          payload.ambientesPapel = ambientesPapel.map(a => ({
            nomeAmbiente: a.nomeAmbiente,
            papelId: a.papelId,
            referenciaDigitada: a.papelReferencia || null,
            medicoes: a.medicoes
              .filter(m => parseFloat(m.largura) > 0 && parseFloat(m.altura) > 0)
              .map(m => ({ largura: parseFloat(m.largura), altura: parseFloat(m.altura), m2: parseFloat(m.largura) * parseFloat(m.altura) })),
            observacoes: a.observacoes || null,
          }))
          payload.ambientes = []
        } else {
          payload.ambientes = ambientes.map(a => ({
            nomeAmbiente: a.nomeAmbiente,
            largura: parseFloat(a.largura),
            altura: parseFloat(a.altura),
            modeloCortina: a.modeloCortina,
            tipoAbertura: a.tipoAbertura,
            tipoAberturaBlackout: a.blackoutAtivo ? a.tipoAberturaBlackout : null,
            trilhoTipo: a.trilhoTipo,
            tecidoId: a.tecidoId,
            tecido: { id: a.tecidoId, larguraMaxima: a.tecidoLargura, valorMetro: a.tecidoValor },
            blackoutId: a.blackoutAtivo && a.blackoutId ? a.blackoutId : undefined,
            blackout: a.blackoutAtivo && a.blackoutId
              ? { id: a.blackoutId, larguraMaxima: a.blackoutLargura, valorMetro: a.blackoutValor }
              : null,
            bainhaDesejada: a.bainhaDesejada ? parseFloat(a.bainhaDesejada) : 0.2,
            tecidoExtra: a.tecidoExtra,
            blackoutExtra: a.blackoutExtra,
            instalacao: a.instalacao,
            instaladorId: a.instaladorId || null,
            trilhoVaraoId: a.trilhoId || null,
            trilhoNome: a.trilhoNome || null,
            trilhoValorUnitario: a.trilhoValorUnitario || null,
            outrosValor: a.outrosValor ? parseFloat(a.outrosValor) : null,
            observacoes: a.observacoes || null,
          }))
          payload.ambientesPapel = []
        }

        const endpoint = modoEdicao && orcamentoId ? `/api/orcamentos/${orcamentoId}` : '/api/orcamentos'
        const method = modoEdicao && orcamentoId ? 'PUT' : 'POST'

        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error || 'Erro ao salvar orçamento')
        }

        const data = await res.json()
        setResultado(data)
        setOrcamentoId(data.orcamento.id)
        setOrcamentoNumero(data.orcamento.numero)
        setOrcamentoToken(data.orcamento.token ?? null)
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao salvar o orçamento. Tente novamente.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    salvar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function gerarPDF() {
    if (!resultado) return
    setPdfLoading(true)
    try {
      const params = new URLSearchParams()
      if (produto === 'papel_parede') {
        params.set('papelMetragem', pdfMostrarMetragem ? '1' : '0')
        params.set('papelRolos', pdfMostrarRolos ? '1' : '0')
      }
      const qs = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/orcamentos/${resultado.orcamento.id}/pdf${qs}`)
      if (!res.ok) throw new Error('Erro ao gerar PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Casa-Estampa-Orcamento-${String(resultado.orcamento.numero).padStart(4, '0')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setToast('Erro ao gerar o PDF. Tente novamente.')
    } finally {
      setPdfLoading(false)
    }
  }

  function whatsapp() {
    if (!resultado) return
    const nome = cliente?.nome ?? 'Cliente'
    const total = fmt(resultado.resultado.totalPrecoFinalVenda)
    const resumo = resultado.resultado.ambientes
      .map(a => `• ${a.nomeAmbiente}: ${fmt(a.precoFinalVenda)}`)
      .join('\n')
    const vendedor = session?.user?.name ?? 'Equipe Casa Estampa'
    const linkPublico = tokenExibicao
      ? `\n\nVisualize seu orçamento: ${window.location.origin}/orcamento/${tokenExibicao}`
      : ''

    const msg = encodeURIComponent(
      `Olá, ${nome}! 👋\n\nSegue o orçamento da *Casa Estampa Interiores*:\n\n${resumo}\n\n*Total: ${total}*\nem até 10x sem juros${linkPublico}\n\nQualquer dúvida estou à disposição!\n${vendedor}`
    )

    const telefone = cliente?.telefone?.replace(/\D/g, '') ?? ''
    const numero = telefone.length >= 10 ? `55${telefone}` : ''
    window.open(`https://wa.me/${numero}?text=${msg}`, '_blank')
  }

  function adicionarAmbiente() {
    const novos = [...ambientes, { ...ambienteVazio, nomeAmbiente: `Ambiente ${ambientes.length + 1}` }]
    setAmbientes(novos)
    setAmbienteAtual(novos.length - 1)
    setEtapa(3)
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
  const numeroExibicao = orcamentoNumero ?? orcamento.numero
  const tokenExibicao = orcamentoToken ?? orcamento.token

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}

      {/* Header sucesso */}
      <div className="card-base p-6 text-center space-y-2">
        <CheckCircle size={48} className="text-gold-primary mx-auto" />
        <h3 className="text-xl font-semibold text-text-primary">Orçamento Calculado</h3>
        <span className="inline-block px-3 py-1 bg-gold-primary/10 text-gold-dark text-sm font-semibold rounded-full">
          Orçamento #{String(numeroExibicao).padStart(4, '0')}
        </span>
        {cliente && <p className="text-sm text-text-muted">{cliente.nome}</p>}
      </div>

      {/* Cards por ambiente */}
      {res.ambientes.map((a, i) => (
        <div key={i} className="card-base p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-text-primary">{a.nomeAmbiente || `Ambiente ${i + 1}`}</p>
            {produto !== 'papel_parede' && (
              <p className="text-2xl font-extrabold text-text-primary">{fmt(a.precoFinalVenda)}</p>
            )}
          </div>
          <div className="flex gap-4 text-sm text-text-secondary">
            {produto === 'papel_parede' ? (
              <>
                <span>Área: <strong className="text-text-primary">{((a as Record<string, unknown>).metrosQuadrados as number)?.toFixed(2) ?? '—'} m²</strong></span>
                <span>Rolos: <strong className="text-text-primary">{(a as Record<string, unknown>).quantidadeRolos ?? '—'}</strong></span>
              </>
            ) : (
              <>
                <span>Tecido: <strong className="text-text-primary">{a.quantidadeTecido.toFixed(2)}m</strong></span>
                {a.quantidadeBlackout && (
                  <span>Blackout: <strong className="text-text-primary">{a.quantidadeBlackout.toFixed(2)}m</strong></span>
                )}
              </>
            )}
          </div>
        </div>
      ))}

      {/* Total */}
      <div className="p-6 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #FFFBF2, #FFF8EC)', border: '1px solid #E8C97A' }}>
        <p className="text-[11px] font-semibold text-gold-dark uppercase tracking-widest mb-1">Valor do Orçamento</p>
        <p className="text-5xl font-extrabold text-text-primary">{fmt(res.totalPrecoFinalVenda)}</p>
        <p className="text-sm font-medium text-text-secondary mt-1">à vista</p>
        <p className="text-xs text-text-muted mt-2">ou 10x sem juros de {fmt(res.totalPrecoFinalVenda / 10)}</p>
      </div>

      {/* Opções do PDF para papel de parede */}
      {produto === 'papel_parede' && (
        <div className="card-base p-4 space-y-2">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Opções do PDF</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={pdfMostrarMetragem} onChange={e => setPdfMostrarMetragem(e.target.checked)} className="w-4 h-4 rounded border-brand-border text-gold-primary focus:ring-gold-primary" />
            <span className="text-sm text-text-primary">Incluir metragem</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={pdfMostrarRolos} onChange={e => setPdfMostrarRolos(e.target.checked)} className="w-4 h-4 rounded border-brand-border text-gold-primary focus:ring-gold-primary" />
            <span className="text-sm text-text-primary">Incluir quantidade de rolos</span>
          </label>
        </div>
      )}

      {/* Botões primários */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={gerarPDF}
          disabled={pdfLoading}
          className="btn-gold flex items-center justify-center gap-2 py-3 rounded-[10px] text-sm font-semibold disabled:opacity-70"
        >
          {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          {pdfLoading ? 'Gerando...' : 'Gerar PDF'}
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

      {/* Formas de pagamento */}
      <div className="card-base overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-brand-border bg-brand-bg">
          <CreditCard size={15} className="text-gold-primary" />
          <span className="text-sm font-semibold text-text-primary">Formas de Pagamento</span>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between py-2.5 px-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Banknote size={16} className="text-green-600" />
              <span className="text-sm font-semibold text-green-700">À vista (Pix / Dinheiro)</span>
            </div>
            <span className="text-lg font-extrabold text-green-700">{fmt(res.totalPrecoFinalVenda)}</span>
          </div>
          <div className="space-y-1">
            {TAXAS_CARTAO.map(({ parcelas, taxa }) => {
              const total = res.totalPrecoFinalVenda * (1 + taxa / 100)
              const parcela = total / parcelas
              return (
                <div key={parcelas} className="flex items-center justify-between py-2 px-4 rounded-lg hover:bg-brand-bg transition-colors">
                  <span className="text-sm text-text-secondary">{parcelas}x no crédito <span className="text-[11px] text-text-muted">({taxa}%)</span></span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-text-primary">{fmt(parcela)}/mês</span>
                    <span className="text-[11px] text-text-muted ml-2">total {fmt(total)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
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

      {/* Painel admin — detalhes financeiros */}
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
                    <span className="text-text-muted">Valor do tecido: <strong className="text-text-primary">{fmt(a.custoTecido + (a.custoBlackout || 0))}</strong></span>
                    <span className="text-text-muted">Valor da confecção: <strong className="text-text-primary">{fmt(a.custoConfeccao)}</strong></span>
                    <span className="text-text-muted">Valor do trilho: <strong className="text-text-primary">{fmt(a.custoTotal - a.custoTecido - a.custoBlackout - a.custoConfeccao - a.custoInstalacao)}</strong></span>
                    <span className="text-text-muted">Valor da instalação: <strong className="text-text-primary">{fmt(a.custoInstalacao)}</strong></span>
                    <span className="text-text-muted">Custo total: <strong className="text-text-primary">{fmt(a.custoTotal)}</strong></span>
                    <span className="text-text-muted">Markup ({a.markup}%): <strong className="text-text-primary">{fmt(a.precoComMarkup)}</strong></span>
                    {res.clienteTemArquiteto && (
                      <span className="text-text-muted">RT: <strong className="text-text-primary">{fmt(a.valorRt)}</strong></span>
                    )}
                    <span className="text-text-muted">Comissão{res.comissaoVendedor ? ` (${res.comissaoVendedor}%)` : ''}: <strong className="text-text-primary">{fmt(a.valorComissao)}</strong></span>
                    <span className="text-text-muted">Margem (à vista): <strong className="text-green-600">{fmt(a.margem)}</strong></span>
                    <span className="text-text-muted">Margem (10x cartão): <strong className="text-green-600">{fmt(a.margem - a.precoFinalVenda * 0.1106)}</strong></span>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-brand-border grid grid-cols-2 gap-2 text-xs">
                <span className="text-text-muted">Custo total geral: <strong className="text-text-primary">{fmt(res.totalCusto!)}</strong></span>
                <span className="text-text-muted">Comissão total: <strong className="text-text-primary">{fmt(res.totalComissao!)}</strong></span>
                {res.clienteTemArquiteto && (
                  <span className="text-text-muted">RT total: <strong className="text-text-primary">{fmt(res.totalRt!)}</strong></span>
                )}
                <span className="text-text-muted">Margem total (à vista): <strong className="text-green-600">{fmt(res.totalMargem!)}</strong></span>
                <span className="text-text-muted">Margem total (10x cartão): <strong className="text-green-600">{fmt(res.totalMargem! - res.totalPrecoFinalVenda * 0.1106)}</strong></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Painel vendedor — comissão */}
      {!isAdmin && res.totalComissao !== undefined && res.totalComissao > 0 && (
        <div className="card-base p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Sua comissão neste orçamento</span>
            <span className="text-lg font-bold text-gold-primary">{fmt(res.totalComissao)}</span>
          </div>
          {res.clienteTemArquiteto && res.totalRt !== undefined && res.totalRt > 0 && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-text-secondary">RT (arquiteto)</span>
              <span className="text-sm font-medium text-text-primary">{fmt(res.totalRt)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
