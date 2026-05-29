import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fornecedor = searchParams.get('fornecedor')

  const items = await prisma.controleRemotoPersiana.findMany({
    where: {
      ativo: true,
      ...(fornecedor ? { fornecedor } : {}),
    },
    orderBy: [{ fornecedor: 'asc' }, { nome: 'asc' }],
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const item = await prisma.controleRemotoPersiana.create({
    data: {
      fornecedor: body.fornecedor,
      nome: body.nome,
      canais: body.canais ? parseInt(body.canais) : null,
      valor: parseFloat(body.valor),
    },
  })
  return NextResponse.json(item, { status: 201 })
}
