import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { atualizarArquiteto, listarArquitetos } from '@/lib/arquitetosStore'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const arquitetos = await listarArquitetos()
  const arquiteto = arquitetos.find(item => item.id === params.id)
  if (!arquiteto) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(arquiteto)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const arquiteto = await atualizarArquiteto(params.id, {
    nome: body.nome,
    telefone: body.telefone,
    email: body.email,
    cpf: body.cpf,
    endereco: body.endereco,
    observacoes: body.observacoes,
    ativo: body.ativo,
  })

  if (!arquiteto) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(arquiteto)
}
