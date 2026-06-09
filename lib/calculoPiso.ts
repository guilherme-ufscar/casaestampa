export type TipoPiso = 'LAMINADO' | 'VINILICO'

export interface ConfigsPiso {
  markup_piso: number
  comissao_padrao: number
  rt_padrao: number
  instalacao_piso_laminado_m2: number
  instalacao_piso_vinilico_m2: number
  cola_vinilica_rendimento_m2: number // m² por galão (padrão 12)
  massa_niveladora_rendimento_m2: number // m² por saco (padrão 10)
}

export interface MedicaoPiso {
  largura: number
  comprimento: number
}

export interface ItemLinear {
  nome?: string | null
  valorPc: number
  medidaPeca: number // comprimento padrão da peça (ex 2.10)
  medidas: number[]
  comPerda?: boolean // aplica +2% (rodapé)
}

export interface ItemMetroLinear {
  nome?: string | null
  valorMetro: number
  medidas: number[]
}

export interface PisoInput {
  nomeAmbiente: string
  tipoPiso: TipoPiso
  fabricante?: string | null
  pisoModelo: string
  pisoValorM2: number
  medicoes: MedicaoPiso[]
  // Laminado
  manta?: { nome?: string | null; valorM2: number } | null
  perfis?: ItemLinear[] // redutor, transição, cantoneira, outros (com tipo)
  prego?: { nome?: string | null; valorPct: number; pacotes: number } | null
  // Vinílico
  cola?: { nome?: string | null; valorGalao: number } | null
  massa?: { nome?: string | null; valorSaco: number; rendimentoM2?: number | null } | null
  acabamentos?: ItemMetroLinear[]
  // Comum
  rodape?: ItemLinear | null
  outrosValor?: number | null
  instalacao: boolean
  frete: number
}

export interface ResultadoPiso {
  nomeAmbiente: string
  tipoPiso: TipoPiso
  pisoModelo: string
  fabricante: string | null
  areaTotalBruta: number
  areaComPerda: number
  areaManta: number
  rodapeNome: string | null
  rodapePecas: number
  custoPiso: number
  custoManta: number
  custoRodape: number
  custoPerfis: number
  custoPrego: number
  custoCola: number
  custoMassa: number
  custoAcabamentos: number
  custoOutros: number
  custoInstalacao: number
  frete: number
  custoTotal: number
  precoComMarkup: number
  valorRt: number
  valorComissao: number
  precoFinalVenda: number
  margem: number
  markup: number
}

function arredCima(v: number): number {
  return Math.ceil(v - 1e-9)
}

function somaMedidas(medidas: number[]): number {
  return medidas.reduce((s, m) => s + (Number.isFinite(m) && m > 0 ? m : 0), 0)
}

function calcLinear(item: ItemLinear): { pecas: number; custo: number } {
  let total = somaMedidas(item.medidas)
  if (item.comPerda) total = total * 1.02
  const peca = item.medidaPeca && item.medidaPeca > 0 ? item.medidaPeca : 2.1
  const pecas = total > 0 ? arredCima(total / peca) : 0
  return { pecas, custo: pecas * item.valorPc }
}

