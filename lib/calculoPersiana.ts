export type TipoPersiana =
  | 'ROLO'
  | 'ROMANA'
  | 'PAINEL_SEM_HASTES'
  | 'PAINEL_COM_HASTES'
  | 'HORIZONTAL_16'
  | 'HORIZONTAL_25'
  | 'HORIZONTAL_50'

export interface ConfigsPersiana {
  markup_persiana: number
  comissao_padrao: number
  rt_padrao: number
  instalacao_persiana_rolo: number
  instalacao_persiana_romana: number
  instalacao_persiana_horizontal: number
  instalacao_persiana_painel: number
  instalacao_motor_persiana: number
}

export interface PersianaAcessorioInput {
  id: string
  nome: string
  valorMetro: number
}

export interface PersianaMotorInput {
  id: string
  nome: string
  valor: number
}

export interface PersianaInput {
  nomeAmbiente: string
  tipo: TipoPersiana
  largura: number
  altura: number
  quantidade: number
  valorM2: number
  minM2: number
  acionamento: 'manual' | 'motorizada'
  instalacao: boolean
  bando?: (PersianaAcessorioInput & { lado: string }) | null
  guiaLateral?: (PersianaAcessorioInput & { fator: number }) | null
  guiaBase?: PersianaAcessorioInput | null
  motor?: PersianaMotorInput | null
  controle?: PersianaMotorInput | null
}

export interface ResultadoPersiana {
  nomeAmbiente: string
  tipo: TipoPersiana
  largura: number
  altura: number
  quantidade: number
  m2Calculado: number
  m2Cobrado: number
  custoPersiana: number
  custoBando: number
  custoGuiaLateral: number
  custoGuiaBase: number
  custoMotor: number
  custoControle: number
  custoInstalacaoMotor: number
  custoInstalacao: number
  custoTotal: number
  precoComMarkup: number
  valorRt: number
  valorComissao: number
  precoFinalVenda: number
  margem: number
  markup: number
}

function isHorizontal(tipo: TipoPersiana): boolean {
  return tipo === 'HORIZONTAL_16' || tipo === 'HORIZONTAL_25' || tipo === 'HORIZONTAL_50'
}

function isPainel(tipo: TipoPersiana): boolean {
  return tipo === 'PAINEL_SEM_HASTES' || tipo === 'PAINEL_COM_HASTES'
}

export function calcularAmbientePersiana(input: PersianaInput, cfg: ConfigsPersiana): ResultadoPersiana {
  const { largura, altura, quantidade, valorM2, minM2, acionamento, instalacao, tipo } = input

  // Cálculo base de m²
  const m2Calculado = largura * altura * quantidade
  const minTotal = minM2 * quantidade
  const m2Cobrado = Math.max(m2Calculado, minTotal)

  const custoPersiana = m2Cobrado * valorM2

  // Bandô: largura × R$/m × quantidade
  const custoBando = input.bando
    ? largura * input.bando.valorMetro * quantidade
    : 0

  // Guia lateral: altura × R$/m × fator (1=um lado, 2=ambos) × quantidade
  const custoGuiaLateral = input.guiaLateral
    ? altura * input.guiaLateral.valorMetro * input.guiaLateral.fator * quantidade
    : 0

  // Guia base: largura × R$/m × quantidade
  const custoGuiaBase = input.guiaBase
    ? largura * input.guiaBase.valorMetro * quantidade
    : 0

  // Motorização
  const custoMotor = acionamento === 'motorizada' && input.motor ? input.motor.valor : 0
  const custoControle = acionamento === 'motorizada' && input.controle ? input.controle.valor : 0
  const custoInstalacaoMotor = acionamento === 'motorizada' ? cfg.instalacao_motor_persiana : 0

  // Instalação por tipo
  let custoInstalacao = 0
  if (instalacao) {
    if (isPainel(tipo)) {
      // Valor fixo independente de qtd
      custoInstalacao = cfg.instalacao_persiana_painel
    } else if (isHorizontal(tipo)) {
      custoInstalacao = quantidade * cfg.instalacao_persiana_horizontal
    } else if (tipo === 'ROMANA') {
      custoInstalacao = quantidade * cfg.instalacao_persiana_romana
    } else {
      // ROLO
      custoInstalacao = quantidade * cfg.instalacao_persiana_rolo
    }
  }

  const custoTotal =
    custoPersiana + custoBando + custoGuiaLateral + custoGuiaBase +
    custoMotor + custoControle + custoInstalacaoMotor + custoInstalacao

  const markup = cfg.markup_persiana
  const precoComMarkup = custoTotal / (1 - markup / 100)
  const valorRt = precoComMarkup * (cfg.rt_padrao / 100)
  const valorComissao = precoComMarkup * (cfg.comissao_padrao / 100)
  const precoFinalVenda = precoComMarkup + valorRt + valorComissao
  const margem = precoComMarkup - custoTotal

  return {
    nomeAmbiente: input.nomeAmbiente,
    tipo,
    largura,
    altura,
    quantidade,
    m2Calculado,
    m2Cobrado,
    custoPersiana,
    custoBando,
    custoGuiaLateral,
    custoGuiaBase,
    custoMotor,
    custoControle,
    custoInstalacaoMotor,
    custoInstalacao,
    custoTotal,
    precoComMarkup,
    valorRt,
    valorComissao,
    precoFinalVenda,
    margem,
    markup,
  }
}

export function calcularOrcamentoPersiana(ambientes: PersianaInput[], cfg: ConfigsPersiana) {
  const resultados = ambientes.map(a => calcularAmbientePersiana(a, cfg))
  return {
    ambientes: resultados,
    totalCusto: resultados.reduce((s, r) => s + r.custoTotal, 0),
    totalPrecoFinalVenda: resultados.reduce((s, r) => s + r.precoFinalVenda, 0),
    totalComissao: resultados.reduce((s, r) => s + r.valorComissao, 0),
    totalRt: resultados.reduce((s, r) => s + r.valorRt, 0),
    totalMargem: resultados.reduce((s, r) => s + r.margem, 0),
  }
}
