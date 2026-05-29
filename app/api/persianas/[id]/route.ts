import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { fornecedor, tipo, colecao, modelo, codigo, larguraMaxima, valorM2, minM2, observacao, ativo } = body

  const persiana = await prisma.persiana.update({
    where: { id: params.id },
    data: {
      ...(fornecedor !== undefined ? { fornecedor } : {}),
      ...(tipo !== undefined ? { tipo } : {}),
      ...(colecao !== undefined ? { colecao } : {}),
      ...(modelo !== undefined ? { modelo } : {}),
      ...(codigo !== undefined ? { codigo: codigo || null } : {}),
      ...(larguraMaxima !== undefined ? { larguraMaxima: larguraMaxima ? parseFloat(larguraMaxima) : null } : {}),
      ...(valorM2 !== undefined ? { valorM2: parseFloat(valorM2) } : {}),
      ...(minM2 !== undefined ? { minM2: parseFloat(minM2) } : {}),
      ...(observacao !== undefined ? { observacao: observacao || null } : {}),
      ...(ativo !== undefined ? { ativo } : {}),
    },
  })

  return NextResponse.json(persiana)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  await prisma.persiana.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
