import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const tecidos = await prisma.tecido.findMany({ orderBy: { nome: 'asc' } })
    return NextResponse.json(tecidos)
  } catch (e) {
    console.error('[GET /api/tecidos]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { nome, larguraMaxima, valorMetro, tipo, ativo } = body

  if (!nome || !larguraMaxima || !valorMetro || !tipo) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const tecido = await prisma.tecido.create({
    data: { nome, larguraMaxima: parseFloat(larguraMaxima), valorMetro: parseFloat(valorMetro), tipo, ativo: ativo ?? true },
  })

  return NextResponse.json(tecido, { status: 201 })
}
