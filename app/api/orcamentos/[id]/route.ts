import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const orc = await prisma.orcamento.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      vendedor: { select: { nome: true, email: true } },
      ambientes: {
        include: { tecido: true, blackout: true, trilhoVarao: true },
      },
    },
  })

  if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  if (session.user.role === 'VENDEDOR' && orc.vendedorId !== session.user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  return NextResponse.json(orc)
}
