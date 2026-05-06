export type StatusOrcamento =
  | 'orcamento_enviado'
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'em_producao'
  | 'pronto'
  | 'instalado'
  | 'finalizado'

export const STATUS_CONFIG: Record<StatusOrcamento, { label: string; color: string; bg: string; dot: string }> = {
  orcamento_enviado:    { label: 'Orçamento Enviado',    color: '#3B82F6', bg: '#EFF6FF', dot: '#3B82F6' },
  aguardando_aprovacao: { label: 'Aguardando Aprovação', color: '#F59E0B', bg: '#FFFBEB', dot: '#F59E0B' },
  aprovado:             { label: 'Aprovado',             color: '#22C55E', bg: '#F0FDF4', dot: '#22C55E' },
  em_producao:          { label: 'Em Produção',          color: '#8B5CF6', bg: '#F5F3FF', dot: '#8B5CF6' },
  pronto:               { label: 'Pronto',               color: '#14B8A6', bg: '#F0FDFA', dot: '#14B8A6' },
  instalado:            { label: 'Instalado',            color: '#10B981', bg: '#ECFDF5', dot: '#10B981' },
  finalizado:           { label: 'Finalizado',           color: '#6B7280', bg: '#F9FAFB', dot: '#6B7280' },
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as StatusOrcamento] ?? { label: status, color: '#6B7280', bg: '#F9FAFB', dot: '#6B7280' }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  )
}
