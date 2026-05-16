import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { STATUS_FINANCEIROS, somarPrecoFinal, somarCusto, calcularMargemMedia } from '@/lib/relatorioUtils'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const isAdmin = session.user.role === 'ADMIN'
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const vendedorFilter = isAdmin ? {} : { vendedorId: session.user.id }

  const statusCounts = await prisma.orcamento.groupBy({
    by: ['status'],
    where: vendedorFilter,
    _count: { status: true },
  })
  const byStatus: Record<string, number> = {}
  for (const s of statusCounts) byStatus[s.status] = s._count.status

  const mesFiltro = { ...vendedorFilter, createdAt: { gte: inicioMes } }
  const [totalMes, aprovadosMes] = await Promise.all([
    prisma.orcamento.count({ where: mesFiltro }),
    prisma.orcamento.count({ where: { ...mesFiltro, status: { in: [...STATUS_FINANCEIROS] } } }),
  ])

  const recentes = await prisma.orcamento.findMany({
    where: vendedorFilter,
    include: {
      cliente: { select: { nome: true } },
      vendedor: { select: { nome: true } },
      ambientes: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const instalacoes = await prisma.orcamento.findMany({
    where: { ...vendedorFilter, status: { in: ['pronto', 'instalado'] } },
    include: { cliente: { select: { nome: true, endereco: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  })

  const base = { byStatus, totalMes, aprovadosMes, recentes, instalacoes }
  if (!isAdmin) return NextResponse.json(base)

  const [orcamentosMes, ambientesMes] = await Promise.all([
    prisma.orcamento.findMany({
      where: { createdAt: { gte: inicioMes }, status: { in: [...STATUS_FINANCEIROS] } },
      select: { precoFinalTotal: true },
    }),
    prisma.ambienteOrcamento.findMany({
      where: { orcamento: { createdAt: { gte: inicioMes } } },
      select: { custoTotal: true, precoFinalVenda: true },
    }),
  ])

  const faturamentoMes = somarPrecoFinal(orcamentosMes)
  const custoTotal = somarCusto(ambientesMes)
  const margemMedia = calcularMargemMedia(ambientesMes)

  const faturamento6Meses = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1)
      const fim = new Date(agora.getFullYear(), agora.getMonth() - (5 - i) + 1, 0, 23, 59, 59)
      return prisma.orcamento.findMany({
        where: { createdAt: { gte: d, lte: fim }, status: { in: [...STATUS_FINANCEIROS] } },
        select: { precoFinalTotal: true },
      }).then(orcs => ({
        mes: d.toLocaleDateString('pt-BR', { month: 'short' }),
        faturamento: somarPrecoFinal(orcs),
      }))
    })
  )

  const vendedores = await prisma.user.findMany({
    where: { role: 'VENDEDOR', ativo: true },
    select: { id: true, nome: true },
  })
  const configComissao = await prisma.configuracaoCalculo.findUnique({ where: { chave: 'comissao_padrao' } })
  const comissaoPercentual = parseFloat(configComissao?.valor ?? '8') / 100

  const rankingVendedores = await Promise.all(
    vendedores.map(async vendedor => {
      const orcs = await prisma.orcamento.findMany({
        where: { vendedorId: vendedor.id, createdAt: { gte: inicioMes }, status: { in: [...STATUS_FINANCEIROS] } },
        select: { precoFinalTotal: true },
      })
      const faturamento = somarPrecoFinal(orcs)
      return {
        id: vendedor.id,
        nome: vendedor.nome,
        orcamentos: orcs.length,
        faturamento,
        comissao: faturamento * comissaoPercentual,
      }
    })
  )
  rankingVendedores.sort((a, b) => b.faturamento - a.faturamento)

  const fornecedoresOperacionais = await prisma.orcamento.findMany({
    where: { status: { in: ['aprovado', 'em_producao'] } },
    include: {
      ambientes: {
        include: { tecido: true, blackout: true, trilhoVarao: true, instalador: true },
      },
    },
  })

  let totalFornecedores = 0
  let totalInstalacaoOperacional = 0
  for (const orcamento of fornecedoresOperacionais) {
    for (const ambiente of orcamento.ambientes) {
      totalFornecedores += Number(ambiente.quantidadeTecido ?? 0) * Number(ambiente.tecido.valorMetro)
      if (ambiente.blackout && ambiente.quantidadeBlackout) totalFornecedores += Number(ambiente.quantidadeBlackout) * Number(ambiente.blackout.valorMetro)
      if (ambiente.trilhoVarao && ambiente.trilhoAcessoriosValor) totalFornecedores += Number(ambiente.trilhoAcessoriosValor)
      totalFornecedores += Number(ambiente.custoConfeccao ?? 0)
      totalInstalacaoOperacional += Number(ambiente.custoInstalacao ?? 0)
    }
  }

  return NextResponse.json({
    ...base,
    faturamentoMes,
    custoTotal,
    margemMedia,
    faturamento6Meses,
    rankingVendedores,
    operacionalFinanceiro: {
      totalFornecedores,
      totalInstalacao: totalInstalacaoOperacional,
      totalGeral: totalFornecedores + totalInstalacaoOperacional,
    },
  })
}
