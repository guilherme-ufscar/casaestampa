import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calcularOrcamento, AmbienteInput, Configuracoes } from '@/lib/calculoCortina'
import { calcularAmbientePapel, getFatorDimensao, ConfigsPapel } from '@/lib/calculoPapelParede'
import { calcularAmbientePersiana, ConfigsPersiana } from '@/lib/calculoPersiana'
import { calcularAmbientePiso, ConfigsPiso, PisoInput } from '@/lib/calculoPiso'
import { gerarToken, tokenExpiracao } from '@/lib/token'
import { notificarAdmins } from '@/lib/webpush'

function montarConfigsPiso(configMap: Record<string, string>, comissao: number, rt: number): ConfigsPiso {
  return {
    markup_piso: parseFloat(configMap.markup_piso ?? configMap.markup_padrao ?? '35'),
    comissao_padrao: comissao,
    rt_padrao: rt,
    instalacao_piso_laminado_m2: parseFloat(configMap.instalacao_piso_laminado_m2 ?? '25'),
    instalacao_piso_vinilico_m2: parseFloat(configMap.instalacao_piso_vinilico_m2 ?? '30'),
    cola_vinilica_rendimento_m2: parseFloat(configMap.cola_vinilica_rendimento_m2 ?? '12'),
    massa_niveladora_rendimento_m2: parseFloat(configMap.massa_niveladora_rendimento_m2 ?? '10'),
  }
}

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
      ambientesPersiana: { include: { persiana: true } },
      ambientesPiso: true,
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
  const ambientesPiso = (body as { ambientesPiso?: (PisoInput & { dados?: unknown })[] }).ambientesPiso
  const { clienteId, ambientes, ambientesPapel, ambientesPersiana, produto } = body as {
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
    ambientesPersiana?: {
      nomeAmbiente: string
      persianaId: string
      fornecedor: string
      tipo: string
      colecao: string
      modelo: string
      largura: number
      altura: number
      quantidade: number
      lado?: string | null
      acionamento: string
      instalacaoLocal?: string | null
      trilhoLargura?: number | null
      bando?: { id: string; nome: string; valorMetro: number; lado: string } | null
      guiaLateral?: { id: string; nome: string; valorMetro: number; fator: number } | null
      guiaBase?: { id: string; nome: string; valorMetro: number } | null
      motor?: { id: string; nome: string; valor: number } | null
      controle?: { id: string; nome: string; valor: number } | null
      instalacao: boolean
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
      markup_papel_parede: parseFloat(configMap.markup_papel_parede ?? configMap.markup_padrao ?? '50'),
      comissao_padrao: parseFloat(configMap.comissao_padrao ?? '8'),
      rt_padrao: parseFloat(configMap.rt_padrao ?? '5'),
      instalacao_papel_1rolo: parseFloat(configMap.instalacao_papel_1rolo ?? '150'),
      instalacao_papel_2rolos: parseFloat(configMap.instalacao_papel_2rolos ?? '200'),
      instalacao_papel_por_rolo: parseFloat(configMap.instalacao_papel_por_rolo ?? '90'),
    }

    const papeisIds = [...new Set(ambientesPapel.map(a => a.papelId))]
    const papeisDb = await prisma.papelParede.findMany({ where: { id: { in: papeisIds } } })
    const papeisMap = Object.fromEntries(papeisDb.map(p => [p.id, p]))

    const resultadosPapel = (ambientesPapel as Array<typeof ambientesPapel[0] & { instalacao?: boolean }>).map(a => {
      const papel = papeisMap[a.papelId]
      return calcularAmbientePapel({
        nomeAmbiente: a.nomeAmbiente,
        dimensao: papel?.dimensao ?? '0.53x10',
        valorRolo: Number(papel?.valorRolo ?? 0),
        medicoes: a.medicoes,
        instalacao: a.instalacao ?? false,
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
          create: (ambientesPapel as Array<typeof ambientesPapel[0] & { instalacao?: boolean }>).map((a, i) => {
            const r = resultadosPapel[i]
            return {
              nomeAmbiente: a.nomeAmbiente,
              papelId: a.papelId,
              referenciaDigitada: a.referenciaDigitada || null,
              medicoes: a.medicoes,
              metrosQuadrados: r.metrosQuadrados,
              quantidadeRolos: r.quantidadeRolos,
              custoTotal: r.custoTotal,
              custoInstalacao: r.custoInstalacao,
              instalacao: r.instalacao,
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

    notificarAdmins({
      title: `Novo orçamento #${orcamento.numero}`,
      body: `Papel de parede · ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrecoFinal)}`,
      url: `/painel-pedidos`,
    }).catch(() => {})

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
          instalacaoPapel: r.instalacao,
          custoInstalacaoPapel: r.custoInstalacao,
          custoMaterial: isAdmin ? r.custoMaterial : undefined,
          custoTotal: isAdmin ? r.custoTotal : undefined,
          precoComMarkup: isAdmin ? r.precoComMarkup : undefined,
          valorComissao: isAdmin ? r.valorComissao : undefined,
          valorRt: isAdmin ? r.valorRt : undefined,
          margem: isAdmin ? r.precoComMarkup - r.custoTotal : undefined,
          markup: isAdmin ? parseFloat(configMap.markup_papel_parede ?? configMap.markup_padrao ?? '50') : undefined,
        })),
        totalPrecoFinalVenda: totalPrecoFinal,
        ...(isAdmin ? {
          totalCusto: resultadosPapel.reduce((s, r) => s + r.custoTotal, 0),
          totalComissao: resultadosPapel.reduce((s, r) => s + r.valorComissao, 0),
          totalRt: resultadosPapel.reduce((s, r) => s + r.valorRt, 0),
          totalMargem: resultadosPapel.reduce((s, r) => s + (r.precoComMarkup - r.custoTotal), 0),
        } : {}),
      },
    }, { status: 201 })
  }

  // --- Persiana ---
  if (produto === 'persiana' && ambientesPersiana?.length) {
    const vendedor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { comissao: true } })
    const comissaoVendedor = vendedor?.comissao ? Number(vendedor.comissao) : null
    let clienteTemArquiteto = false
    if (clienteId) {
      const clienteDb = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { arquiteto: true } })
      clienteTemArquiteto = Boolean(clienteDb?.arquiteto)
    }

    const cfgPersiana: ConfigsPersiana = {
      markup_persiana: parseFloat(configMap.markup_persiana ?? configMap.markup_padrao ?? '40'),
      comissao_padrao: comissaoVendedor ?? parseFloat(configMap.comissao_padrao ?? '8'),
      rt_padrao: clienteTemArquiteto ? parseFloat(configMap.rt_padrao ?? '5') : 0,
      instalacao_persiana_rolo: parseFloat(configMap.instalacao_persiana_rolo ?? '60'),
      instalacao_persiana_romana: parseFloat(configMap.instalacao_persiana_romana ?? '60'),
      instalacao_persiana_horizontal: parseFloat(configMap.instalacao_persiana_horizontal ?? '60'),
      instalacao_persiana_painel: parseFloat(configMap.instalacao_persiana_painel ?? '120'),
      instalacao_motor_persiana: parseFloat(configMap.instalacao_motor_persiana ?? '120'),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultadosPersiana = ambientesPersiana.map((a: any) =>
      calcularAmbientePersiana({
        nomeAmbiente: a.nomeAmbiente,
        tipo: a.tipo as import('@/lib/calculoPersiana').TipoPersiana,
        largura: a.largura,
        altura: a.altura,
        quantidade: a.quantidade,
        valorM2: 0, // overridden below via persiana catalog
        minM2: 1.5,
        acionamento: a.acionamento,
        instalacao: a.instalacao,
        bando: a.bando ? { ...a.bando, valorMetro: a.bando.valorMetro } : null,
        guiaLateral: a.guiaLateral ? { ...a.guiaLateral, valorMetro: a.guiaLateral.valorMetro, fator: a.guiaLateral.fator } : null,
        guiaBase: a.guiaBase ? { ...a.guiaBase, valorMetro: a.guiaBase.valorMetro } : null,
        motor: a.acionamento === 'motorizada' && a.motor ? a.motor : null,
        controle: a.acionamento === 'motorizada' && a.controle ? a.controle : null,
      }, cfgPersiana)
    )

    // Recalculate with actual valorM2 from payload (client sends it)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultadosFinais = ambientesPersiana.map((a: any, idx: number) => {
      void resultadosPersiana[idx]
      return calcularAmbientePersiana({
        nomeAmbiente: a.nomeAmbiente,
        tipo: a.tipo as import('@/lib/calculoPersiana').TipoPersiana,
        largura: a.largura,
        altura: a.altura,
        quantidade: a.quantidade,
        valorM2: a.valorM2,
        minM2: a.minM2 ?? 1.5,
        acionamento: a.acionamento,
        instalacao: a.instalacao,
        bando: a.bando ? { ...a.bando } : null,
        guiaLateral: a.guiaLateral ? { ...a.guiaLateral } : null,
        guiaBase: a.guiaBase ? { ...a.guiaBase } : null,
        motor: a.acionamento === 'motorizada' && a.motor ? a.motor : null,
        controle: a.acionamento === 'motorizada' && a.controle ? a.controle : null,
      }, cfgPersiana)
    })

    const totalPrecoFinal = resultadosFinais.reduce((s, r) => s + r.precoFinalVenda, 0)

    const orcamento = await prisma.orcamento.create({
      data: {
        clienteId: clienteId || null,
        vendedorId: session.user.id,
        status: 'orcamento_enviado',
        precoFinalTotal: totalPrecoFinal,
        token,
        tokenExpiresAt,
        ambientesPersiana: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          create: ambientesPersiana.map((a: any, i: number) => {
            const r = resultadosFinais[i]
            return {
              nomeAmbiente: a.nomeAmbiente,
              persianaId: a.persianaId,
              fornecedor: a.fornecedor,
              tipo: a.tipo,
              colecao: a.colecao,
              modelo: a.modelo,
              largura: a.largura,
              altura: a.altura,
              quantidade: a.quantidade,
              lado: a.lado || null,
              acionamento: a.acionamento,
              instalacaoLocal: a.instalacaoLocal || null,
              trilhoLargura: a.trilhoLargura || null,
              bandoId: a.bando?.id || null,
              bandoNome: a.bando?.nome || null,
              bandoValorMetro: a.bando?.valorMetro || null,
              bandoLado: a.bando?.lado || null,
              guiaLateralId: a.guiaLateral?.id || null,
              guiaLateralNome: a.guiaLateral?.nome || null,
              guiaLateralValorMetro: a.guiaLateral?.valorMetro || null,
              guiaLateralFator: a.guiaLateral?.fator || null,
              guiaBaseId: a.guiaBase?.id || null,
              guiaBaseNome: a.guiaBase?.nome || null,
              guiaBaseValorMetro: a.guiaBase?.valorMetro || null,
              motorId: a.motor?.id || null,
              motorNome: a.motor?.nome || null,
              motorValor: a.motor?.valor || null,
              controleRemotoId: a.controle?.id || null,
              controleRemotoNome: a.controle?.nome || null,
              controleRemotoValor: a.controle?.valor || null,
              m2Calculado: r.m2Calculado,
              m2Cobrado: r.m2Cobrado,
              custoPersiana: r.custoPersiana,
              custoBando: r.custoBando,
              custoGuiaLateral: r.custoGuiaLateral,
              custoGuiaBase: r.custoGuiaBase,
              custoMotor: r.custoMotor,
              custoControle: r.custoControle,
              custoInstalacaoMotor: r.custoInstalacaoMotor,
              custoInstalacao: r.custoInstalacao,
              custoTotal: r.custoTotal,
              precoFinalVenda: r.precoFinalVenda,
              instalacao: a.instalacao,
              observacoes: a.observacoes || null,
            }
          }),
        },
      },
      include: { ambientesPersiana: true },
    })

    await prisma.logHistorico.create({
      data: {
        orcamentoId: orcamento.id,
        usuarioId: session.user.id,
        acao: 'orcamento_criado',
        detalhes: { produto: 'persiana', totalAmbientes: ambientesPersiana.length, precoFinalTotal: totalPrecoFinal },
      },
    })

    notificarAdmins({
      title: `Novo orçamento #${orcamento.numero}`,
      body: `Persianas · ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrecoFinal)}`,
      url: `/painel-pedidos`,
    }).catch(() => {})

    const isAdminP = session.user.role === 'ADMIN'

    return NextResponse.json({
      orcamento,
      resultado: {
        ambientes: resultadosFinais.map(r => ({
          nomeAmbiente: r.nomeAmbiente,
          quantidadeTecido: 0,
          quantidadeBlackout: null,
          precisaTecidoExtra: false,
          bainhaDisponivel: 0,
          bainhaAlerta: null,
          precoFinalVenda: r.precoFinalVenda,
          m2Cobrado: r.m2Cobrado,
          quantidade: r.quantidade,
          tipo: r.tipo,
          custoTotal: isAdminP ? r.custoTotal : undefined,
          custoDetalhes: isAdminP ? {
            custoPersiana: r.custoPersiana,
            custoBando: r.custoBando,
            custoGuiaLateral: r.custoGuiaLateral,
            custoGuiaBase: r.custoGuiaBase,
            custoMotor: r.custoMotor,
            custoControle: r.custoControle,
            custoInstalacaoMotor: r.custoInstalacaoMotor,
            custoInstalacao: r.custoInstalacao,
          } : undefined,
          precoComMarkup: isAdminP ? r.precoComMarkup : undefined,
          valorRt: isAdminP ? r.valorRt : undefined,
          valorComissao: r.valorComissao,
          margem: isAdminP ? r.margem : undefined,
          markup: isAdminP ? r.markup : undefined,
        })),
        totalPrecoFinalVenda: totalPrecoFinal,
        totalCusto: isAdminP ? resultadosFinais.reduce((s, r) => s + r.custoTotal, 0) : undefined,
        totalComissao: resultadosFinais.reduce((s, r) => s + r.valorComissao, 0),
        totalRt: isAdminP ? resultadosFinais.reduce((s, r) => s + r.valorRt, 0) : undefined,
        totalMargem: isAdminP ? resultadosFinais.reduce((s, r) => s + r.margem, 0) : undefined,
        comissaoVendedor,
        clienteTemArquiteto,
      },
    }, { status: 201 })
  }

  // --- Piso ---
  if (produto === 'piso' && ambientesPiso?.length) {
    const vendedor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { comissao: true } })
    const comissaoVendedor = vendedor?.comissao ? Number(vendedor.comissao) : parseFloat(configMap.comissao_padrao ?? '8')
    let clienteTemArquiteto = false
    if (clienteId) {
      const clienteDb = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { arquiteto: true } })
      clienteTemArquiteto = Boolean(clienteDb?.arquiteto)
    }
    const cfgPiso = montarConfigsPiso(configMap, comissaoVendedor, clienteTemArquiteto ? parseFloat(configMap.rt_padrao ?? '5') : 0)

    const resultados = ambientesPiso.map(a => calcularAmbientePiso(a as PisoInput, cfgPiso))
    const totalPrecoFinal = resultados.reduce((s, r) => s + r.precoFinalVenda, 0)

    const orcamento = await prisma.orcamento.create({
      data: {
        clienteId: clienteId || null,
        vendedorId: session.user.id,
        status: 'orcamento_enviado',
        precoFinalTotal: totalPrecoFinal,
        token,
        tokenExpiresAt,
        ambientesPiso: {
          create: ambientesPiso.map((a, i) => {
            const r = resultados[i]
            return {
              nomeAmbiente: a.nomeAmbiente,
              tipoPiso: a.tipoPiso,
              fabricante: a.fabricante ?? null,
              pisoId: (a as { pisoId?: string | null }).pisoId ?? null,
              pisoModelo: a.pisoModelo,
              areaTotalBruta: r.areaTotalBruta,
              areaComPerda: r.areaComPerda,
              rodapeNome: r.rodapeNome,
              frete: a.frete ?? 190,
              custoTotal: r.custoTotal,
              precoFinalVenda: r.precoFinalVenda,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              dados: ((a as any).dados ?? a) as any,
              observacoes: a.observacoes ?? null,
            }
          }),
        },
      },
      include: { ambientesPiso: true },
    })

    await prisma.logHistorico.create({
      data: {
        orcamentoId: orcamento.id,
        usuarioId: session.user.id,
        acao: 'orcamento_criado',
        detalhes: { produto: 'piso', totalAmbientes: ambientesPiso.length, precoFinalTotal: totalPrecoFinal },
      },
    })

    notificarAdmins({
      title: `Novo orçamento #${orcamento.numero}`,
      body: `Piso · ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrecoFinal)}`,
      url: `/painel-pedidos`,
    }).catch(() => {})

    const isAdmin = session.user.role === 'ADMIN'
    return NextResponse.json({
      orcamento,
      resultado: {
        ambientes: resultados.map(r => ({
          nomeAmbiente: r.nomeAmbiente,
          quantidadeTecido: 0,
          quantidadeBlackout: null,
          precisaTecidoExtra: false,
          bainhaDisponivel: 0,
          bainhaAlerta: null,
          precoFinalVenda: r.precoFinalVenda,
          areaTotalBruta: r.areaTotalBruta,
          areaComPerda: r.areaComPerda,
          custoPiso: isAdmin ? r.custoPiso : undefined,
          custoInstalacao: isAdmin ? r.custoInstalacao : undefined,
          frete: isAdmin ? r.frete : undefined,
          custoTotal: isAdmin ? r.custoTotal : undefined,
          precoComMarkup: isAdmin ? r.precoComMarkup : undefined,
          valorRt: isAdmin ? r.valorRt : undefined,
          valorComissao: r.valorComissao,
          margem: isAdmin ? r.margem : undefined,
          markup: isAdmin ? r.markup : undefined,
        })),
        totalPrecoFinalVenda: totalPrecoFinal,
        totalCusto: isAdmin ? resultados.reduce((s, r) => s + r.custoTotal, 0) : undefined,
        totalComissao: resultados.reduce((s, r) => s + r.valorComissao, 0),
        totalRt: isAdmin ? resultados.reduce((s, r) => s + r.valorRt, 0) : undefined,
        totalMargem: isAdmin ? resultados.reduce((s, r) => s + r.margem, 0) : undefined,
        comissaoVendedor,
        clienteTemArquiteto,
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
    markup_padrao: parseFloat(configMap.markup_cortina ?? configMap.markup_padrao ?? '50'),
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

  notificarAdmins({
    title: `Novo orçamento #${orcamento.numero}`,
    body: `Cortina · ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultadoFinal.totalPrecoFinalVenda)}`,
    url: `/painel-pedidos`,
  }).catch(() => {})

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
