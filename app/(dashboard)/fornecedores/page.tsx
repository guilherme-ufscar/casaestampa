'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Package, Scissors, Wrench, ChevronDown, ChevronUp, Search, Wallet } from 'lucide-react'

type Ambiente = {
  id: string
  nomeAmbiente: string
  largura: number
  altura: number
  modeloCortina: string
  tipoAbertura: string
  tipoAberturaBlackout: string
  trilhoTipo: string
  bainhaDesejada: number
  tecidoExtra: boolean
  blackoutExtra: boolean
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
  instaladorId: string | null
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
  whatsapp: { deccor: string; venetillo: string; rioflex: string; costureira_cici: string; encerramento: string }
}

type GrupoFinanceiro = {
  chave: string
  nome: string
  valorTotal: number
  pedidos: number
  ambientes: number
}

type ResponseData = {
  pedidos: Pedido[]
  financeiro: {
    totalFornecedores: number
    totalInstalacao: number
    totalGeral: number
    grupos: GrupoFinanceiro[]
  }
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
      <span className="text-text-muted min-w-28 shrink-0">{label}:</span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  )
}

function mensagemDeccorPedido(pedido: Pedido, encerramento: string) {
  const linhas = pedido.ambientes.flatMap(a => {
    const itens = [`${a.quantidadeTecido.toFixed(2)} metros de tecido ${a.tecidoNome}`]
    if (a.blackoutNome && a.quantidadeBlackout) itens.push(`${a.quantidadeBlackout.toFixed(2)} metros de tecido ${a.blackoutNome}`)
    return itens
  })
  return `Bom dia\nGostaria de fazer um pedido:\n\n${linhas.join('\n')}\n\n${encerramento}`
}

function mensagemDeccorConsolidada(pedidos: Pedido[], encerramento: string) {
  const itens = new Map<string, number>()

  for (const pedido of pedidos) {
    for (const ambiente of pedido.ambientes) {
      itens.set(ambiente.tecidoNome, (itens.get(ambiente.tecidoNome) ?? 0) + ambiente.quantidadeTecido)
      if (ambiente.blackoutNome && ambiente.quantidadeBlackout) {
        itens.set(ambiente.blackoutNome, (itens.get(ambiente.blackoutNome) ?? 0) + ambiente.quantidadeBlackout)
      }
    }
  }

  const linhas = Array.from(itens.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([nome, quantidade]) => `${quantidade.toFixed(2)} metros de tecido ${nome}`)

  return `Bom dia\nGostaria de fazer um pedido:\n\n${linhas.join('\n')}\n\n${encerramento}`
}

function mensagemCiciPedido(pedido: Pedido, encerramento: string) {
  return `Bom dia Cici\nQueria fazer um pedido:\n\n${pedido.ambientes.map(a => {
    const linhas = [
      `Cliente ${pedido.cliente?.nome ?? '—'}`,
      a.nomeAmbiente,
      `Cortina ${a.trilhoTipo === 'varao' ? 'varão' : 'trilho suíço'}`,
      `${a.largura.toFixed(2)} x ${a.altura.toFixed(2)}`,
      MODELO_LABELS[a.modeloCortina] ?? a.modeloCortina,
      `Bainha ${a.bainhaDesejada.toFixed(2)}`,
      `Abertura tecido ${a.tipoAbertura === 'INTEIRA' ? 'inteira' : 'central'}`,
      a.blackoutNome ? `Com ${a.blackoutNome}` : 'Sem blackout',
      a.blackoutNome ? `Abertura blackout ${a.tipoAberturaBlackout === 'INTEIRA' ? 'inteira' : 'central'}` : '',
    ]
    if (a.tecidoExtra) linhas.push('Com tecido extra')
    if (a.blackoutExtra) linhas.push('Com blackout extra')
    if (a.observacoes) linhas.push(`Obs: ${a.observacoes}`)
    return linhas.filter(Boolean).join('\n')
  }).join('\n\n')}\n\n${encerramento}`
}

function mensagemTrilhoPedido(pedido: Pedido, fornecedor: 'rioflex' | 'venetillo', encerramento: string) {
  const linhas = pedido.ambientes
    .filter(a => a.fornecedorTrilho === fornecedor)
    .map(a => `1 ${a.trilhoNome?.replace(/\s+\((Rio Flex|Venetillo)\)/, '').toLowerCase() ?? 'trilho'} de ${a.comprimentoTrilho?.toFixed(2) ?? '0.00'}`)
  return `Bom dia\nGostaria de fazer um pedido:\n\n${linhas.join('\n')}\n\n${encerramento}`
}

