import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enriquecerInstaladores, salvarEspecialidadesInstalador } from '@/lib/instaladorEspecialidades'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(req.url)
  const incluirInativos = searchParams.get('incluirInativos') === 'true' && session?.user.role === 'ADMIN'
  const tipo = searchParams.get('tipo')

  const instaladores = await prisma.instalador.findMany({
    where: incluirInativos ? {} : { ativo: true },
    orderBy: { nome: 'asc' },
  })

  const enriquecidos = await enriquecerInstaladores(instaladores)
  const filtrados = tipo
    ? enriquecidos.filter(instalador => {
        const tipos = tipo.split(',')
        return tipos.some(t => instalador.especialidades.includes(t as never))
      })
    : enriquecidos

  return NextResponse.json(filtrados)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { nome, telefone, especialidades } = await req.json()
  if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const instalador = await prisma.instalador.create({
    data: { nome, telefone: telefone ?? null },
  })

  if (especialidades !== undefined) {
    await salvarEspecialidadesInstalador(instalador.id, especialidades)
  }

  return NextResponse.json((await enriquecerInstaladores([instalador]))[0], { status: 201 })
}
