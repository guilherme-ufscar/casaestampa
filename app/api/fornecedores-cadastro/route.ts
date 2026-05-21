import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const fornecedores = await prisma.fornecedorCadastro.findMany({ orderBy: { nomeEmpresa: 'asc' } })
  return NextResponse.json(fornecedores)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { nomeEmpresa, vendedor, telefone, email, endereco, contaBancaria, pix, observacoes } = body

  if (!nomeEmpresa) {
    return NextResponse.json({ error: 'Nome da empresa é obrigatório' }, { status: 400 })
  }

  const fornecedor = await prisma.fornecedorCadastro.create({
    data: { nomeEmpresa, vendedor, telefone, email, endereco, contaBancaria, pix, observacoes },
  })

  return NextResponse.json(fornecedor, { status: 201 })
}
