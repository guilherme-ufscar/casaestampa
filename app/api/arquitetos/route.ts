import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { criarArquiteto, listarArquitetos } from '@/lib/arquitetosStore'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim().toLowerCase()
  const incluirInativos = searchParams.get('incluirInativos') === 'true'

  const arquitetos = await listarArquitetos()
  const filtrados = arquitetos.filter(arquiteto => {
    if (!incluirInativos && !arquiteto.ativo) return false
    if (!q) return true
    return arquiteto.nome.toLowerCase().includes(q)
      || arquiteto.telefone.toLowerCase().includes(q)
      || arquiteto.email.toLowerCase().includes(q)
  })

  return NextResponse.json(filtrados)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const nome = String(body.nome ?? '').trim()
  if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const arquiteto = await criarArquiteto({
    nome,
    telefone: String(body.telefone ?? ''),
    email: String(body.email ?? ''),
    cpf: String(body.cpf ?? ''),
    endereco: String(body.endereco ?? ''),
    observacoes: String(body.observacoes ?? ''),
    ativo: body.ativo !== false,
  })

  return NextResponse.json(arquiteto, { status: 201 })
}
