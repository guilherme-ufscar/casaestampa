import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ClienteFichaPDFDoc from '@/lib/ClienteFichaPDFDoc'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      orcamentos: {
        include: {
          vendedor: { select: { nome: true } },
          instalador: { select: { nome: true } },
          ambientes: { include: { instalador: { select: { nome: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!cliente) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const doc = React.createElement(ClienteFichaPDFDoc, {
    cliente: {
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email,
      endereco: cliente.endereco,
      arquiteto: cliente.arquiteto,
      createdAt: cliente.createdAt.toISOString(),
      orcamentos: cliente.orcamentos.map(orcamento => ({
        numero: orcamento.numero,
        status: orcamento.status,
        createdAt: orcamento.createdAt.toISOString(),
        precoFinalTotal: orcamento.precoFinalTotal != null ? Number(orcamento.precoFinalTotal) : null,
        vendedorNome: orcamento.vendedor.nome,
        ambientes: orcamento.ambientes.map(ambiente => ({
          nomeAmbiente: ambiente.nomeAmbiente,
          modeloCortina: ambiente.modeloCortina,
          instaladorNome: ambiente.instalador?.nome ?? null,
        })),
        origemHistorico: orcamento.origemHistorico,
        servicoHistorico: orcamento.servicoHistorico,
        descricaoHistorico: orcamento.descricaoHistorico,
        instaladorHistoricoNome: orcamento.instalador?.nome ?? orcamento.instaladorNomeOriginal,
        indicacaoHistorica: orcamento.indicacaoHistorica,
      })),
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(doc as any)
  const uint8 = new Uint8Array(buffer)

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cliente-${cliente.nome.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
    },
  })
}
