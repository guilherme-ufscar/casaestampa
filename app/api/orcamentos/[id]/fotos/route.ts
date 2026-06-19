import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const fotos = await prisma.fotoOrcamento.findMany({
    where: { orcamentoId: params.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(fotos)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { imagem, nomeAmbiente, observacao } = await req.json()
  if (!imagem) return NextResponse.json({ error: 'Imagem obrigatória' }, { status: 400 })

  const foto = await prisma.fotoOrcamento.create({
    data: { orcamentoId: params.id, imagem, nomeAmbiente: nomeAmbiente || null, observacao: observacao || null },
  })

  return NextResponse.json(foto, { status: 201 })
}
