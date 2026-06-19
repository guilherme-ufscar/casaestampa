import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const clientes = await prisma.cliente.findMany({
    select: {
      id: true,
      nome: true,
      telefone: true,
      endereco: true,
      bairro: true,
      lat: true,
      lng: true,
      orcamentos: {
        select: {
          id: true,
          numero: true,
          status: true,
          precoFinalTotal: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(clientes)
}
