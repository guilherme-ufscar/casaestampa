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
  tipoAberturaBlackout?: TipoAbertura | null
  tecido: TecidoInput
  blackout?: TecidoInput | null
  tecidoExtra: boolean
  blackoutExtra?: boolean
  bainhaDesejada?: number | null
  instalacao: boolean
  trilhoValorUnitario?: number | null
  outrosValor?: number | null
}

export interface Configuracoes {
  markup_padrao: number
  comissao_padrao: number
  rt_padrao: number
  confeccao_prega_macho: number
  confeccao_prega_femea: number
  confeccao_prega_americana: number
  confeccao_prega_franzida: number
  confeccao_prega_reta: number
  confeccao_wave: number
  confeccao_soft_wave: number
  confeccao_varao: number
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
  precisaBlackoutExtra: boolean
  tecidoExtraAplicado: boolean
  blackoutExtraAplicado: boolean
  bainhaDesejada: number
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

const CABECA_PADRAO = 0.1
const BAINHA_PADRAO = 0.2
const LIMITE_BAINHA_UTIL = 0.18

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

function aplicarTecidoExtra(quantidadeBase: number, tipoAbertura: TipoAbertura): number {
  return arredondarConsumo(tipoAbertura === 'INTEIRA' ? quantidadeBase * 2 : quantidadeBase * 1.5)
}

function calcularConsumoPrincipal(
  largura: number,
  altura: number,
  tipoAbertura: TipoAbertura,
  fator: number,
  larguraMaximaTecido: number,
  forcarTecidoExtra: boolean = false,
  bainhaDesejada: number = BAINHA_PADRAO
): { quantidade: number; quantidadeBase: number; precisaExtra: boolean; extraAplicado: boolean; bainhaDisponivel: number; alerta: string | null } {
  const quantidadeBase = arredondarConsumo(largura * fator)
  const alturaComCabeca = altura + CABECA_PADRAO
  const sobraParaBainha = larguraMaximaTecido - alturaComCabeca
  const bainhaDisponivel = sobraParaBainha / 2
  const precisaExtra = bainhaDisponivel < LIMITE_BAINHA_UTIL
  const extraAplicado = forcarTecidoExtra || precisaExtra
  const quantidade = extraAplicado ? aplicarTecidoExtra(quantidadeBase, tipoAbertura) : quantidadeBase

  const alerta = precisaExtra
    ? `Bainha útil de ${bainhaDisponivel.toFixed(2)}m abaixo do mínimo de ${LIMITE_BAINHA_UTIL.toFixed(2)}m. Considerando cabeça de ${CABECA_PADRAO.toFixed(2)}m e bainha padrão de ${bainhaDesejada.toFixed(2)}m.`
    : null

  return { quantidade, quantidadeBase, precisaExtra, extraAplicado, bainhaDisponivel, alerta }
}

function calcularConsumoBlackout(
  largura: number,
  altura: number,
  tipoAbertura: TipoAbertura,
  fator: number,
  larguraMaximaTecido: number,
  forcarTecidoExtra: boolean = false
): { quantidade: number; quantidadeBase: number; precisaExtra: boolean; extraAplicado: boolean; alerta: string | null } {
  const quantidadeBase = arredondarConsumo(largura * fator)
  const alturaComCabeca = altura + CABECA_PADRAO
  const precisaExtra = alturaComCabeca > larguraMaximaTecido
  const extraAplicado = forcarTecidoExtra || precisaExtra
  const quantidade = extraAplicado ? aplicarTecidoExtra(quantidadeBase, tipoAbertura) : quantidadeBase

  const alerta = precisaExtra
    ? `Blackout com altura útil de ${alturaComCabeca.toFixed(2)}m excede a largura de ${larguraMaximaTecido.toFixed(2)}m após considerar a cabeça de ${CABECA_PADRAO.toFixed(2)}m.`
    : null

  return { quantidade, quantidadeBase, precisaExtra, extraAplicado, alerta }
}

export function calcularAmbiente(
  ambiente: AmbienteInput,
  configs: Configuracoes
): ResultadoAmbiente {
  const fator = getFatorPrega(ambiente.modeloCortina, configs)
  const bainhaDesejada = ambiente.bainhaDesejada ?? BAINHA_PADRAO

  const tecidoCalc = calcularConsumoPrincipal(
    ambiente.largura,
    ambiente.altura,
    ambiente.tipoAbertura,
    fator,
    ambiente.tecido.larguraMaxima,
    ambiente.tecidoExtra,
    bainhaDesejada
  )

  let blackoutCalc: ReturnType<typeof calcularConsumoBlackout> | null = null
  if (ambiente.blackout) {
    blackoutCalc = calcularConsumoBlackout(
      ambiente.largura,
      ambiente.altura,
      ambiente.tipoAberturaBlackout ?? ambiente.tipoAbertura,
      configs.fator_prega_reta,
      ambiente.blackout.larguraMaxima,
      ambiente.blackoutExtra ?? false
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

  const alertas = [tecidoCalc.alerta, blackoutCalc?.alerta].filter(Boolean).join(' ')

  return {
    nomeAmbiente: ambiente.nomeAmbiente,
    quantidadeTecido: tecidoCalc.quantidade,
    quantidadeBlackout: blackoutCalc?.quantidade ?? null,
    precisaTecidoExtra: tecidoCalc.precisaExtra,
    precisaBlackoutExtra: blackoutCalc?.precisaExtra ?? false,
    tecidoExtraAplicado: tecidoCalc.extraAplicado,
    blackoutExtraAplicado: blackoutCalc?.extraAplicado ?? false,
    bainhaDesejada,
    bainhaDisponivel: tecidoCalc.bainhaDisponivel,
    bainhaNaoCabe: tecidoCalc.precisaExtra || (blackoutCalc?.precisaExtra ?? false),
    bainhaAlerta: alertas || null,
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
