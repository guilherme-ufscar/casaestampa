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
  tecidoExtra: boolean
  instalacao: boolean
  trilhoValorUnitario?: number | null
  outrosValor?: number | null
}

export interface Configuracoes {
  markup_padrao: number
  comissao_padrao: number
  rt_padrao: number
  // Confecção por m² por modelo (Costureira Cici)
  confeccao_prega_macho: number
  confeccao_prega_femea: number
  confeccao_prega_americana: number
  confeccao_prega_franzida: number
  confeccao_prega_reta: number
  confeccao_wave: number
  confeccao_soft_wave: number
  confeccao_varao: number
  // Instalação por m²
  instalacao_valor_m2: number
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
  precisaTecidoExtra: boolean
  bainhaDisponivel: number
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
  tipoAbertura: TipoAbertura,
  fator: number,
  larguraMaximaTecido: number,
  forcarTecidoExtra: boolean = false
): { quantidade: number; precisaTecidoExtra: boolean; bainhaDisponivel: number; alerta: string | null } {
  const larguraComConsumo = largura * fator
  const consumoBase = arredondarConsumo(larguraComConsumo)

  const larguraUtilReal = larguraMaximaTecido - 0.1
  const alturaReal = altura + 0.1  // cabeça sempre +0,10
  const sobraParaBainha = larguraUtilReal - alturaReal
  const bainhaDisponivel = sobraParaBainha / 2  // bainha dupla

  const precisaTecidoExtra = bainhaDisponivel < 0.18

  let consumoFinal = consumoBase
  let alerta: string | null = null

  if (forcarTecidoExtra || precisaTecidoExtra) {
    if (tipoAbertura === 'INTEIRA') {
      consumoFinal = arredondarConsumo(consumoBase * 2)
    } else {
      consumoFinal = arredondarConsumo(consumoBase * 1.5)
    }
    if (precisaTecidoExtra) {
      alerta = `Bainha disponível (${bainhaDisponivel.toFixed(2)}m) abaixo de 0,18m — tecido extra ${forcarTecidoExtra ? 'adicionado' : 'necessário'}: ${consumoFinal.toFixed(2)}m.`
    }
  }

  return { quantidade: consumoFinal, precisaTecidoExtra, bainhaDisponivel, alerta }
}

export function calcularAmbiente(
  ambiente: AmbienteInput,
  configs: Configuracoes
): ResultadoAmbiente {
  const fator = getFatorPrega(ambiente.modeloCortina, configs)

  const tecidoCalc = calcularConsumoTecido(
    ambiente.largura,
    ambiente.altura,
    ambiente.tipoAbertura,
    fator,
    ambiente.tecido.larguraMaxima,
    ambiente.tecidoExtra
  )

  let blackoutCalc: ReturnType<typeof calcularConsumoTecido> | null = null
  if (ambiente.blackout) {
    blackoutCalc = calcularConsumoTecido(
      ambiente.largura,
      ambiente.altura,
      ambiente.tipoAbertura,
      configs.fator_prega_reta,
      ambiente.blackout.larguraMaxima,
      ambiente.tecidoExtra
    )
  }

  const custoTecido = tecidoCalc.quantidade * ambiente.tecido.valorMetro
  const custoBlackout = blackoutCalc && ambiente.blackout
    ? blackoutCalc.quantidade * ambiente.blackout.valorMetro
    : 0
  const comprimentoTrilho = arredondarConsumo(ambiente.largura)
  const custoTrilho = ambiente.trilhoValorUnitario ? comprimentoTrilho * ambiente.trilhoValorUnitario : 0
  const custoMaterial = custoTecido + custoBlackout + custoTrilho

  const confeccaoMap: Record<ModeloCortina, number> = {
    prega_macho: configs.confeccao_prega_macho,
    prega_femea: configs.confeccao_prega_femea,
    prega_americana: configs.confeccao_prega_americana,
    prega_franzida: configs.confeccao_prega_franzida,
    prega_reta: configs.confeccao_prega_reta,
    wave: configs.confeccao_wave,
    soft_wave: configs.confeccao_soft_wave,
    varao: configs.confeccao_varao,
  }
  const m2 = ambiente.largura * ambiente.altura
  const custoConfeccao = m2 * confeccaoMap[ambiente.modeloCortina]

  const custoInstalacao = ambiente.instalacao ? m2 * configs.instalacao_valor_m2 : 0
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
    precisaTecidoExtra: tecidoCalc.precisaTecidoExtra || (blackoutCalc?.precisaTecidoExtra ?? false),
    bainhaDisponivel: tecidoCalc.bainhaDisponivel,
    bainhaNaoCabe: tecidoCalc.precisaTecidoExtra || (blackoutCalc?.precisaTecidoExtra ?? false),
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
