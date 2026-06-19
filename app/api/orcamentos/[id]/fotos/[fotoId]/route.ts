import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; fotoId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await prisma.fotoOrcamento.deleteMany({
    where: { id: params.fotoId, orcamentoId: params.id },
  })

  return NextResponse.json({ ok: true })
}
