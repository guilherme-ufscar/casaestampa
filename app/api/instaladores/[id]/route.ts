import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enriquecerInstaladores, salvarEspecialidadesInstalador } from '@/lib/instaladorEspecialidades'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.nome !== undefined) data.nome = body.nome
  if (body.telefone !== undefined) data.telefone = body.telefone
  if (body.ativo !== undefined) data.ativo = body.ativo

  const instalador = await prisma.instalador.update({
    where: { id: params.id },
    data,
  })

  if (body.especialidades !== undefined) {
    await salvarEspecialidadesInstalador(instalador.id, body.especialidades)
  }

  return NextResponse.json((await enriquecerInstaladores([instalador]))[0])
}
