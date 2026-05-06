import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { MapPin, Phone, Mail, User, Home } from 'lucide-react'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function OrcamentoPublicoPage({ params }: { params: { token: string } }) {
  const orc = await prisma.orcamento.findUnique({
    where: { token: params.token },
    include: {
      cliente: true,
      vendedor: { select: { nome: true } },
      ambientes: { include: { tecido: true, blackout: true } },
    },
  })

  if (!orc) notFound()

  if (orc.tokenExpiresAt && new Date() > orc.tokenExpiresAt) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
        <div className="card-base p-8 text-center max-w-md">
          <p className="text-lg font-semibold text-text-primary mb-2">Link expirado</p>
          <p className="text-sm text-text-muted">Este orçamento não está mais disponível. Entre em contato com a Casa Estampa Interiores.</p>
        </div>
      </div>
    )
  }

  const numero = String(orc.numero).padStart(4, '0')
  const dataEmissao = new Date(orc.createdAt).toLocaleDateString('pt-BR')

  return (
    <div className="min-h-screen bg-brand-bg py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="card-base p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gold-primary tracking-wide">Casa Estampa</h1>
              <p className="text-[11px] text-text-muted tracking-widest uppercase mt-0.5">Interiores</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-text-primary">Orçamento #{numero}</p>
              <p className="text-xs text-text-muted mt-0.5">Emitido em {dataEmissao}</p>
              <p className="text-xs text-text-muted">Vendedor: {orc.vendedor.nome}</p>
            </div>
          </div>
        </div>

        {/* Cliente */}
        {orc.cliente && (
          <div className="card-base p-5">
            <p className="text-[11px] font-semibold text-gold-primary uppercase tracking-wider mb-3">Dados do Cliente</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <User size={14} className="text-text-muted shrink-0" />
                <span className="text-sm font-medium text-text-primary">{orc.cliente.nome}</span>
              </div>
              {orc.cliente.telefone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-text-muted shrink-0" />
                  <span className="text-sm text-text-secondary">{orc.cliente.telefone}</span>
                </div>
              )}
              {orc.cliente.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-text-muted shrink-0" />
                  <span className="text-sm text-text-secondary">{orc.cliente.email}</span>
                </div>
              )}
              {orc.cliente.endereco && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-text-muted shrink-0" />
                  <span className="text-sm text-text-secondary">{orc.cliente.endereco}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ambientes */}
        {orc.ambientes.map((a, i) => (
          <div key={i} className="card-base p-5">
            <div className="flex items-center gap-2 mb-4">
              <Home size={16} className="text-gold-primary" />
              <p className="text-sm font-semibold text-text-primary">{a.nomeAmbiente || `Ambiente ${i + 1}`}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-brand-border">
                <span className="text-text-secondary">Tecido</span>
                <span className="font-medium text-text-primary">{a.tecido.nome} · {Number(a.quantidadeTecido ?? 0).toFixed(2)}m</span>
              </div>
              {a.blackout && (
                <div className="flex justify-between py-2 border-b border-brand-border">
                  <span className="text-text-secondary">Blackout</span>
                  <span className="font-medium text-text-primary">{a.blackout.nome} · {Number(a.quantidadeBlackout ?? 0).toFixed(2)}m</span>
                </div>
              )}
              {a.instalacao && (
                <div className="flex justify-between py-2 border-b border-brand-border">
                  <span className="text-text-secondary">Instalação</span>
                  <span className="font-medium text-text-primary">Inclusa</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-brand-border">
              <span className="text-xs text-text-muted uppercase tracking-wider">Valor do ambiente</span>
              <span className="text-xl font-bold text-text-primary">{fmt(Number(a.precoFinalVenda ?? 0))}</span>
            </div>
          </div>
        ))}

        {/* Total */}
        <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #FFFBF2, #FFF8EC)', border: '1px solid #E8C97A' }}>
          <p className="text-[11px] font-semibold text-gold-dark uppercase tracking-widest mb-1">Valor Total</p>
          <p className="text-4xl font-extrabold text-text-primary">{fmt(Number(orc.precoFinalTotal ?? 0))}</p>
          <p className="text-xs text-text-muted mt-2">em até 10x sem juros</p>
        </div>

        {/* Rodapé */}
        <div className="text-center py-4">
          <p className="text-xs text-text-muted">Casa Estampa Interiores · casaestampa.com.br</p>
          <p className="text-xs text-text-muted mt-1">Orçamento #{numero} · válido por 30 dias</p>
        </div>
      </div>
    </div>
  )
}
