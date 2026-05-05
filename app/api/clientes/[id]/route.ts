import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      orcamentos: {
        include: { vendedor: { select: { nome: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!cliente) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(cliente)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { nome, telefone, email, endereco, arquiteto } = body

  const cliente = await prisma.cliente.update({
    where: { id: params.id },
    data: { nome, telefone, email, endereco, arquiteto },
  })

  return NextResponse.json(cliente)
}
