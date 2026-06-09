import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calcularOrcamento, AmbienteInput, Configuracoes } from '@/lib/calculoCortina'
import { calcularAmbientePapel, ConfigsPapel } from '@/lib/calculoPapelParede'
import { calcularAmbientePersiana, ConfigsPersiana } from '@/lib/calculoPersiana'
import { calcularAmbientePiso, ConfigsPiso, PisoInput } from '@/lib/calculoPiso'

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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const orc = await prisma.orcamento.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      vendedor: { select: { nome: true, email: true } },
      ambientes: {
        include: { tecido: true, blackout: true, trilhoVarao: true, instalador: true },
      },
      ambientesPapel: { include: { papel: true } },
      ambientesPersiana: { include: { persiana: true } },
      ambientesPiso: true,
    },
  })

  if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  if (session.user.role === 'VENDEDOR' && orc.vendedorId !== session.user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  return NextResponse.json(orc)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const existente = await prisma.orcamento.findUnique({
    where: { id: params.id },
    include: { ambientes: true },
  })

  if (!existente) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  if (session.user.role === 'VENDEDOR' && existente.vendedorId !== session.user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

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
        instaladorId?: string | null
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
        instalacao: boolean
        bandoId?: string | null
        bandoNome?: string | null
        bandoValorMetro?: number | null
        bandoLado?: string | null
        guiaLateralId?: string | null
        guiaLateralNome?: string | null
        guiaLateralValorMetro?: number | null
        guiaLateralFator?: number | null
        guiaBaseId?: string | null
        guiaBaseNome?: string | null
        guiaBaseValorMetro?: number | null
        motorId?: string | null
        motorNome?: string | null
        motorValor?: number | null
        controleRemotoId?: string | null
        controleRemotoNome?: string | null
        controleRemotoValor?: number | null
        valorM2: number
        minM2: number
        observacoes?: string | null
      }[]
    }

    const configsRaw = await prisma.configuracaoCalculo.findMany()
    const configMap: Record<string, string> = {}
    for (const c of configsRaw) configMap[c.chave] = c.valor

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

      const orcamento = await prisma.orcamento.update({
        where: { id: params.id },
        data: {
          clienteId: clienteId || null,
          precoFinalTotal: totalPrecoFinal,
          ambientes: { deleteMany: {} },
          ambientesPersiana: { deleteMany: {} },
          ambientesPiso: { deleteMany: {} },
          ambientesPapel: {
            deleteMany: {},
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
          acao: 'orcamento_editado',
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
            instalacaoPapel: r.instalacao,
            custoInstalacaoPapel: r.custoInstalacao,
            custoTotal: isAdmin ? r.custoTotal : undefined,
          })),
          totalPrecoFinalVenda: totalPrecoFinal,
        },
      })
    }

    // --- Persiana ---
    if (produto === 'persiana' && ambientesPersiana?.length) {
      const configsPersiana: ConfigsPersiana = {
        markup_persiana: parseFloat(configMap.markup_persiana ?? configMap.markup_padrao ?? '40'),
        comissao_padrao: parseFloat(configMap.comissao_padrao ?? '8'),
        rt_padrao: parseFloat(configMap.rt_padrao ?? '5'),
        instalacao_persiana_rolo: parseFloat(configMap.instalacao_persiana_rolo ?? '60'),
        instalacao_persiana_romana: parseFloat(configMap.instalacao_persiana_romana ?? '60'),
        instalacao_persiana_horizontal: parseFloat(configMap.instalacao_persiana_horizontal ?? '60'),
        instalacao_persiana_painel: parseFloat(configMap.instalacao_persiana_painel ?? '120'),
        instalacao_motor_persiana: parseFloat(configMap.instalacao_motor_persiana ?? '120'),
      }

      const vendedor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { comissao: true } })
      const comissaoVendedor = vendedor?.comissao ? Number(vendedor.comissao) : null
      if (comissaoVendedor !== null) configsPersiana.comissao_padrao = comissaoVendedor

      let clienteTemArquiteto = false
      if (clienteId) {
        const clienteDb = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { arquiteto: true } })
        clienteTemArquiteto = Boolean(clienteDb?.arquiteto)
      }
      if (!clienteTemArquiteto) configsPersiana.rt_padrao = 0

      const resultadosPersiana = ambientesPersiana.map(a => calcularAmbientePersiana({
        nomeAmbiente: a.nomeAmbiente,
        tipo: a.tipo as import('@/lib/calculoPersiana').TipoPersiana,
        largura: a.largura,
        altura: a.altura,
        quantidade: a.quantidade,
        valorM2: a.valorM2,
        minM2: a.minM2,
        acionamento: a.acionamento as 'manual' | 'motorizada',
        instalacao: a.instalacao,
        bando: a.bandoValorMetro ? { id: a.bandoId ?? '', nome: a.bandoNome ?? '', valorMetro: a.bandoValorMetro, lado: a.bandoLado ?? '' } : null,
        guiaLateral: a.guiaLateralValorMetro ? { id: a.guiaLateralId ?? '', nome: a.guiaLateralNome ?? '', valorMetro: a.guiaLateralValorMetro, fator: (a.guiaLateralFator ?? 1) as 1 | 2 } : null,
        guiaBase: a.guiaBaseValorMetro ? { id: a.guiaBaseId ?? '', nome: a.guiaBaseNome ?? '', valorMetro: a.guiaBaseValorMetro } : null,
        motor: a.motorValor ? { id: a.motorId ?? '', nome: a.motorNome ?? '', valor: a.motorValor } : null,
        controle: a.controleRemotoValor ? { id: a.controleRemotoId ?? '', nome: a.controleRemotoNome ?? '', valor: a.controleRemotoValor } : null,
      }, configsPersiana))

      const totalPrecoFinal = resultadosPersiana.reduce((s, r) => s + r.precoFinalVenda, 0)

      const orcamento = await prisma.orcamento.update({
        where: { id: params.id },
        data: {
          clienteId: clienteId || null,
          precoFinalTotal: totalPrecoFinal,
          ambientes: { deleteMany: {} },
          ambientesPapel: { deleteMany: {} },
          ambientesPiso: { deleteMany: {} },
          ambientesPersiana: {
            deleteMany: {},
            create: ambientesPersiana.map((a, i) => {
              const r = resultadosPersiana[i]
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
                lado: a.lado ?? null,
                acionamento: a.acionamento,
                instalacaoLocal: a.instalacaoLocal ?? null,
                instalacao: a.instalacao,
                bandoId: a.bandoId ?? null,
                bandoNome: a.bandoNome ?? null,
                bandoValorMetro: a.bandoValorMetro ?? null,
                bandoLado: a.bandoLado ?? null,
                guiaLateralId: a.guiaLateralId ?? null,
                guiaLateralNome: a.guiaLateralNome ?? null,
                guiaLateralValorMetro: a.guiaLateralValorMetro ?? null,
                guiaLateralFator: a.guiaLateralFator ?? null,
                guiaBaseId: a.guiaBaseId ?? null,
                guiaBaseNome: a.guiaBaseNome ?? null,
                guiaBaseValorMetro: a.guiaBaseValorMetro ?? null,
                motorId: a.motorId ?? null,
                motorNome: a.motorNome ?? null,
                motorValor: a.motorValor ?? null,
                controleRemotoId: a.controleRemotoId ?? null,
                controleRemotoNome: a.controleRemotoNome ?? null,
                controleRemotoValor: a.controleRemotoValor ?? null,
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
                observacoes: a.observacoes ?? null,
              }
            }),
          },
        },
        include: { ambientesPersiana: { include: { persiana: true } } },
      })

      await prisma.logHistorico.create({
        data: {
          orcamentoId: orcamento.id,
          usuarioId: session.user.id,
          acao: 'orcamento_editado',
          detalhes: { produto: 'persiana', totalAmbientes: ambientesPersiana.length, precoFinalTotal: totalPrecoFinal },
        },
      })

      const isAdmin = session.user.role === 'ADMIN'
      return NextResponse.json({
        orcamento,
        resultado: {
          ambientes: resultadosPersiana.map(r => ({
            nomeAmbiente: r.nomeAmbiente,
            m2Calculado: r.m2Calculado,
            m2Cobrado: r.m2Cobrado,
            precoFinalVenda: r.precoFinalVenda,
            custoTotal: isAdmin ? r.custoTotal : undefined,
          })),
          totalPrecoFinalVenda: totalPrecoFinal,
          comissaoVendedor,
          clienteTemArquiteto,
        },
      })
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
      const cfgPiso: ConfigsPiso = {
        markup_piso: parseFloat(configMap.markup_piso ?? configMap.markup_padrao ?? '35'),
        comissao_padrao: comissaoVendedor,
        rt_padrao: clienteTemArquiteto ? parseFloat(configMap.rt_padrao ?? '5') : 0,
        instalacao_piso_laminado_m2: parseFloat(configMap.instalacao_piso_laminado_m2 ?? '25'),
        instalacao_piso_vinilico_m2: parseFloat(configMap.instalacao_piso_vinilico_m2 ?? '30'),
        cola_vinilica_rendimento_m2: parseFloat(configMap.cola_vinilica_rendimento_m2 ?? '12'),
        massa_niveladora_rendimento_m2: parseFloat(configMap.massa_niveladora_rendimento_m2 ?? '10'),
      }

      const resultados = ambientesPiso.map(a => calcularAmbientePiso(a as PisoInput, cfgPiso))
      const totalPrecoFinal = resultados.reduce((s, r) => s + r.precoFinalVenda, 0)

      const orcamento = await prisma.orcamento.update({
        where: { id: params.id },
        data: {
          clienteId: clienteId || null,
          precoFinalTotal: totalPrecoFinal,
          ambientes: { deleteMany: {} },
          ambientesPapel: { deleteMany: {} },
          ambientesPersiana: { deleteMany: {} },
          ambientesPiso: {
            deleteMany: {},
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
          acao: 'orcamento_editado',
          detalhes: { produto: 'piso', totalAmbientes: ambientesPiso.length, precoFinalTotal: totalPrecoFinal },
        },
      })

      const isAdmin = session.user.role === 'ADMIN'
      return NextResponse.json({
        orcamento,
        resultado: {
          ambientes: resultados.map(r => ({
            nomeAmbiente: r.nomeAmbiente,
            precoFinalVenda: r.precoFinalVenda,
            areaTotalBruta: r.areaTotalBruta,
            areaComPerda: r.areaComPerda,
            custoTotal: isAdmin ? r.custoTotal : undefined,
          })),
          totalPrecoFinalVenda: totalPrecoFinal,
          comissaoVendedor,
          clienteTemArquiteto,
        },
      })
    }

    // --- Cortina ---
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

    // Buscar comissão do vendedor e verificar arquiteto
    const vendedor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { comissao: true } })
    const comissaoVendedor = vendedor?.comissao ? Number(vendedor.comissao) : null

    let clienteTemArquiteto = false
    if (clienteId) {
      const clienteDb = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { arquiteto: true } })
      clienteTemArquiteto = Boolean(clienteDb?.arquiteto)
    }

    if (comissaoVendedor !== null) configs.comissao_padrao = comissaoVendedor
    if (!clienteTemArquiteto) configs.rt_padrao = 0

    const resultado = calcularOrcamento(ambientes, configs)

    const orcamento = await prisma.orcamento.update({
      where: { id: params.id },
      data: {
        clienteId: clienteId || null,
        precoFinalTotal: resultado.totalPrecoFinalVenda,
        ambientesPapel: { deleteMany: {} },
        ambientesPersiana: { deleteMany: {} },
        ambientesPiso: { deleteMany: {} },
        ambientes: {
          deleteMany: {},
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
              instaladorId: a.instaladorId ?? null,
              trilhoAcessoriosValor: a.trilhoValorUnitario && comprimentoTrilho
                ? comprimentoTrilho * a.trilhoValorUnitario
                : null,
              outrosValor: a.outrosValor ?? null,
              observacoes: a.observacoes ?? null,
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
        acao: 'orcamento_editado',
        detalhes: { totalAmbientes: ambientes.length, precoFinalTotal: resultado.totalPrecoFinalVenda },
      },
    })

    const isAdmin = session.user.role === 'ADMIN'

    const detalhesFinanceiros = {
      ambientes: resultado.ambientes.map(a => ({
        nomeAmbiente: a.nomeAmbiente,
        quantidadeTecido: a.quantidadeTecido,
        quantidadeBlackout: a.quantidadeBlackout,
        precisaTecidoExtra: a.precisaTecidoExtra,
        bainhaDisponivel: a.bainhaDisponivel,
        bainhaAlerta: a.bainhaAlerta,
        precoFinalVenda: a.precoFinalVenda,
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
      totalPrecoFinalVenda: resultado.totalPrecoFinalVenda,
      totalCusto: resultado.totalCusto,
      totalComissao: resultado.totalComissao,
      totalRt: resultado.totalRt,
      totalMargem: resultado.totalMargem,
      comissaoVendedor,
      clienteTemArquiteto,
    }

    return NextResponse.json({
      orcamento,
      resultado: isAdmin ? detalhesFinanceiros : {
        ...detalhesFinanceiros,
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
    })
  } catch (error) {
    console.error('[PUT /api/orcamentos/[id]] erro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const orc = await prisma.orcamento.findUnique({ where: { id: params.id } })
  if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  if (session.user.role === 'VENDEDOR' && orc.vendedorId !== session.user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  await prisma.orcamento.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
