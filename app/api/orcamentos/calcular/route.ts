import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calcularOrcamento, AmbienteInput, Configuracoes } from '@/lib/calculoCortina'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { ambientes } = body as { ambientes: AmbienteInput[] }

  if (!ambientes?.length) {
    return NextResponse.json({ error: 'Nenhum ambiente informado' }, { status: 400 })
  }

  const configsRaw = await prisma.configuracaoCalculo.findMany()
  const configMap: Record<string, string> = {}
  for (const c of configsRaw) configMap[c.chave] = c.valor

  const configs: Configuracoes = {
    markup_padrao: parseFloat(configMap.markup_padrao ?? '40'),
    comissao_padrao: parseFloat(configMap.comissao_padrao ?? '8'),
    rt_padrao: parseFloat(configMap.rt_padrao ?? '5'),
    confeccao_prega_macho: parseFloat(configMap.confeccao_prega_macho ?? '27'),
    confeccao_prega_femea: parseFloat(configMap.confeccao_prega_femea ?? '27'),
    confeccao_prega_americana: parseFloat(configMap.confeccao_prega_americana ?? '30'),
    confeccao_prega_franzida: parseFloat(configMap.confeccao_prega_franzida ?? '27'),
    confeccao_prega_reta: parseFloat(configMap.confeccao_prega_reta ?? '24'),
    confeccao_wave: parseFloat(configMap.confeccao_wave ?? '38'),
    confeccao_soft_wave: parseFloat(configMap.confeccao_soft_wave ?? '30'),
    confeccao_varao: parseFloat(configMap.confeccao_varao ?? '39'),
    instalacao_valor_m2: parseFloat(configMap.instalacao_valor_m2 ?? '35'),
    fator_prega_macho: parseFloat(configMap.fator_prega_macho ?? '3'),
    fator_prega_femea: parseFloat(configMap.fator_prega_femea ?? '2.5'),
    fator_prega_americana: parseFloat(configMap.fator_prega_americana ?? '2.5'),
    fator_prega_franzida: parseFloat(configMap.fator_prega_franzida ?? '3'),
    fator_prega_reta: parseFloat(configMap.fator_prega_reta ?? '1'),
    fator_wave: parseFloat(configMap.fator_wave ?? '2'),
    fator_soft_wave: parseFloat(configMap.fator_soft_wave ?? '2'),
    fator_varao: parseFloat(configMap.fator_varao ?? '1.5'),
  }

  const resultado = calcularOrcamento(ambientes, configs)
  const isAdmin = session.user.role === 'ADMIN'

  if (!isAdmin) {
    return NextResponse.json({
      ambientes: resultado.ambientes.map(a => ({
        nomeAmbiente: a.nomeAmbiente,
        quantidadeTecido: a.quantidadeTecido,
        quantidadeBlackout: a.quantidadeBlackout,
        precisaTecidoExtra: a.precisaTecidoExtra,
        precisaBlackoutExtra: a.precisaBlackoutExtra,
        tecidoExtraAplicado: a.tecidoExtraAplicado,
        blackoutExtraAplicado: a.blackoutExtraAplicado,
        bainhaDesejada: a.bainhaDesejada,
        bainhaDisponivel: a.bainhaDisponivel,
        bainhaAlerta: a.bainhaAlerta,
        precoFinalVenda: a.precoFinalVenda,
      })),
      totalPrecoFinalVenda: resultado.totalPrecoFinalVenda,
    })
  }

  return NextResponse.json(resultado)
}
