export type ModeloCortina =
  | 'prega_macho'
  | 'prega_femea'
  | 'prega_americana'
  | 'prega_franzida'
  | 'prega_reta'
  | 'wave'
  | 'soft_wave'
  | 'varao'

export type TipoAbertura = 'INTEIRA' | 'CENTRAL'

export interface TecidoInput {
  id: string
  larguraMaxima: number
  valorMetro: number
}

export interface AmbienteInput {
  nomeAmbiente: string
  largura: number
  altura: number
  modeloCortina: ModeloCortina
  tipoAbertura: TipoAbertura
  tecido: TecidoInput
  blackout?: TecidoInput | null
  bainhaDesejada?: number | null
  instalacao: boolean
  trilhoAcessoriosValor?: number | null
  outrosValor?: number | null
}

export interface Configuracoes {
  markup_padrao: number
  comissao_padrao: number
  rt_padrao: number
  confeccao_valor_metro: number
  instalacao_valor_fixo: number
  fator_prega_macho: number
  fator_prega_femea: number
  fator_prega_americana: number
  fator_prega_franzida: number
  fator_prega_reta: number
  fator_wave: number
  fator_soft_wave: number
  fator_varao: number
}

export interface ResultadoAmbiente {
  nomeAmbiente: string
  quantidadeTecido: number
  quantidadeBlackout: number | null
  bainhaNaoCabe: boolean
  bainhaAlerta: string | null
  custoTecido: number
  custoBlackout: number
  custoMaterial: number
  custoConfeccao: number
  custoInstalacao: number
  custoTotal: number
  precoComMarkup: number
  valorRt: number
  valorComissao: number
  precoFinalVenda: number
  markup: number
  margem: number
}

export interface ResultadoOrcamento {
  ambientes: ResultadoAmbiente[]
  totalCusto: number
  totalPrecoFinalVenda: number
  totalComissao: number
  totalRt: number
  totalMargem: number
}

// Arredonda para cima de 0,50 em 0,50
function arredondarConsumo(valor: number): number {
  return Math.ceil(valor * 2) / 2
}

function getFatorPrega(modelo: ModeloCortina, configs: Configuracoes): number {
  const map: Record<ModeloCortina, number> = {
    prega_macho: configs.fator_prega_macho,
    prega_femea: configs.fator_prega_femea,
    prega_americana: configs.fator_prega_americana,
    prega_franzida: configs.fator_prega_franzida,
    prega_reta: configs.fator_prega_reta,
    wave: configs.fator_wave,
    soft_wave: configs.fator_soft_wave,
    varao: configs.fator_varao,
  }
  return map[modelo]
}

function calcularConsumoTecido(
  largura: number,
  altura: number,
  bainhaDesejada: number | null | undefined,
  tipoAbertura: TipoAbertura,
  fator: number,
  larguraMaximaTecido: number
): { quantidade: number; naoCabe: boolean; alerta: string | null } {
  const larguraComConsumo = largura * fator
  const consumoBase = arredondarConsumo(larguraComConsumo)

  const larguraUtilReal = larguraMaximaTecido - 0.1
  const sobraParaBainha = larguraUtilReal - altura
  const bainha = bainhaDesejada ?? 0

  let consumoFinal = consumoBase
  let naoCabe = false
  let alerta: string | null = null

  if (bainha > sobraParaBainha) {
    naoCabe = true
    if (tipoAbertura === 'INTEIRA') {
      consumoFinal = consumoBase * 2
      alerta = `A bainha desejada (${bainha.toFixed(2)}m) excede a sobra disponível (${sobraParaBainha.toFixed(2)}m). Será adicionado tecido extra — consumo dobrado para ${consumoFinal.toFixed(2)}m.`
    } else {
      consumoFinal = consumoBase * 1.5
      alerta = `A bainha desejada (${bainha.toFixed(2)}m) excede a sobra disponível (${sobraParaBainha.toFixed(2)}m). Será adicionado tecido extra — consumo aumentado para ${consumoFinal.toFixed(2)}m.`
    }
  }

  return { quantidade: consumoFinal, naoCabe, alerta }
}

export function calcularAmbiente(
  ambiente: AmbienteInput,
  configs: Configuracoes
): ResultadoAmbiente {
  const fator = getFatorPrega(ambiente.modeloCortina, configs)

  const tecidoCalc = calcularConsumoTecido(
    ambiente.largura,
    ambiente.altura,
    ambiente.bainhaDesejada,
    ambiente.tipoAbertura,
    fator,
    ambiente.tecido.larguraMaxima
  )

  let blackoutCalc: { quantidade: number; naoCabe: boolean; alerta: string | null } | null = null
  if (ambiente.blackout) {
    blackoutCalc = calcularConsumoTecido(
      ambiente.largura,
      ambiente.altura,
      ambiente.bainhaDesejada,
      ambiente.tipoAbertura,
      configs.fator_prega_reta, // blackout sempre fator reta
      ambiente.blackout.larguraMaxima
    )
  }

  const custoTecido = tecidoCalc.quantidade * ambiente.tecido.valorMetro
  const custoBlackout = blackoutCalc && ambiente.blackout
    ? blackoutCalc.quantidade * ambiente.blackout.valorMetro
    : 0
  const custoTrilho = ambiente.trilhoAcessoriosValor ?? 0
  const custoMaterial = custoTecido + custoBlackout + custoTrilho
  const custoConfeccao = tecidoCalc.quantidade * configs.confeccao_valor_metro
  const custoInstalacao = ambiente.instalacao ? configs.instalacao_valor_fixo : 0
  const outros = ambiente.outrosValor ?? 0
  const custoTotal = custoMaterial + custoConfeccao + custoInstalacao + outros

  const markup = configs.markup_padrao
  const precoComMarkup = custoTotal / (1 - markup / 100)
  const valorRt = precoComMarkup * (configs.rt_padrao / 100)
  const valorComissao = precoComMarkup * (configs.comissao_padrao / 100)
  const precoFinalVenda = precoComMarkup + valorRt + valorComissao
  const margem = precoComMarkup - custoTotal

  return {
    nomeAmbiente: ambiente.nomeAmbiente,
    quantidadeTecido: tecidoCalc.quantidade,
    quantidadeBlackout: blackoutCalc?.quantidade ?? null,
    bainhaNaoCabe: tecidoCalc.naoCabe || (blackoutCalc?.naoCabe ?? false),
    bainhaAlerta: tecidoCalc.alerta ?? blackoutCalc?.alerta ?? null,
    custoTecido,
    custoBlackout,
    custoMaterial,
    custoConfeccao,
    custoInstalacao,
    custoTotal,
    precoComMarkup,
    valorRt,
    valorComissao,
    precoFinalVenda,
    markup,
    margem,
  }
}

export function calcularOrcamento(
  ambientes: AmbienteInput[],
  configs: Configuracoes
): ResultadoOrcamento {
  const resultados = ambientes.map(a => calcularAmbiente(a, configs))

  return {
    ambientes: resultados,
    totalCusto: resultados.reduce((s, r) => s + r.custoTotal, 0),
    totalPrecoFinalVenda: resultados.reduce((s, r) => s + r.precoFinalVenda, 0),
    totalComissao: resultados.reduce((s, r) => s + r.valorComissao, 0),
    totalRt: resultados.reduce((s, r) => s + r.valorRt, 0),
    totalMargem: resultados.reduce((s, r) => s + r.margem, 0),
  }
}
