import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calcularOrcamento, AmbienteInput, Configuracoes } from '@/lib/calculoCortina'
import { calcularAmbientePapel, ConfigsPapel } from '@/lib/calculoPapelParede'

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
        instaladorId?: string | null
      })[]
      ambientesPapel?: {
        nomeAmbiente: string
        papelId: string
        medicoes: { largura: number; altura: number; m2: number }[]
        observacoes?: string | null
      }[]
    }

    const configsRaw = await prisma.configuracaoCalculo.findMany()
    const configMap: Record<string, string> = {}
    for (const c of configsRaw) configMap[c.chave] = c.valor

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

      const orcamento = await prisma.orcamento.update({
        where: { id: params.id },
        data: {
          clienteId: clienteId || null,
          precoFinalTotal: totalPrecoFinal,
          ambientes: { deleteMany: {} },
          ambientesPapel: {
            deleteMany: {},
            create: ambientesPapel.map((a, i) => {
              const r = resultadosPapel[i]
              return {
                nomeAmbiente: a.nomeAmbiente,
                papelId: a.papelId,
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
            custoTotal: isAdmin ? r.custoTotal : undefined,
          })),
          totalPrecoFinalVenda: totalPrecoFinal,
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

    const orcamento = await prisma.orcamento.update({
      where: { id: params.id },
      data: {
        clienteId: clienteId || null,
        precoFinalTotal: resultado.totalPrecoFinalVenda,
        ambientesPapel: { deleteMany: {} },
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
