import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calcularAmbiente, Configuracoes, ModeloCortina, TipoAbertura } from '@/lib/calculoCortina'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const [pedidos, configsRaw] = await Promise.all([
    prisma.orcamento.findMany({
      where: { status: { in: ['aprovado', 'em_producao'] } },
      include: {
        cliente: true,
        vendedor: { select: { nome: true } },
        ambientes: {
          include: { tecido: true, blackout: true, trilhoVarao: true, instalador: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.configuracaoCalculo.findMany(),
  ])

  const cfgMap: Record<string, string> = {}
  for (const c of configsRaw) cfgMap[c.chave] = c.valor

  const configs: Configuracoes = {
    markup_padrao: parseFloat(cfgMap.markup_padrao ?? '40'),
    comissao_padrao: parseFloat(cfgMap.comissao_padrao ?? '8'),
    rt_padrao: parseFloat(cfgMap.rt_padrao ?? '5'),
    confeccao_prega_macho: parseFloat(cfgMap.confeccao_prega_macho ?? '27'),
    confeccao_prega_femea: parseFloat(cfgMap.confeccao_prega_femea ?? '27'),
    confeccao_prega_americana: parseFloat(cfgMap.confeccao_prega_americana ?? '30'),
    confeccao_prega_franzida: parseFloat(cfgMap.confeccao_prega_franzida ?? '27'),
    confeccao_prega_reta: parseFloat(cfgMap.confeccao_prega_reta ?? '24'),
    confeccao_wave: parseFloat(cfgMap.confeccao_wave ?? '38'),
    confeccao_soft_wave: parseFloat(cfgMap.confeccao_soft_wave ?? '30'),
    confeccao_varao: parseFloat(cfgMap.confeccao_varao ?? '39'),
    instalacao_valor_m2: parseFloat(cfgMap.instalacao_valor_m2 ?? '35'),
    fator_prega_macho: parseFloat(cfgMap.fator_prega_macho ?? '3'),
    fator_prega_femea: parseFloat(cfgMap.fator_prega_femea ?? '2.5'),
    fator_prega_americana: parseFloat(cfgMap.fator_prega_americana ?? '2.5'),
    fator_prega_franzida: parseFloat(cfgMap.fator_prega_franzida ?? '3'),
    fator_prega_reta: parseFloat(cfgMap.fator_prega_reta ?? '1'),
    fator_wave: parseFloat(cfgMap.fator_wave ?? '2'),
    fator_soft_wave: parseFloat(cfgMap.fator_soft_wave ?? '2'),
    fator_varao: parseFloat(cfgMap.fator_varao ?? '1.5'),
  }

  const whatsapp = {
    deccor: cfgMap.whatsapp_deccor ?? '',
    venetillo: cfgMap.whatsapp_venetillo ?? '',
    rioflex: cfgMap.whatsapp_rioflex ?? '',
    costureira_cici: cfgMap.whatsapp_costureira_cici ?? '',
  }

  const resultado = pedidos.map(pedido => {
    const ambientesDetalhados = pedido.ambientes.map(a => {
      let custoConfeccao = Number(a.custoConfeccao ?? 0)
      let custoInstalacao = Number(a.custoInstalacao ?? 0)

      // Recalcular se não estiver salvo
      if (!a.custoConfeccao || !a.custoInstalacao) {
        try {
          const r = calcularAmbiente({
            nomeAmbiente: a.nomeAmbiente,
            largura: Number(a.largura),
            altura: Number(a.altura),
            modeloCortina: a.modeloCortina as ModeloCortina,
            tipoAbertura: a.tipoAbertura as TipoAbertura,
            tecido: { id: a.tecidoId, larguraMaxima: Number(a.tecido.larguraMaxima), valorMetro: Number(a.tecido.valorMetro) },
            blackout: a.blackout ? { id: a.blackoutId!, larguraMaxima: Number(a.blackout.larguraMaxima), valorMetro: Number(a.blackout.valorMetro) } : null,
            tecidoExtra: false,
            instalacao: a.instalacao,
            trilhoValorUnitario: a.trilhoVarao ? Number(a.trilhoVarao.valorUnitario) : null,
            outrosValor: a.outrosValor ? Number(a.outrosValor) : null,
          }, configs)
          custoConfeccao = r.custoConfeccao
          custoInstalacao = r.custoInstalacao
        } catch { /* usa 0 */ }
      }

      const fornecedorTrilho = a.trilhoVarao?.nome.includes('Rio Flex') ? 'rioflex'
        : a.trilhoVarao?.nome.includes('Venetillo') ? 'venetillo'
        : null

      const comprimentoTrilho = a.trilhoVarao
        ? Math.ceil(Number(a.largura) * 2) / 2
        : null

      return {
        id: a.id,
        nomeAmbiente: a.nomeAmbiente,
        largura: Number(a.largura),
        altura: Number(a.altura),
        modeloCortina: a.modeloCortina,
        tipoAbertura: a.tipoAbertura,
        // Deccor
        tecidoNome: a.tecido.nome,
        quantidadeTecido: Number(a.quantidadeTecido ?? 0),
        blackoutNome: a.blackout?.nome ?? null,
        quantidadeBlackout: a.quantidadeBlackout ? Number(a.quantidadeBlackout) : null,
        custoTecido: Number(a.quantidadeTecido ?? 0) * Number(a.tecido.valorMetro),
        custoBlackout: a.blackout && a.quantidadeBlackout
          ? Number(a.quantidadeBlackout) * Number(a.blackout.valorMetro)
          : 0,
        // Trilho
        trilhoNome: a.trilhoVarao?.nome ?? null,
        fornecedorTrilho,
        comprimentoTrilho,
        custoTrilho: Number(a.trilhoAcessoriosValor ?? 0),
        // Confecção
        custoConfeccao,
        // Instalação
        instalacao: a.instalacao,
        instaladorNome: a.instalador?.nome ?? null,
        instaladorTelefone: a.instalador?.telefone ?? null,
        custoInstalacao,
        observacoes: a.observacoes ?? null,
      }
    })

    return {
      id: pedido.id,
      numero: pedido.numero,
      status: pedido.status,
      createdAt: pedido.createdAt,
      cliente: pedido.cliente,
      vendedor: pedido.vendedor,
      ambientes: ambientesDetalhados,
      whatsapp,
    }
  })

  return NextResponse.json(resultado)
}
