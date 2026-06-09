import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const categoria = searchParams.get('categoria')
  const apenasAtivos = searchParams.get('ativo') !== 'false'

  const produtos = await prisma.produtoPiso.findMany({
    where: {
      ...(apenasAtivos ? { ativo: true } : {}),
      ...(categoria ? { categoria } : {}),
    },
    orderBy: [{ categoria: 'asc' }, { modelo: 'asc' }],
  })

  return NextResponse.json(produtos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { categoria, fabricante, modelo, unidade, valor, medidaPeca, rendimento, observacao } = body
  if (!categoria || !modelo || !unidade || valor == null) {
    return NextResponse.json({ error: 'Campos obrigatórios: categoria, modelo, unidade, valor' }, { status: 400 })
  }

  const produto = await prisma.produtoPiso.create({
    data: { categoria, fabricante, modelo, unidade, valor, medidaPeca, rendimento, observacao },
  })

  return NextResponse.json(produto, { status: 201 })
}
