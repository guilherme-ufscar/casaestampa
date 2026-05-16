import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calcularAmbiente, Configuracoes, ModeloCortina, TipoAbertura } from '@/lib/calculoCortina'

type GrupoFinanceiro = {
  chave: string
  nome: string
  valorTotal: number
  pedidos: number
  ambientes: number
}

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
    encerramento: cfgMap.whatsapp_encerramento ?? 'Aguardo valor para depósito. Obrigada.',
  }

  const grupos = new Map<string, GrupoFinanceiro>()
  const somarGrupo = (chave: string, nome: string, valor: number) => {
    const atual = grupos.get(chave) ?? { chave, nome, valorTotal: 0, pedidos: 0, ambientes: 0 }
    atual.valorTotal += valor
    atual.ambientes += 1
    grupos.set(chave, atual)
  }

  const resultado = pedidos.map(pedido => {
    const ambientesDetalhados = pedido.ambientes.map(a => {
      const calculado = calcularAmbiente({
        nomeAmbiente: a.nomeAmbiente,
        largura: Number(a.largura),
        altura: Number(a.altura),
        modeloCortina: a.modeloCortina as ModeloCortina,
        tipoAbertura: a.tipoAbertura as TipoAbertura,
        tipoAberturaBlackout: a.tipoAberturaBlackout as TipoAbertura | null,
        tecido: { id: a.tecidoId, larguraMaxima: Number(a.tecido.larguraMaxima), valorMetro: Number(a.tecido.valorMetro) },
        blackout: a.blackout ? { id: a.blackoutId!, larguraMaxima: Number(a.blackout.larguraMaxima), valorMetro: Number(a.blackout.valorMetro) } : null,
        tecidoExtra: a.tecidoExtra,
        blackoutExtra: a.blackoutExtra,
        bainhaDesejada: a.bainhaDesejada ? Number(a.bainhaDesejada) : 0.2,
        instalacao: a.instalacao,
        trilhoValorUnitario: a.trilhoVarao ? Number(a.trilhoVarao.valorUnitario) : null,
        outrosValor: a.outrosValor ? Number(a.outrosValor) : null,
      }, configs)

      const fornecedorTrilho = a.trilhoVarao?.nome.includes('Rio Flex') ? 'rioflex'
        : a.trilhoVarao?.nome.includes('Venetillo') ? 'venetillo'
        : null

      const comprimentoTrilho = a.trilhoVarao
        ? Math.ceil(Number(a.largura) * 2) / 2
        : null

      const custoTecido = Number(a.quantidadeTecido ?? calculado.quantidadeTecido) * Number(a.tecido.valorMetro)
      const custoBlackout = a.blackout && (a.quantidadeBlackout ?? calculado.quantidadeBlackout)
        ? Number(a.quantidadeBlackout ?? calculado.quantidadeBlackout ?? 0) * Number(a.blackout.valorMetro)
        : 0
      const custoTrilho = Number(a.trilhoAcessoriosValor ?? 0)
      const custoConfeccao = Number(a.custoConfeccao ?? calculado.custoConfeccao)
      const custoInstalacao = Number(a.custoInstalacao ?? calculado.custoInstalacao)

      somarGrupo('deccor', 'Deccor', custoTecido + custoBlackout)
      if (fornecedorTrilho === 'rioflex') somarGrupo('rioflex', 'Rio Flex', custoTrilho)
      if (fornecedorTrilho === 'venetillo') somarGrupo('venetillo', 'Venetillo', custoTrilho)
      somarGrupo('costureira_cici', 'Costureira Cici', custoConfeccao)
      if (a.instalacao && a.instalador) somarGrupo(`instalador:${a.instalador.id}`, `Instalação — ${a.instalador.nome}`, custoInstalacao)

      return {
        id: a.id,
        nomeAmbiente: a.nomeAmbiente,
        largura: Number(a.largura),
        altura: Number(a.altura),
        modeloCortina: a.modeloCortina,
        tipoAbertura: a.tipoAbertura,
        tipoAberturaBlackout: a.tipoAberturaBlackout ?? a.tipoAbertura,
        trilhoTipo: a.trilhoTipo,
        bainhaDesejada: Number(a.bainhaDesejada ?? calculado.bainhaDesejada),
        tecidoExtra: a.tecidoExtra,
        blackoutExtra: a.blackoutExtra,
        tecidoNome: a.tecido.nome,
        quantidadeTecido: Number(a.quantidadeTecido ?? calculado.quantidadeTecido),
        blackoutNome: a.blackout?.nome ?? null,
        quantidadeBlackout: a.quantidadeBlackout ? Number(a.quantidadeBlackout) : calculado.quantidadeBlackout,
        custoTecido,
        custoBlackout,
        trilhoNome: a.trilhoVarao?.nome ?? null,
        fornecedorTrilho,
        comprimentoTrilho,
        custoTrilho,
        custoConfeccao,
        instalacao: a.instalacao,
        instaladorId: a.instalador?.id ?? null,
        instaladorNome: a.instalador?.nome ?? null,
        instaladorTelefone: a.instalador?.telefone ?? null,
        custoInstalacao,
        observacoes: a.observacoes ?? null,
      }
    })

    for (const grupo of new Set(['deccor', 'rioflex', 'venetillo', 'costureira_cici'])) {
      const atual = grupos.get(grupo)
      if (atual) atual.pedidos += 1
    }
    for (const ambiente of ambientesDetalhados.filter(a => a.instalacao && a.instaladorId)) {
      const chave = `instalador:${ambiente.instaladorId}`
      const atual = grupos.get(chave)
      if (atual) atual.pedidos += 1
    }

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

  const gruposFinanceiros = Array.from(grupos.values()).sort((a, b) => b.valorTotal - a.valorTotal)
  const totalFornecedores = gruposFinanceiros
    .filter(g => !g.chave.startsWith('instalador:'))
    .reduce((acc, g) => acc + g.valorTotal, 0)
  const totalInstalacao = gruposFinanceiros
    .filter(g => g.chave.startsWith('instalador:'))
    .reduce((acc, g) => acc + g.valorTotal, 0)

  return NextResponse.json({
    pedidos: resultado,
    financeiro: {
      totalFornecedores,
      totalInstalacao,
      totalGeral: totalFornecedores + totalInstalacao,
      grupos: gruposFinanceiros,
    },
  })
}
