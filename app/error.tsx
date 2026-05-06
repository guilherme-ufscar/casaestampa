"use client"

import Link from "next/link"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-red-400 mb-4">500</p>
        <h1 className="text-2xl font-semibold text-text-primary mb-2">Erro interno</h1>
        <p className="text-text-muted mb-8">Algo deu errado. Tente novamente ou volte ao dashboard.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-gold inline-flex items-center gap-2 px-6 py-3 rounded-[10px] text-sm font-semibold">
            Tentar novamente
          </button>
          <Link href="/dashboard-vendedor" className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] text-sm font-semibold border border-brand-border text-text-secondary hover:bg-brand-input transition-colors">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
