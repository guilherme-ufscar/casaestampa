'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Package, Scissors, Wrench, ChevronDown, ChevronUp, Search } from 'lucide-react'

type Ambiente = {
  id: string
  nomeAmbiente: string
  largura: number
  altura: number
  modeloCortina: string
  tipoAbertura: string
  tecidoNome: string
  quantidadeTecido: number
  blackoutNome: string | null
  quantidadeBlackout: number | null
  custoTecido: number
  custoBlackout: number
  trilhoNome: string | null
  fornecedorTrilho: 'rioflex' | 'venetillo' | null
  comprimentoTrilho: number | null
  custoTrilho: number
  custoConfeccao: number
  instalacao: boolean
  instaladorNome: string | null
  instaladorTelefone: string | null
  custoInstalacao: number
  observacoes: string | null
}

type Pedido = {
  id: string
  numero: number
  status: string
  createdAt: string
  cliente: { nome: string; telefone?: string; endereco?: string } | null
  vendedor: { nome: string }
  ambientes: Ambiente[]
  whatsapp: { deccor: string; venetillo: string; rioflex: string; costureira_cici: string }
}

const MODELO_LABELS: Record<string, string> = {
  prega_macho: 'Prega Macho', prega_femea: 'Prega Fêmea', prega_americana: 'Prega Americana',
  prega_franzida: 'Prega Franzida', prega_reta: 'Prega Reta', wave: 'Wave',
  soft_wave: 'Soft Wave', varao: 'Varão',
}

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtData(d: string) { return new Date(d).toLocaleDateString('pt-BR') }

function whatsappLink(telefone: string, msg: string) {
  const num = telefone.replace(/\D/g, '')
  const numero = num.length >= 10 ? `55${num}` : num
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`
}

function CardFornecedor({ titulo, icon, cor, custo, children, telefone, msgWhatsapp }: {
  titulo: string; icon: React.ReactNode; cor: string; custo: number
  children: React.ReactNode; telefone: string; msgWhatsapp: string
}) {
  return (
    <div className="border border-brand-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border" style={{ backgroundColor: `${cor}08` }}>
        <div className="flex items-center gap-2">
          <span style={{ color: cor }}>{icon}</span>
          <span className="text-sm font-semibold text-text-primary">{titulo}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${cor}15`, color: cor }}>
            {fmt(custo)}
          </span>
        </div>
        {telefone && (
          <a
            href={whatsappLink(telefone, msgWhatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle size={13} />
            Enviar WhatsApp
          </a>
        )}
        {!telefone && (
          <span className="text-xs text-text-muted italic">Configure o número nas configurações</span>
        )}
      </div>
      <div className="px-4 py-3 space-y-1.5 bg-white">
        {children}
      </div>
    </div>
  )
}

