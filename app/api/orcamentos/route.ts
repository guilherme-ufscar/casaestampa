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

  const body = await req.json()
  const { clienteId, ambientes } = body as {
    clienteId?: string
    ambientes: (AmbienteInput & { tecidoId: string; blackoutId?: string; trilhoVaraoId?: string })[]
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
    confeccao_valor_metro: parseFloat(configMap.confeccao_valor_metro ?? '25'),
    instalacao_valor_fixo: parseFloat(configMap.instalacao_valor_fixo ?? '150'),
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
          return {
            nomeAmbiente: a.nomeAmbiente,
            largura: a.largura,
            altura: a.altura,
            modeloCortina: a.modeloCortina,
            tipoAbertura: a.tipoAbertura,
            trilhoTipo: 'trilho_suico',
            tecidoId: a.tecidoId,
            blackoutId: a.blackoutId ?? null,
            trilhoVaraoId: a.trilhoVaraoId ?? null,
            bainhaDesejada: a.bainhaDesejada ?? null,
            instalacao: a.instalacao,
            trilhoAcessoriosValor: a.trilhoAcessoriosValor ?? null,
            outrosValor: a.outrosValor ?? null,
            observacoes: (a as { observacoes?: string }).observacoes ?? null,
            quantidadeTecido: r.quantidadeTecido,
            quantidadeBlackout: r.quantidadeBlackout ?? null,
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
        bainhaNaoCabe: a.bainhaNaoCabe,
        bainhaAlerta: a.bainhaAlerta,
        precoFinalVenda: a.precoFinalVenda,
      })),
      totalPrecoFinalVenda: resultado.totalPrecoFinalVenda,
    },
  }, { status: 201 })
}
