import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const papeis = await prisma.papelParede.findMany({ orderBy: [{ categoria: 'asc' }, { album: 'asc' }, { referencia: 'asc' }] })
    const normalized = papeis.map(p => ({ ...p, valorRolo: Number(p.valorRolo) }))
    return NextResponse.json(normalized)
  } catch (e) {
    console.error('[GET /api/papeis-parede]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { album, referencia, dimensao, valorRolo, categoria } = body

  if (!album || !dimensao || !valorRolo) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const papel = await prisma.papelParede.create({
    data: { album, referencia: referencia || null, dimensao, valorRolo: parseFloat(valorRolo), categoria: categoria || null },
  })

  return NextResponse.json(papel, { status: 201 })
}
