import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fornecedor = searchParams.get('fornecedor')
  const tipo = searchParams.get('tipo')

  const items = await prisma.acessorioPersiana.findMany({
    where: {
      ativo: true,
      ...(fornecedor ? { fornecedor } : {}),
      ...(tipo ? { tipo } : {}),
    },
    orderBy: [{ fornecedor: 'asc' }, { tipo: 'asc' }, { nome: 'asc' }],
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { fornecedor, tipo, nome, valorMetro, observacao } = body

  const item = await prisma.acessorioPersiana.create({
    data: {
      fornecedor,
      tipo,
      nome,
      valorMetro: parseFloat(valorMetro),
      observacao: observacao || null,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
