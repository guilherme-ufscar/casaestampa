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
  const apenasAtivos = searchParams.get('ativo') !== 'false'

  const persianas = await prisma.persiana.findMany({
    where: {
      ...(apenasAtivos ? { ativo: true } : {}),
      ...(fornecedor ? { fornecedor } : {}),
      ...(tipo ? { tipo } : {}),
    },
    orderBy: [{ fornecedor: 'asc' }, { tipo: 'asc' }, { colecao: 'asc' }, { modelo: 'asc' }],
  })

  return NextResponse.json(persianas)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { fornecedor, tipo, colecao, modelo, codigo, larguraMaxima, valorM2, minM2, observacao } = body

  if (!fornecedor || !tipo || !colecao || !modelo || valorM2 == null) {
    return NextResponse.json({ error: 'Campos obrigatórios: fornecedor, tipo, colecao, modelo, valorM2' }, { status: 400 })
  }

  const persiana = await prisma.persiana.create({
    data: {
      fornecedor,
      tipo,
      colecao,
      modelo,
      codigo: codigo || null,
      larguraMaxima: larguraMaxima ? parseFloat(larguraMaxima) : null,
      valorM2: parseFloat(valorM2),
      minM2: minM2 ? parseFloat(minM2) : 1.5,
      observacao: observacao || null,
    },
  })

  return NextResponse.json(persiana, { status: 201 })
}
