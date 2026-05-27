import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import OrcamentoPDFDoc, { OrcamentoPDF, AmbientePDF, AmbientePapelPDF } from '@/lib/OrcamentoPDFDoc'
import React from 'react'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(_req.url)
  const mostrarModelo = searchParams.get('modelo') !== '0'
  const mostrarTecido = searchParams.get('tecido') !== '0'
  const mostrarPrega = searchParams.get('prega') !== '0'
  const mostrarBainha = searchParams.get('bainha') !== '0'
  const mostrarMedida = searchParams.get('medida') !== '0'
  const mostrarPapelMetragem = searchParams.get('papelMetragem') !== '0'
  const mostrarPapelRolos = searchParams.get('papelRolos') !== '0'

  const orc = await prisma.orcamento.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      vendedor: { select: { nome: true } },
      ambientes: {
        include: {
          tecido: true,
          blackout: true,
        },
      },
      ambientesPapel: {
        include: {
          papel: true,
        },
      },
    },
  })

  if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const configsRaw = await prisma.configuracaoCalculo.findMany()
  const cfg: Record<string, string> = {}
  for (const c of configsRaw) cfg[c.chave] = c.valor

  const ambientesPDF: AmbientePDF[] = orc.ambientes.map(a => ({
    nomeAmbiente: a.nomeAmbiente,
    largura: Number(a.largura),
    altura: Number(a.altura),
    modeloCortina: a.modeloCortina,
    trilhoTipo: a.trilhoTipo,
    tipoAbertura: a.tipoAbertura,
    tipoAberturaBlackout: a.tipoAberturaBlackout ?? a.tipoAbertura,
    bainhaDesejada: a.bainhaDesejada ? Number(a.bainhaDesejada) : null,
    tecidoNome: a.tecido.nome,
    quantidadeTecido: Number(a.quantidadeTecido ?? 0),
    blackoutNome: a.blackout?.nome ?? null,
    quantidadeBlackout: a.quantidadeBlackout ? Number(a.quantidadeBlackout) : null,
    instalacao: a.instalacao,
    precoFinalVenda: Number(a.precoFinalVenda ?? 0),
  }))

  const ambientesPapelPDF: AmbientePapelPDF[] = orc.ambientesPapel.map(a => ({
    nomeAmbiente: a.nomeAmbiente,
    album: a.papel.album,
    referencia: a.referenciaDigitada || a.papel.referencia || '',
    metrosQuadrados: Number(a.metrosQuadrados ?? 0),
    quantidadeRolos: a.quantidadeRolos ?? 0,
    precoFinalVenda: Number(a.precoFinalVenda ?? 0),
  }))

  const orcPDF: OrcamentoPDF = {
    numero: orc.numero,
    createdAt: orc.createdAt,
    vendedorNome: orc.vendedor.nome,
    clienteNome: orc.cliente?.nome ?? null,
    clienteTelefone: orc.cliente?.telefone ?? null,
    clienteEmail: orc.cliente?.email ?? null,
    clienteEndereco: orc.cliente?.endereco ?? null,
    clienteArquiteto: orc.cliente?.arquiteto ?? null,
    ambientes: ambientesPDF,
    ambientesPapel: ambientesPapelPDF,
    precoFinalTotal: Number(orc.precoFinalTotal ?? 0),
    condicoesComerciais: cfg.condicoes_comerciais,
    telefoneEmpresa: cfg.telefone_empresa,
    mostrarMedidas: mostrarMedida,
    mostrarModelo: mostrarModelo,
    mostrarTecido: mostrarTecido,
    mostrarPrega: mostrarPrega,
    mostrarBainha: mostrarBainha,
    mostrarPapelMetragem: mostrarPapelMetragem,
    mostrarPapelRolos: mostrarPapelRolos,
  }

  const doc = React.createElement(OrcamentoPDFDoc, { orc: orcPDF })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(doc as any)
  const uint8 = new Uint8Array(buffer)

  const numero = String(orc.numero).padStart(4, '0')
  return new NextResponse(uint8, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Casa-Estampa-Orcamento-${numero}.pdf"`,
    },
  })
}