function mensagemTrilhoConsolidada(pedidos: Pedido[], fornecedor: 'rioflex' | 'venetillo', encerramento: string) {
  const linhas = pedidos
    .flatMap(pedido => pedido.ambientes.filter(a => a.fornecedorTrilho === fornecedor))
    .map(a => `1 ${a.trilhoNome?.replace(/\s+\((Rio Flex|Venetillo)\)/, '').toLowerCase() ?? 'trilho'} de ${a.comprimentoTrilho?.toFixed(2) ?? '0.00'}`)

  return `Bom dia\nGostaria de fazer um pedido:\n\n${linhas.join('\n')}\n\n${encerramento}`
}

function mensagemCiciConsolidada(pedidos: Pedido[], encerramento: string) {
  return `Bom dia Cici\nQueria fazer um pedido:\n\n${pedidos.map(pedido => (
    pedido.ambientes.map(a => {
      const linhas = [
        `Cliente ${pedido.cliente?.nome ?? '—'}`,
        a.nomeAmbiente,
        `Cortina ${a.trilhoTipo === 'varao' ? 'varão' : 'trilho suíço'}`,
        `${a.largura.toFixed(2)} x ${a.altura.toFixed(2)}`,
        MODELO_LABELS[a.modeloCortina] ?? a.modeloCortina,
        `Bainha ${a.bainhaDesejada.toFixed(2)}`,
        `Abertura tecido ${a.tipoAbertura === 'INTEIRA' ? 'inteira' : 'central'}`,
        a.blackoutNome ? `Com ${a.blackoutNome}` : 'Sem blackout',
        a.blackoutNome ? `Abertura blackout ${a.tipoAberturaBlackout === 'INTEIRA' ? 'inteira' : 'central'}` : '',
      ]
      if (a.tecidoExtra) linhas.push('Com tecido extra')
      if (a.blackoutExtra) linhas.push('Com blackout extra')
      if (a.observacoes) linhas.push(`Obs: ${a.observacoes}`)
      return linhas.filter(Boolean).join('\n')
    }).join('\n\n')
  )).join('\n\n')}

${encerramento}`
}