export function calcularAmbientePiso(input: PisoInput, cfg: ConfigsPiso): ResultadoPiso {
  const areaTotalBruta = input.medicoes.reduce(
    (s, m) => s + (Number.isFinite(m.largura) && Number.isFinite(m.comprimento) ? m.largura * m.comprimento : 0),
    0
  )
  const areaComPerda = areaTotalBruta * 1.1
  const areaManta = areaTotalBruta * 1.03

  const custoPiso = areaComPerda * input.pisoValorM2

  // Manta (somente laminado)
  const custoManta = input.tipoPiso === 'LAMINADO' && input.manta ? areaManta * input.manta.valorM2 : 0

  // Rodapé
  let custoRodape = 0
  let rodapePecas = 0
  if (input.rodape) {
    const r = calcLinear({ ...input.rodape, comPerda: true })
    custoRodape = r.custo
    rodapePecas = r.pecas
  }

  // Perfis (laminado)
  let custoPerfis = 0
  if (input.tipoPiso === 'LAMINADO' && input.perfis) {
    for (const p of input.perfis) custoPerfis += calcLinear(p).custo
  }

  // Prego (laminado)
  const custoPrego = input.tipoPiso === 'LAMINADO' && input.prego ? input.prego.pacotes * input.prego.valorPct : 0

  // Cola (vinílico) — automática: 1 galão / 12 m² (área bruta)
  let custoCola = 0
  if (input.tipoPiso === 'VINILICO' && input.cola) {
    const rendimento = cfg.cola_vinilica_rendimento_m2 > 0 ? cfg.cola_vinilica_rendimento_m2 : 12
    const galoes = areaTotalBruta > 0 ? arredCima(areaTotalBruta / rendimento) : 0
    custoCola = galoes * input.cola.valorGalao
  }

  // Massa niveladora (vinílico) — 1 saco / 10 m² (área bruta)
  let custoMassa = 0
  if (input.tipoPiso === 'VINILICO' && input.massa) {
    const rendimento = (input.massa.rendimentoM2 && input.massa.rendimentoM2 > 0)
      ? input.massa.rendimentoM2
      : (cfg.massa_niveladora_rendimento_m2 > 0 ? cfg.massa_niveladora_rendimento_m2 : 10)
    const sacos = areaTotalBruta > 0 ? arredCima(areaTotalBruta / rendimento) : 0
    custoMassa = sacos * input.massa.valorSaco
  }

  // Acabamentos (chapas de alumínio — vinílico) — por metro linear
  let custoAcabamentos = 0
  if (input.tipoPiso === 'VINILICO' && input.acabamentos) {
    for (const a of input.acabamentos) custoAcabamentos += somaMedidas(a.medidas) * a.valorMetro
  }

  const custoOutros = input.outrosValor ?? 0

  const instalacaoM2 = input.tipoPiso === 'LAMINADO' ? cfg.instalacao_piso_laminado_m2 : cfg.instalacao_piso_vinilico_m2
  const custoInstalacao = input.instalacao ? areaTotalBruta * instalacaoM2 : 0

  const frete = input.frete ?? 0

  const custoTotal =
    custoPiso + custoManta + custoRodape + custoPerfis + custoPrego +
    custoCola + custoMassa + custoAcabamentos + custoOutros + custoInstalacao + frete

  const markup = cfg.markup_piso
  const precoComMarkup = markup < 100 ? custoTotal / (1 - markup / 100) : custoTotal
  const valorRt = precoComMarkup * (cfg.rt_padrao / 100)
  const valorComissao = precoComMarkup * (cfg.comissao_padrao / 100)
  const precoFinalVenda = precoComMarkup + valorRt + valorComissao
  const margem = precoComMarkup - custoTotal

  return {
    nomeAmbiente: input.nomeAmbiente,
    tipoPiso: input.tipoPiso,
    pisoModelo: input.pisoModelo,
    fabricante: input.fabricante ?? null,
    areaTotalBruta,
    areaComPerda,
    areaManta,
    rodapeNome: input.rodape?.nome ?? null,
    rodapePecas,
    custoPiso,
    custoManta,
    custoRodape,
    custoPerfis,
    custoPrego,
    custoCola,
    custoMassa,
    custoAcabamentos,
    custoOutros,
    custoInstalacao,
    frete,
    custoTotal,
    precoComMarkup,
    valorRt,
    valorComissao,
    precoFinalVenda,
    margem,
    markup,
  }
}

export function calcularOrcamentoPiso(ambientes: PisoInput[], cfg: ConfigsPiso) {
  const resultados = ambientes.map(a => calcularAmbientePiso(a, cfg))
  return {
    ambientes: resultados,
    totalCusto: resultados.reduce((s, r) => s + r.custoTotal, 0),
    totalPrecoFinalVenda: resultados.reduce((s, r) => s + r.precoFinalVenda, 0),
    totalComissao: resultados.reduce((s, r) => s + r.valorComissao, 0),
    totalRt: resultados.reduce((s, r) => s + r.valorRt, 0),
    totalMargem: resultados.reduce((s, r) => s + r.margem, 0),
  }
}
