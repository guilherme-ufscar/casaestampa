import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import RelatorioPDFDoc from '@/lib/RelatorioPDFDoc'
import React from 'react'
import { getRange, STATUS_FINANCEIROS, somarPrecoFinal } from '@/lib/relatorioUtils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const sp = new URL(req.url).searchParams
  const periodo = sp.get('periodo') ?? 'mes'
  const ini = sp.get('dataInicio') ?? undefined
  const fim = sp.get('dataFim') ?? undefined
  const range = getRange(periodo, ini, fim)

  const [orcamentos, vendedores, cfg, telefoneEmpresa] = await Promise.all([
    prisma.orcamento.findMany({
      where: { createdAt: range },
      include: {
        cliente: { select: { nome: true } },
        vendedor: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({ where: { role: 'VENDEDOR', ativo: true }, select: { id: true, nome: true } }),
    prisma.configuracaoCalculo.findUnique({ where: { chave: 'comissao_padrao' } }),
    prisma.configuracaoCalculo.findUnique({ where: { chave: 'telefone_empresa' } }),
  ])

  const comPct = parseFloat(cfg?.valor ?? '8') / 100
  const aprovados = orcamentos.filter(o => STATUS_FINANCEIROS.includes(o.status as never))
  const fat = somarPrecoFinal(aprovados)
  const fechados = aprovados.length

  const rankingVendedores = vendedores.map(v => {
    const orcsAprovados = orcamentos.filter(o => o.vendedor.id === v.id && STATUS_FINANCEIROS.includes(o.status as never))
    const total = orcamentos.filter(o => o.vendedor.id === v.id).length
    const faturamento = somarPrecoFinal(orcsAprovados)
    return { nome: v.nome, orcamentos: total, fechados: orcsAprovados.length, faturamento, comissao: faturamento * comPct, taxaAprovacao: total > 0 ? Math.round(orcsAprovados.length / total * 100) : 0 }
  }).sort((a, b) => b.faturamento - a.faturamento)

  const periodoLabel = periodo === 'mes' ? 'Este mês' : periodo === '3meses' ? 'Últimos 3 meses' : periodo === 'ano' ? 'Este ano' : `${ini} a ${fim}`

  const doc = React.createElement(RelatorioPDFDoc, {
    periodo: periodoLabel,
    faturamentoTotal: fat,
    totalOrcamentos: orcamentos.length,
    fechados,
    conversao: orcamentos.length > 0 ? Math.round(fechados / orcamentos.length * 100) : 0,
    rankingVendedores,
    orcamentos: orcamentos.map(o => ({
      numero: o.numero,
      cliente: o.cliente?.nome ?? '',
      vendedor: o.vendedor.nome,
      status: o.status,
      valor: Number(o.precoFinalTotal ?? 0),
      data: new Date(o.createdAt).toLocaleDateString('pt-BR'),
    })),
    telefoneEmpresa: telefoneEmpresa?.valor ?? '',
  })

  const buf = await renderToBuffer(doc as never)
  const uint8 = new Uint8Array(buf)

  return new NextResponse(uint8, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-casaestampa-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  })
}
