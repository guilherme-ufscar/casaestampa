export const STATUS_FINANCEIROS = ['aprovado', 'em_producao', 'pronto', 'instalado', 'finalizado'] as const

export function getRange(periodo: string, ini?: string, fim?: string) {
  const now = new Date()
  if (periodo === 'mes') return { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
  if (periodo === '3meses') {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 3)
    return { gte: d }
  }
  if (periodo === 'ano') return { gte: new Date(now.getFullYear(), 0, 1) }
  if (periodo === 'personalizado' && ini && fim) return { gte: new Date(ini), lte: new Date(`${fim}T23:59:59`) }
  return { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
}

export function getPrevRange(periodo: string, ini?: string, fim?: string) {
  const now = new Date()
  if (periodo === 'mes') return { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1), lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) }
  if (periodo === '3meses') {
    const a = new Date(now)
    a.setMonth(a.getMonth() - 6)
    const b = new Date(now)
    b.setMonth(b.getMonth() - 3)
    return { gte: a, lte: b }
  }
  if (periodo === 'ano') return { gte: new Date(now.getFullYear() - 1, 0, 1), lte: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59) }
  if (periodo === 'personalizado' && ini && fim) {
    const start = new Date(ini)
    const end = new Date(fim)
    const duration = end.getTime() - start.getTime()
    return { gte: new Date(start.getTime() - duration), lte: new Date(start.getTime() - 1) }
  }
  return { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1), lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) }
}

export function pct(atual: number, anterior: number) {
  if (anterior === 0) return atual > 0 ? 100 : 0
  return Math.round((((atual - anterior) / anterior) * 100) * 10) / 10
}

export function somarPrecoFinal(items: { precoFinalTotal: unknown }[]) {
  return items.reduce((sum, item) => sum + Number(item.precoFinalTotal ?? 0), 0)
}

export function somarCusto(items: { custoTotal: unknown }[]) {
  return items.reduce((sum, item) => sum + Number(item.custoTotal ?? 0), 0)
}

export function calcularMargemMedia(items: { custoTotal: unknown; precoFinalVenda: unknown }[]) {
  if (items.length === 0) return 0
  return items.reduce((sum, item) => {
    const preco = Number(item.precoFinalVenda ?? 0)
    const custo = Number(item.custoTotal ?? 0)
    return sum + (preco > 0 ? ((preco - custo) / preco) * 100 : 0)
  }, 0) / items.length
}
