'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

type Tecido = {
  id: string
  nome: string
  larguraMaxima: number
  valorMetro: number
  tipo: 'PRINCIPAL' | 'BLACKOUT' | 'DECORACAO'
  ativo: boolean
}

type Trilho = {
  id: string
  nome: string
  valorUnitario: number
  ativo: boolean
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function TabelasPage() {
  const [tecidos, setTecidos] = useState<Tecido[]>([])
  const [trilhos, setTrilhos] = useState<Trilho[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'principais' | 'blackouts' | 'decoracao' | 'trilhos'>('principais')

  useEffect(() => {
    Promise.all([
      fetch('/api/tecidos').then(r => r.json()),
      fetch('/api/trilhos').then(r => r.json()),
    ]).then(([t, tr]) => {
      setTecidos(t)
      setTrilhos(tr)
      setLoading(false)
    })
  }, [])

  const tecidosPrincipais = tecidos.filter(t => t.tipo === 'PRINCIPAL' && t.ativo)
  const tecidosBlackout = tecidos.filter(t => t.tipo === 'BLACKOUT' && t.ativo)
  const tecidosDecoracao = tecidos.filter(t => t.tipo === 'DECORACAO' && t.ativo)
  const trilhosAtivos = trilhos.filter(t => t.ativo)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gold-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-text-primary">Tabelas de Preço</h2>
        <p className="text-sm text-text-muted mt-0.5">Consulta de tecidos e trilhos disponíveis</p>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'principais', label: `Tecidos (${tecidosPrincipais.length})` },
          { key: 'blackouts', label: `Blackouts (${tecidosBlackout.length})` },
          { key: 'decoracao', label: `Decoração (${tecidosDecoracao.length})` },
          { key: 'trilhos', label: `Trilhos (${trilhosAtivos.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setAba(key as typeof aba)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              aba === key
                ? 'bg-gold-primary text-white'
                : 'bg-brand-input text-text-secondary hover:bg-brand-border border border-brand-border'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card-base overflow-hidden">
        {aba === 'trilhos' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg">
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Valor/m</th>
              </tr>
            </thead>
            <tbody>
              {trilhosAtivos.map(t => (
                <tr key={t.id} className="border-b border-brand-border last:border-0 hover:bg-brand-bg/50">
                  <td className="px-4 py-3 font-medium text-text-primary">{t.nome}</td>
                  <td className="px-4 py-3 text-text-secondary">{fmt(Number(t.valorUnitario))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg">
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Largura Máx.</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Valor/m</th>
              </tr>
            </thead>
            <tbody>
              {(aba === 'principais' ? tecidosPrincipais : aba === 'blackouts' ? tecidosBlackout : tecidosDecoracao).map(t => (
                <tr key={t.id} className="border-b border-brand-border last:border-0 hover:bg-brand-bg/50">
                  <td className="px-4 py-3 font-medium text-text-primary">{t.nome}</td>
                  <td className="px-4 py-3 text-text-secondary">{Number(t.larguraMaxima).toFixed(2)}m</td>
                  <td className="px-4 py-3 text-text-secondary">{fmt(Number(t.valorMetro))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
