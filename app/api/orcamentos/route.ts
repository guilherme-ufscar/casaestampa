import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calcularOrcamento, AmbienteInput, Configuracoes } from '@/lib/calculoCortina'
import { gerarToken, tokenExpiracao } from '@/lib/token'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const where = session.user.role === 'VENDEDOR'
    ? { vendedorId: session.user.id }
    : {}

  const orcamentos = await prisma.orcamento.findMany({
    where,
    include: {
      cliente: { select: { nome: true } },
      vendedor: { select: { nome: true } },
      ambientes: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orcamentos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
  const body = await req.json()
  const { clienteId, ambientes } = body as {
    clienteId?: string
    ambientes: (AmbienteInput & {
      tecidoId: string
      blackoutId?: string
      trilhoTipo?: 'trilho_suico' | 'varao'
      trilhoVaraoId?: string
      trilhoNome?: string
      observacoes?: string
      bainhaDesejada?: number | null
      tipoAberturaBlackout?: 'INTEIRA' | 'CENTRAL' | null
      blackoutExtra?: boolean
    })[]
  }

  if (!ambientes?.length) {
    return NextResponse.json({ error: 'Nenhum ambiente informado' }, { status: 400 })
  }

  const configsRaw = await prisma.configuracaoCalculo.findMany()
  const configMap: Record<string, string> = {}
  for (const c of configsRaw) configMap[c.chave] = c.valor

  const configs: Configuracoes = {
    markup_padrao: parseFloat(configMap.markup_padrao ?? '40'),
    comissao_padrao: parseFloat(configMap.comissao_padrao ?? '8'),
    rt_padrao: parseFloat(configMap.rt_padrao ?? '5'),
    confeccao_prega_macho: parseFloat(configMap.confeccao_prega_macho ?? '27'),
    confeccao_prega_femea: parseFloat(configMap.confeccao_prega_femea ?? '27'),
    confeccao_prega_americana: parseFloat(configMap.confeccao_prega_americana ?? '30'),
    confeccao_prega_franzida: parseFloat(configMap.confeccao_prega_franzida ?? '27'),
    confeccao_prega_reta: parseFloat(configMap.confeccao_prega_reta ?? '24'),
    confeccao_wave: parseFloat(configMap.confeccao_wave ?? '38'),
    confeccao_soft_wave: parseFloat(configMap.confeccao_soft_wave ?? '30'),
    confeccao_varao: parseFloat(configMap.confeccao_varao ?? '39'),
    instalacao_valor_m2: parseFloat(configMap.instalacao_valor_m2 ?? '35'),
    fator_prega_macho: parseFloat(configMap.fator_prega_macho ?? '3'),
    fator_prega_femea: parseFloat(configMap.fator_prega_femea ?? '2.5'),
    fator_prega_americana: parseFloat(configMap.fator_prega_americana ?? '2.5'),
    fator_prega_franzida: parseFloat(configMap.fator_prega_franzida ?? '3'),
    fator_prega_reta: parseFloat(configMap.fator_prega_reta ?? '1'),
    fator_wave: parseFloat(configMap.fator_wave ?? '2'),
    fator_soft_wave: parseFloat(configMap.fator_soft_wave ?? '2'),
    fator_varao: parseFloat(configMap.fator_varao ?? '1.5'),
  }

  const resultado = calcularOrcamento(ambientes, configs)
  const token = gerarToken()
  const tokenExpiresAt = tokenExpiracao()

  const orcamento = await prisma.orcamento.create({
    data: {
      clienteId: clienteId || null,
      vendedorId: session.user.id,
      status: 'orcamento_enviado',
      precoFinalTotal: resultado.totalPrecoFinalVenda,
      token,
      tokenExpiresAt,
      ambientes: {
        create: ambientes.map((a, i) => {
          const r = resultado.ambientes[i]
          const comprimentoTrilho = a.trilhoValorUnitario
            ? Math.ceil(a.largura * 2) / 2
            : null
          return {
            nomeAmbiente: a.nomeAmbiente,
            largura: a.largura,
            altura: a.altura,
            modeloCortina: a.modeloCortina,
            tipoAbertura: a.tipoAbertura,
            trilhoTipo: a.trilhoTipo ?? 'trilho_suico',
            tecidoId: a.tecidoId,
            blackoutId: a.blackoutId ?? null,
            trilhoVaraoId: a.trilhoVaraoId ?? null,
            bainhaDesejada: a.bainhaDesejada ?? 0.2,
            tecidoExtra: a.tecidoExtra,
            blackoutExtra: a.blackoutExtra ?? false,
            tipoAberturaBlackout: a.tipoAberturaBlackout ?? null,
            instalacao: a.instalacao,
            instaladorId: (a as { instaladorId?: string }).instaladorId ?? null,
            trilhoAcessoriosValor: a.trilhoValorUnitario && comprimentoTrilho
              ? comprimentoTrilho * a.trilhoValorUnitario
              : null,
            outrosValor: a.outrosValor ?? null,
            observacoes: (a as { observacoes?: string }).observacoes ?? null,
            quantidadeTecido: r.quantidadeTecido,
            quantidadeBlackout: r.quantidadeBlackout ?? null,
            custoConfeccao: r.custoConfeccao,
            custoInstalacao: r.custoInstalacao,
            custoTotal: r.custoTotal,
            precoFinalVenda: r.precoFinalVenda,
          }
        }),
      },
    },
    include: { ambientes: true },
  })

  await prisma.logHistorico.create({
    data: {
      orcamentoId: orcamento.id,
      usuarioId: session.user.id,
      acao: 'orcamento_criado',
      detalhes: { totalAmbientes: ambientes.length, precoFinalTotal: resultado.totalPrecoFinalVenda },
    },
  })

  const isAdmin = session.user.role === 'ADMIN'

  return NextResponse.json({
    orcamento,
    resultado: isAdmin ? resultado : {
      ambientes: resultado.ambientes.map(a => ({
        nomeAmbiente: a.nomeAmbiente,
        quantidadeTecido: a.quantidadeTecido,
        quantidadeBlackout: a.quantidadeBlackout,
        precisaTecidoExtra: a.precisaTecidoExtra,
        bainhaDisponivel: a.bainhaDisponivel,
        bainhaAlerta: a.bainhaAlerta,
        precoFinalVenda: a.precoFinalVenda,
      })),
      totalPrecoFinalVenda: resultado.totalPrecoFinalVenda,
    },
  }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/orcamentos] erro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
