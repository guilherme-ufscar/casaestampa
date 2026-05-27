import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calcularOrcamento, AmbienteInput, Configuracoes } from '@/lib/calculoCortina'
import { calcularAmbientePapel, getFatorDimensao, ConfigsPapel } from '@/lib/calculoPapelParede'
import { gerarToken, tokenExpiracao } from '@/lib/token'

function ambienteValido(ambiente: AmbienteInput & { tecidoId?: string; blackoutId?: string; blackout?: { id: string } | null }) {
  return Boolean(
    ambiente.tecidoId &&
    Number.isFinite(ambiente.largura) &&
    ambiente.largura > 0 &&
    Number.isFinite(ambiente.altura) &&
    ambiente.altura > 0 &&
    ambiente.tecido?.id
  ) && (!ambiente.blackout || Boolean(ambiente.blackoutId || ambiente.blackout.id))
}

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
      ambientesPapel: { include: { papel: true } },
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
  const { clienteId, ambientes, ambientesPapel, produto } = body as {
    clienteId?: string
    produto?: string
    ambientes?: (AmbienteInput & {
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
    ambientesPapel?: {
      nomeAmbiente: string
      papelId: string
      referenciaDigitada?: string | null
      medicoes: { largura: number; altura: number; m2: number }[]
      observacoes?: string | null
    }[]
  }

  const configsRaw = await prisma.configuracaoCalculo.findMany()
  const configMap: Record<string, string> = {}
  for (const c of configsRaw) configMap[c.chave] = c.valor

  const token = gerarToken()
  const tokenExpiresAt = tokenExpiracao()

  // --- Papel de Parede ---
  if (produto === 'papel_parede' && ambientesPapel?.length) {
    const configsPapel: ConfigsPapel = {
      markup_padrao: parseFloat(configMap.markup_padrao ?? '40'),
      comissao_padrao: parseFloat(configMap.comissao_padrao ?? '8'),
      rt_padrao: parseFloat(configMap.rt_padrao ?? '5'),
    }

    const papeisIds = [...new Set(ambientesPapel.map(a => a.papelId))]
    const papeisDb = await prisma.papelParede.findMany({ where: { id: { in: papeisIds } } })
    const papeisMap = Object.fromEntries(papeisDb.map(p => [p.id, p]))

    const resultadosPapel = ambientesPapel.map(a => {
      const papel = papeisMap[a.papelId]
      return calcularAmbientePapel({
        nomeAmbiente: a.nomeAmbiente,
        dimensao: papel?.dimensao ?? '0.53x10',
        valorRolo: Number(papel?.valorRolo ?? 0),
        medicoes: a.medicoes,
      }, configsPapel)
    })

    const totalPrecoFinal = resultadosPapel.reduce((s, r) => s + r.precoFinalVenda, 0)

    const orcamento = await prisma.orcamento.create({
      data: {
        clienteId: clienteId || null,
        vendedorId: session.user.id,
        status: 'orcamento_enviado',
        precoFinalTotal: totalPrecoFinal,
        token,
        tokenExpiresAt,
        ambientesPapel: {
          create: ambientesPapel.map((a, i) => {
            const r = resultadosPapel[i]
            return {
              nomeAmbiente: a.nomeAmbiente,
              papelId: a.papelId,
              referenciaDigitada: a.referenciaDigitada || null,
              medicoes: a.medicoes,
              metrosQuadrados: r.metrosQuadrados,
              quantidadeRolos: r.quantidadeRolos,
              custoTotal: r.custoTotal,
              precoFinalVenda: r.precoFinalVenda,
              observacoes: a.observacoes ?? null,
            }
          }),
        },
      },
      include: { ambientesPapel: { include: { papel: true } } },
    })

    await prisma.logHistorico.create({
      data: {
        orcamentoId: orcamento.id,
        usuarioId: session.user.id,
        acao: 'orcamento_criado',
        detalhes: { produto: 'papel_parede', totalAmbientes: ambientesPapel.length, precoFinalTotal: totalPrecoFinal },
      },
    })

    const isAdmin = session.user.role === 'ADMIN'

    return NextResponse.json({
      orcamento,
      resultado: {
        ambientes: resultadosPapel.map(r => ({
          nomeAmbiente: r.nomeAmbiente,
          quantidadeTecido: 0,
          quantidadeBlackout: null,
          precisaTecidoExtra: false,
          bainhaDisponivel: 0,
          bainhaAlerta: null,
          precoFinalVenda: r.precoFinalVenda,
          metrosQuadrados: r.metrosQuadrados,
          quantidadeRolos: r.quantidadeRolos,
          custoTotal: isAdmin ? r.custoTotal : undefined,
          valorComissao: isAdmin ? r.valorComissao : undefined,
          valorRt: isAdmin ? r.valorRt : undefined,
        })),
        totalPrecoFinalVenda: totalPrecoFinal,
        ...(isAdmin ? {
          totalCusto: resultadosPapel.reduce((s, r) => s + r.custoTotal, 0),
          totalComissao: resultadosPapel.reduce((s, r) => s + r.valorComissao, 0),
          totalRt: resultadosPapel.reduce((s, r) => s + r.valorRt, 0),
        } : {}),
      },
    }, { status: 201 })
  }

  // --- Cortina (fluxo original) ---
  if (!ambientes?.length) {
    return NextResponse.json({ error: 'Nenhum ambiente informado' }, { status: 400 })
  }

  if (ambientes.some(a => !ambienteValido(a))) {
    return NextResponse.json({ error: 'Preencha tecido, largura e altura válidos em todos os ambientes antes de calcular.' }, { status: 400 })
  }

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

  // Buscar comissão do vendedor e verificar se cliente tem arquiteto
  const vendedor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { comissao: true } })
  const comissaoVendedor = vendedor?.comissao ? Number(vendedor.comissao) : null

  // Verificar se cliente tem arquiteto (para RT condicional)
  let clienteTemArquiteto = false
  if (clienteId) {
    const clienteDb = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { arquiteto: true } })
    clienteTemArquiteto = Boolean(clienteDb?.arquiteto)
  }

  // Recalcular com comissão do vendedor e RT condicional se necessário
  const configsAjustadas = { ...configs }
  if (comissaoVendedor !== null) {
    configsAjustadas.comissao_padrao = comissaoVendedor
  }
  if (!clienteTemArquiteto) {
    configsAjustadas.rt_padrao = 0
  }
  const resultadoFinal = calcularOrcamento(ambientes, configsAjustadas)

  const orcamento = await prisma.orcamento.create({
    data: {
      clienteId: clienteId || null,
      vendedorId: session.user.id,
      status: 'orcamento_enviado',
      precoFinalTotal: resultadoFinal.totalPrecoFinalVenda,
      token,
      tokenExpiresAt,
      ambientes: {
        create: ambientes.map((a, i) => {
          const r = resultadoFinal.ambientes[i]
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
      detalhes: { totalAmbientes: ambientes.length, precoFinalTotal: resultadoFinal.totalPrecoFinalVenda },
    },
  })

  const isAdmin = session.user.role === 'ADMIN'

  // Detalhes financeiros expandidos para admin e vendedor logado
  const detalhesFinanceiros = {
    ambientes: resultadoFinal.ambientes.map(a => ({
      nomeAmbiente: a.nomeAmbiente,
      quantidadeTecido: a.quantidadeTecido,
      quantidadeBlackout: a.quantidadeBlackout,
      precisaTecidoExtra: a.precisaTecidoExtra,
      bainhaDisponivel: a.bainhaDisponivel,
      bainhaAlerta: a.bainhaAlerta,
      precoFinalVenda: a.precoFinalVenda,
      // Detalhes financeiros
      custoTecido: a.custoTecido,
      custoBlackout: a.custoBlackout,
      custoConfeccao: a.custoConfeccao,
      custoInstalacao: a.custoInstalacao,
      custoTotal: a.custoTotal,
      precoComMarkup: a.precoComMarkup,
      valorRt: a.valorRt,
      valorComissao: a.valorComissao,
      markup: a.markup,
      margem: a.margem,
    })),
    totalPrecoFinalVenda: resultadoFinal.totalPrecoFinalVenda,
    totalCusto: resultadoFinal.totalCusto,
    totalComissao: resultadoFinal.totalComissao,
    totalRt: resultadoFinal.totalRt,
    totalMargem: resultadoFinal.totalMargem,
    comissaoVendedor: comissaoVendedor,
    clienteTemArquiteto,
  }

  return NextResponse.json({
    orcamento,
    resultado: isAdmin ? detalhesFinanceiros : {
      ...detalhesFinanceiros,
      // Vendedor vê comissão dele mas não vê margem
      ambientes: detalhesFinanceiros.ambientes.map(a => ({
        ...a,
        margem: undefined,
        custoTecido: undefined,
        custoBlackout: undefined,
        custoConfeccao: undefined,
        custoInstalacao: undefined,
        custoTotal: undefined,
        precoComMarkup: undefined,
        markup: undefined,
      })),
      totalCusto: undefined,
      totalMargem: undefined,
    },
  }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/orcamentos] erro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