function InfoLinha({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-text-muted min-w-24 shrink-0">{label}:</span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  )
}

export default function FornecedoresPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/fornecedores').then(r => r.json()).then(data => {
      setPedidos(data)
      // Expandir todos por padrão
      setExpandidos(new Set(data.map((p: Pedido) => p.id)))
      setLoading(false)
    })
  }, [])

  function toggleExpandido(id: string) {
    setExpandidos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const pedidosFiltrados = pedidos.filter(p =>
    !q || p.cliente?.nome.toLowerCase().includes(q.toLowerCase()) ||
    String(p.numero).includes(q)
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Painel de Fornecedores</h2>
          <p className="text-sm text-text-muted mt-0.5">Pedidos aprovados e em produção</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar cliente ou número..."
          className="input-base pl-9 h-10 text-sm"
        />
      </div>

      {loading ? (
        <div className="card-base p-12 text-center text-text-muted text-sm">Carregando...</div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="card-base p-12 text-center text-text-muted text-sm">Nenhum pedido aprovado ou em produção</div>
      ) : (
        <div className="space-y-4">
          {pedidosFiltrados.map(pedido => {
            const expandido = expandidos.has(pedido.id)

            // Agrupa ambientes por fornecedor de trilho
            const ambComTrilhoRioFlex = pedido.ambientes.filter(a => a.fornecedorTrilho === 'rioflex')
            const ambComTrilhoVenetillo = pedido.ambientes.filter(a => a.fornecedorTrilho === 'venetillo')
            const ambComInstalacao = pedido.ambientes.filter(a => a.instalacao)

            const custoTotalDeccor = pedido.ambientes.reduce((s, a) => s + a.custoTecido + a.custoBlackout, 0)
            const custoTotalRioFlex = ambComTrilhoRioFlex.reduce((s, a) => s + a.custoTrilho, 0)
            const custoTotalVenetillo = ambComTrilhoVenetillo.reduce((s, a) => s + a.custoTrilho, 0)
            const custoTotalCici = pedido.ambientes.reduce((s, a) => s + a.custoConfeccao, 0)
            const custoTotalInstalacao = ambComInstalacao.reduce((s, a) => s + a.custoInstalacao, 0)

            // Mensagens WhatsApp
            const msgDeccor = `*Pedido #${String(pedido.numero).padStart(4,'0')} — ${pedido.cliente?.nome ?? 'Cliente'}*\n\n` +
              pedido.ambientes.map(a =>
                `• ${a.nomeAmbiente}: ${a.quantidadeTecido.toFixed(2)}m ${a.tecidoNome}` +
                (a.blackoutNome ? `\n  + ${(a.quantidadeBlackout ?? 0).toFixed(2)}m ${a.blackoutNome}` : '')
              ).join('\n') +
              `\n\n*Total: ${fmt(custoTotalDeccor)}*`

            const msgRioFlex = `*Pedido #${String(pedido.numero).padStart(4,'0')} — ${pedido.cliente?.nome ?? 'Cliente'}*\n\n` +
              ambComTrilhoRioFlex.map(a =>
                `• ${a.nomeAmbiente}: ${a.comprimentoTrilho?.toFixed(2)}m ${a.trilhoNome?.replace(' (Rio Flex)', '')}`
              ).join('\n') +
              `\n\n*Total: ${fmt(custoTotalRioFlex)}*`

            const msgVenetillo = `*Pedido #${String(pedido.numero).padStart(4,'0')} — ${pedido.cliente?.nome ?? 'Cliente'}*\n\n` +
              ambComTrilhoVenetillo.map(a =>
                `• ${a.nomeAmbiente}: ${a.comprimentoTrilho?.toFixed(2)}m ${a.trilhoNome?.replace(' (Venetillo)', '')}`
              ).join('\n') +
              `\n\n*Total: ${fmt(custoTotalVenetillo)}*`

            const msgCici = `*Pedido #${String(pedido.numero).padStart(4,'0')} — ${pedido.cliente?.nome ?? 'Cliente'}*\n\n` +
              pedido.ambientes.map(a =>
                `• ${a.nomeAmbiente}\n  Modelo: ${MODELO_LABELS[a.modeloCortina] ?? a.modeloCortina}\n  Medidas: ${a.largura.toFixed(2)}m × ${a.altura.toFixed(2)}m\n  Tecido: ${a.tecidoNome}\n  Abertura: ${a.tipoAbertura === 'INTEIRA' ? 'Inteira' : 'Central (2 folhas)'}` +
                (a.observacoes ? `\n  Obs: ${a.observacoes}` : '')
              ).join('\n\n') +
              `\n\n*Total confecção: ${fmt(custoTotalCici)}*`

            return (
              <div key={pedido.id} className="card-base overflow-hidden">
                {/* Header do pedido */}
                <button
                  onClick={() => toggleExpandido(pedido.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-bg/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-base font-bold text-gold-primary">#{String(pedido.numero).padStart(4,'0')}</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-text-primary">{pedido.cliente?.nome ?? '—'}</p>
                      <p className="text-xs text-text-muted">{fmtData(pedido.createdAt)} · {pedido.vendedor.nome} · {pedido.ambientes.length} ambiente{pedido.ambientes.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {expandido ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                </button>

                {expandido && (
                  <div className="px-5 pb-5 space-y-3 border-t border-brand-border pt-4">

                    {/* Deccor */}
                    <CardFornecedor
                      titulo="Deccor — Tecidos"
                      icon={<Package size={15} />}
                      cor="#3B82F6"
                      custo={custoTotalDeccor}
                      telefone={pedido.whatsapp.deccor}
                      msgWhatsapp={msgDeccor}
                    >
                      {pedido.ambientes.map(a => (
                        <div key={a.id} className="py-1.5 border-b border-brand-border last:border-0">
                          <p className="text-xs font-semibold text-text-primary mb-1">{a.nomeAmbiente}</p>
                          <InfoLinha label="Tecido" value={`${a.quantidadeTecido.toFixed(2)}m — ${a.tecidoNome}`} />
                          {a.blackoutNome && (
                            <InfoLinha label="Blackout" value={`${(a.quantidadeBlackout ?? 0).toFixed(2)}m — ${a.blackoutNome}`} />
                          )}
                        </div>
                      ))}
                    </CardFornecedor>

                    {/* Rio Flex */}
                    {ambComTrilhoRioFlex.length > 0 && (
                      <CardFornecedor
                        titulo="Rio Flex — Trilhos"
                        icon={<Wrench size={15} />}
                        cor="#8B5CF6"
                        custo={custoTotalRioFlex}
                        telefone={pedido.whatsapp.rioflex}
                        msgWhatsapp={msgRioFlex}
                      >
                        {ambComTrilhoRioFlex.map(a => (
                          <div key={a.id} className="py-1.5 border-b border-brand-border last:border-0">
                            <p className="text-xs font-semibold text-text-primary mb-1">{a.nomeAmbiente}</p>
                            <InfoLinha label="Trilho" value={`${a.comprimentoTrilho?.toFixed(2)}m — ${a.trilhoNome?.replace(' (Rio Flex)', '')}`} />
                          </div>
                        ))}
                      </CardFornecedor>
                    )}

                    {/* Venetillo */}
                    {ambComTrilhoVenetillo.length > 0 && (
                      <CardFornecedor
                        titulo="Venetillo — Trilhos"
                        icon={<Wrench size={15} />}
                        cor="#EC4899"
                        custo={custoTotalVenetillo}
                        telefone={pedido.whatsapp.venetillo}
                        msgWhatsapp={msgVenetillo}
                      >
                        {ambComTrilhoVenetillo.map(a => (
                          <div key={a.id} className="py-1.5 border-b border-brand-border last:border-0">
                            <p className="text-xs font-semibold text-text-primary mb-1">{a.nomeAmbiente}</p>
                            <InfoLinha label="Trilho" value={`${a.comprimentoTrilho?.toFixed(2)}m — ${a.trilhoNome?.replace(' (Venetillo)', '')}`} />
                          </div>
                        ))}
                      </CardFornecedor>
                    )}

                    {/* Costureira Cici */}
                    <CardFornecedor
                      titulo="Costureira Cici — Confecção"
                      icon={<Scissors size={15} />}
                      cor="#F59E0B"
                      custo={custoTotalCici}
                      telefone={pedido.whatsapp.costureira_cici}
                      msgWhatsapp={msgCici}
                    >
                      {pedido.ambientes.map(a => (
                        <div key={a.id} className="py-1.5 border-b border-brand-border last:border-0">
                          <p className="text-xs font-semibold text-text-primary mb-1">{a.nomeAmbiente}</p>
                          <InfoLinha label="Modelo" value={MODELO_LABELS[a.modeloCortina] ?? a.modeloCortina} />
                          <InfoLinha label="Medidas" value={`${a.largura.toFixed(2)}m × ${a.altura.toFixed(2)}m`} />
                          <InfoLinha label="Tecido" value={a.tecidoNome} />
                          <InfoLinha label="Abertura" value={a.tipoAbertura === 'INTEIRA' ? 'Inteira' : 'Central (2 folhas)'} />
                          {a.observacoes && <InfoLinha label="Obs" value={a.observacoes} />}
                        </div>
                      ))}
                    </CardFornecedor>

                    {/* Instalação */}
                    {ambComInstalacao.length > 0 && (
                      <div className="space-y-2">
                        {ambComInstalacao.map(a => {
                          const msgInstalador = `*Instalação — Pedido #${String(pedido.numero).padStart(4,'0')}*\n\nCliente: ${pedido.cliente?.nome ?? '—'}\nEndereço: ${pedido.cliente?.endereco ?? '—'}\nAmbiente: ${a.nomeAmbiente}\nModelo: ${MODELO_LABELS[a.modeloCortina] ?? a.modeloCortina}\nValor: ${fmt(a.custoInstalacao)}`
                          return (
                            <CardFornecedor
                              key={a.id}
                              titulo={`Instalação — ${a.instaladorNome ?? 'Instalador não definido'}`}
                              icon={<Wrench size={15} />}
                              cor="#22C55E"
                              custo={a.custoInstalacao}
                              telefone={a.instaladorTelefone ?? ''}
                              msgWhatsapp={msgInstalador}
                            >
                              <InfoLinha label="Cliente" value={pedido.cliente?.nome ?? '—'} />
                              <InfoLinha label="Endereço" value={pedido.cliente?.endereco ?? '—'} />
                              <InfoLinha label="Ambiente" value={a.nomeAmbiente} />
                              <InfoLinha label="Modelo" value={MODELO_LABELS[a.modeloCortina] ?? a.modeloCortina} />
                            </CardFornecedor>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
