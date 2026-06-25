import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { status } = await req.json()
  if (!status) return NextResponse.json({ error: 'Status obrigatório' }, { status: 400 })

  const pedido = await prisma.orcamento.findUnique({ where: { id: params.id } })
  if (!pedido) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  if (session.user.role === 'VENDEDOR' && pedido.vendedorId !== session.user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  // Somente admin pode aprovar um orçamento
  if (status === 'aprovado' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Somente o administrador pode aprovar orçamentos' }, { status: 403 })
  }

  const [updated] = await prisma.$transaction([
    prisma.orcamento.update({ where: { id: params.id }, data: { status } }),
    prisma.logHistorico.create({
      data: {
        orcamentoId: params.id,
        usuarioId: session.user.id,
        acao: 'status_alterado',
        detalhes: { statusAnterior: pedido.status, statusNovo: status },
      },
    }),
  ])

  return NextResponse.json(updated)
}
