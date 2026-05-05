'use client'

import { Check } from 'lucide-react'

interface Step {
  numero: number
  label: string
}

const steps: Step[] = [
  { numero: 1, label: 'Cliente' },
  { numero: 2, label: 'Produto' },
  { numero: 3, label: 'Detalhes' },
]

export default function ProgressBar({ etapaAtual }: { etapaAtual: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => {
        const concluida = etapaAtual > step.numero
        const ativa = etapaAtual === step.numero
        return (
          <div key={step.numero} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  concluida
                    ? 'bg-green-500 text-white'
                    : ativa
                    ? 'bg-gold-primary text-white'
                    : 'bg-brand-border text-text-muted'
                }`}
              >
                {concluida ? <Check size={16} strokeWidth={2.5} /> : step.numero}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  ativa ? 'text-gold-primary' : concluida ? 'text-green-500' : 'text-text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-20 h-0.5 mx-2 mb-5 rounded-full overflow-hidden bg-brand-border">
                <div
                  className="h-full bg-gold-primary transition-all duration-500"
                  style={{ width: etapaAtual > step.numero ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
