export interface Medicao {
  largura: number
  altura: number
  m2: number
}

export interface PapelInput {
  nomeAmbiente: string
  dimensao: string
  valorRolo: number
  medicoes: Medicao[]
}

export interface ConfigsPapel {
  markup_padrao: number
  comissao_padrao: number
  rt_padrao: number
}

export interface ResultadoPapel {
  nomeAmbiente: string
  medicoes: Medicao[]
  metrosQuadrados: number
  fatorDivisao: number
  quantidadeRolos: number
  custoTotal: number
  precoComMarkup: number
  valorRt: number
  valorComissao: number
  precoFinalVenda: number
}

const FATORES: Record<string, number> = {
  '0.53x10': 4.5,
  '0.70x10': 6.5,
  '1.00x10': 9.0,
  '1.06x10': 9.0,
}

export function getFatorDimensao(dimensao: string): number {
  return FATORES[dimensao] ?? 4.5
}

export function calcularAmbientePapel(input: PapelInput, configs: ConfigsPapel): ResultadoPapel {
  const metrosQuadrados = input.medicoes.reduce((sum, m) => sum + m.largura * m.altura, 0)
  const fator = getFatorDimensao(input.dimensao)
  const quantidadeRolos = Math.ceil(metrosQuadrados / fator)
  const custoTotal = quantidadeRolos * input.valorRolo

  const precoComMarkup = custoTotal / (1 - configs.markup_padrao / 100)
  const valorRt = precoComMarkup * (configs.rt_padrao / 100)
  const valorComissao = precoComMarkup * (configs.comissao_padrao / 100)
  const precoFinalVenda = precoComMarkup + valorRt + valorComissao

  return {
    nomeAmbiente: input.nomeAmbiente,
    medicoes: input.medicoes,
    metrosQuadrados,
    fatorDivisao: fator,
    quantidadeRolos,
    custoTotal,
    precoComMarkup,
    valorRt,
    valorComissao,
    precoFinalVenda,
  }
}

export function calcularOrcamentoPapel(ambientes: PapelInput[], configs: ConfigsPapel) {
  const resultados = ambientes.map(a => calcularAmbientePapel(a, configs))
  return {
    ambientes: resultados,
    totalCusto: resultados.reduce((s, r) => s + r.custoTotal, 0),
    totalPrecoFinalVenda: resultados.reduce((s, r) => s + r.precoFinalVenda, 0),
    totalComissao: resultados.reduce((s, r) => s + r.valorComissao, 0),
    totalRt: resultados.reduce((s, r) => s + r.valorRt, 0),
  }
}