export default function FornecedoresPage() {
  const [data, setData] = useState<ResponseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/fornecedores').then(r => r.json()).then((resp: ResponseData) => {
      setData(resp)
      setExpandidos(new Set(resp.pedidos.map((p: Pedido) => p.id)))
      setLoading(false)
    })
  }, [])

  function toggleExpandido(id: string) {
    setExpandidos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pedidos = data?.pedidos ?? []
  const pedidosFiltrados = pedidos.filter(p =>
    !q || p.cliente?.nome.toLowerCase().includes(q.toLowerCase()) || String(p.numero).includes(q)
  )
  const whatsapp = pedidosFiltrados[0]?.whatsapp ?? { deccor: '', venetillo: '', rioflex: '', costureira_cici: '', encerramento: '' }
  const pedidosRioFlex = pedidosFiltrados.filter(p => p.ambientes.some(a => a.fornecedorTrilho === 'rioflex'))
  const pedidosVenetillo = pedidosFiltrados.filter(p => p.ambientes.some(a => a.fornecedorTrilho === 'venetillo'))
  const custoDeccorConsolidado = pedidosFiltrados.reduce((s, pedido) => s + pedido.ambientes.reduce((acc, a) => acc + a.custoTecido + a.custoBlackout, 0), 0)
  const custoCiciConsolidado = pedidosFiltrados.reduce((s, pedido) => s + pedido.ambientes.reduce((acc, a) => acc + a.custoConfeccao, 0), 0)
  const custoRioFlexConsolidado = pedidosRioFlex.reduce((s, pedido) => s + pedido.ambientes.filter(a => a.fornecedorTrilho === 'rioflex').reduce((acc, a) => acc + a.custoTrilho, 0), 0)
  const custoVenetilloConsolidado = pedidosVenetillo.reduce((s, pedido) => s + pedido.ambientes.filter(a => a.fornecedorTrilho === 'venetillo').reduce((acc, a) => acc + a.custoTrilho, 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Painel de Fornecedores</h2>
          <p className="text-sm text-text-muted mt-0.5">Pedidos aprovados e em produção</p>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-base p-5">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">A pagar fornecedores</p>
            <p className="text-2xl font-bold text-text-primary">{fmt(data.financeiro.totalFornecedores)}</p>
          </div>
          <div className="card-base p-5">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">A pagar instalação</p>
            <p className="text-2xl font-bold text-text-primary">{fmt(data.financeiro.totalInstalacao)}</p>
          </div>
          <div className="card-base p-5">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">Total operacional</p>
            <p className="text-2xl font-bold text-text-primary">{fmt(data.financeiro.totalGeral)}</p>
          </div>
        </div>
      )}

      {data && data.financeiro.grupos.length > 0 && (
        <div className="card-base p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-gold-primary" />
            <p className="text-sm font-semibold text-text-primary">Resumo por fornecedor / instalador</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.financeiro.grupos.map(grupo => (
              <div key={grupo.chave} className="border border-brand-border rounded-lg px-4 py-3">
                <p className="text-sm font-semibold text-text-primary">{grupo.nome}</p>
                <p className="text-lg font-bold text-gold-primary mt-1">{fmt(grupo.valorTotal)}</p>
                <p className="text-xs text-text-muted mt-1">{grupo.pedidos} pedido(s) · {grupo.ambientes} ambiente(s)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar cliente ou número..."
          className="input-base pl-9 h-10 text-sm"
        />
      </div>

      {!loading && pedidosFiltrados.length > 0 && (
        <div className="card-base p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-text-primary">Mensagens consolidadas por fornecedor</p>
            <p className="text-xs text-text-muted mt-0.5">Use para disparar um resumo único com todos os pedidos filtrados.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CardFornecedor
              titulo="Deccor — Consolidado"
              icon={<Package size={15} />}
              cor="#3B82F6"
              custo={custoDeccorConsolidado}
              telefone={whatsapp.deccor}
              msgWhatsapp={mensagemDeccorConsolidada(pedidosFiltrados, whatsapp.encerramento)}
            >
              <InfoLinha label="Pedidos" value={String(pedidosFiltrados.length)} />
              <InfoLinha label="Resumo" value="Tecidos e blackouts agrupados por nome" />
            </CardFornecedor>

            <CardFornecedor
              titulo="Costureira Cici — Consolidado"
              icon={<Scissors size={15} />}
              cor="#F59E0B"
              custo={custoCiciConsolidado}
              telefone={whatsapp.costureira_cici}
              msgWhatsapp={mensagemCiciConsolidada(pedidosFiltrados, whatsapp.encerramento)}
            >
              <InfoLinha label="Pedidos" value={String(pedidosFiltrados.length)} />
              <InfoLinha label="Resumo" value="Ambientes agrupados por cliente e pedido" />
            </CardFornecedor>

            {pedidosRioFlex.length > 0 && (
              <CardFornecedor
                titulo="Rio Flex — Consolidado"
                icon={<Wrench size={15} />}
                cor="#8B5CF6"
                custo={custoRioFlexConsolidado}
                telefone={whatsapp.rioflex}
                msgWhatsapp={mensagemTrilhoConsolidada(pedidosRioFlex, 'rioflex', whatsapp.encerramento)}
              >
                <InfoLinha label="Pedidos" value={String(pedidosRioFlex.length)} />
                <InfoLinha label="Resumo" value="Trilhos agrupados dos pedidos filtrados" />
              </CardFornecedor>
            )}

            {pedidosVenetillo.length > 0 && (
              <CardFornecedor
                titulo="Venetillo — Consolidado"
                icon={<Wrench size={15} />}
                cor="#EC4899"
                custo={custoVenetilloConsolidado}
                telefone={whatsapp.venetillo}
                msgWhatsapp={mensagemTrilhoConsolidada(pedidosVenetillo, 'venetillo', whatsapp.encerramento)}
              >
                <InfoLinha label="Pedidos" value={String(pedidosVenetillo.length)} />
                <InfoLinha label="Resumo" value="Trilhos agrupados dos pedidos filtrados" />
              </CardFornecedor>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="card-base p-12 text-center text-text-muted text-sm">Carregando...</div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="card-base p-12 text-center text-text-muted text-sm">Nenhum pedido aprovado ou em produção</div>
      ) : (
        <div className="space-y-4">
          {pedidosFiltrados.map(pedido => {
            const expandido = expandidos.has(pedido.id)
            const ambComTrilhoRioFlex = pedido.ambientes.filter(a => a.fornecedorTrilho === 'rioflex')
            const ambComTrilhoVenetillo = pedido.ambientes.filter(a => a.fornecedorTrilho === 'venetillo')
            const ambComInstalacao = pedido.ambientes.filter(a => a.instalacao)

            const custoTotalDeccor = pedido.ambientes.reduce((s, a) => s + a.custoTecido + a.custoBlackout, 0)
            const custoTotalRioFlex = ambComTrilhoRioFlex.reduce((s, a) => s + a.custoTrilho, 0)
            const custoTotalVenetillo = ambComTrilhoVenetillo.reduce((s, a) => s + a.custoTrilho, 0)
            const custoTotalCici = pedido.ambientes.reduce((s, a) => s + a.custoConfeccao, 0)

            const msgDeccor = mensagemDeccorPedido(pedido, pedido.whatsapp.encerramento)
            const msgRioFlex = mensagemTrilhoPedido(pedido, 'rioflex', pedido.whatsapp.encerramento)
            const msgVenetillo = mensagemTrilhoPedido(pedido, 'venetillo', pedido.whatsapp.encerramento)
            const msgCici = mensagemCiciPedido(pedido, pedido.whatsapp.encerramento)

            return (
              <div key={pedido.id} className="card-base overflow-hidden">
                <button
                  onClick={() => toggleExpandido(pedido.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-bg/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-base font-bold text-gold-primary">#{String(pedido.numero).padStart(4, '0')}</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-text-primary">{pedido.cliente?.nome ?? '—'}</p>
                      <p className="text-xs text-text-muted">{fmtData(pedido.createdAt)} · {pedido.vendedor.nome} · {pedido.ambientes.length} ambiente{pedido.ambientes.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {expandido ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                </button>

                {expandido && (
                  <div className="px-5 pb-5 space-y-3 border-t border-brand-border pt-4">
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
                          <InfoLinha label="Cliente" value={pedido.cliente?.nome ?? '—'} />
                          <InfoLinha label="Suporte" value={a.trilhoTipo === 'varao' ? 'Varão' : 'Trilho suíço'} />
                          <InfoLinha label="Medidas" value={`${a.largura.toFixed(2)}m × ${a.altura.toFixed(2)}m`} />
                          <InfoLinha label="Modelo" value={MODELO_LABELS[a.modeloCortina] ?? a.modeloCortina} />
                          <InfoLinha label="Tecido" value={a.tecidoNome} />
                          {a.blackoutNome && <InfoLinha label="Blackout" value={a.blackoutNome} />}
                          <InfoLinha label="Bainha" value={`${a.bainhaDesejada.toFixed(2)}m`} />
                          <InfoLinha label="Abertura tecido" value={a.tipoAbertura === 'INTEIRA' ? 'Inteira' : 'Central (2 folhas)'} />
                          {a.blackoutNome && <InfoLinha label="Abertura blackout" value={a.tipoAberturaBlackout === 'INTEIRA' ? 'Inteira' : 'Central (2 folhas)'} />}
                          {a.tecidoExtra && <InfoLinha label="Tecido extra" value="Sim" />}
                          {a.blackoutExtra && <InfoLinha label="Blackout extra" value="Sim" />}
                          {a.observacoes && <InfoLinha label="Obs" value={a.observacoes} />}
                        </div>
                      ))}
                    </CardFornecedor>

                    {ambComInstalacao.length > 0 && (
                      <div className="space-y-2">
                        {ambComInstalacao.map(a => {
                          const msgInstalador = `Bom dia\nGostaria de agendar uma instalação:\n\nCliente: ${pedido.cliente?.nome ?? '—'}\nEndereço: ${pedido.cliente?.endereco ?? '—'}\nAmbiente: ${a.nomeAmbiente}\nModelo: ${MODELO_LABELS[a.modeloCortina] ?? a.modeloCortina}\nValor da instalação: ${fmt(a.custoInstalacao)}\n\n${pedido.whatsapp.encerramento}`
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
                              <InfoLinha label="Valor" value={fmt(a.custoInstalacao)} />
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
