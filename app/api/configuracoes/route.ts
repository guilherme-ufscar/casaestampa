import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const configs = await prisma.configuracaoCalculo.findMany()
    const map: Record<string, string> = {}
    for (const c of configs) map[c.chave] = c.valor
    return NextResponse.json(map)
  } catch (error) {
    console.error('[GET /api/configuracoes] erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json() as Record<string, string>

  const updates = Object.entries(body).map(([chave, valor]) =>
    prisma.configuracaoCalculo.upsert({
      where: { chave },
      update: { valor: String(valor) },
      create: { chave, valor: String(valor) },
    })
  )

  await Promise.all(updates)
  return NextResponse.json({ ok: true })
}
