'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, Search, ExternalLink } from 'lucide-react'
import Link from 'next/link'

type Tecido = {
  id: string
  nome: string
  larguraMaxima: number
  valorMetro: number
  tipo: 'PRINCIPAL' | 'BLACKOUT' | 'DECORACAO'
  categoria: string | null
  ativo: boolean
}

type Trilho = {
  id: string
  nome: string
  valorUnitario: number
  ativo: boolean
}

type PapelParede = {
  id: string
  album: string
  referencia: string | null
  dimensao: string
  valorRolo: number
  categoria: string | null
  ativo: boolean
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function TabelasPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const [tecidos, setTecidos] = useState<Tecido[]>([])
  const [trilhos, setTrilhos] = useState<Trilho[]>([])
  const [papeis, setPapeis] = useState<PapelParede[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<string>('')

  useEffect(() => {
    Promise.all([
      fetch('/api/tecidos').then(r => r.json()),
      fetch('/api/trilhos').then(r => r.json()),
      fetch('/api/papeis-parede').then(r => r.json()),
    ]).then(([t, tr, p]) => {
      setTecidos(t)
      setTrilhos(tr)
      setPapeis(p)
      setLoading(false)
    })
  }, [])

  const tecidosAtivos = useMemo(() => tecidos.filter(t => t.ativo), [tecidos])
  const trilhosAtivos = useMemo(() => trilhos.filter(t => t.ativo), [trilhos])
  const papeisAtivos = useMemo(() => papeis.filter(p => p.ativo), [papeis])

  const categoriasTecido = useMemo(() => {
    const cats = new Set<string>()
    tecidosAtivos.forEach(t => { if (t.categoria) cats.add(t.categoria) })
    return Array.from(cats).sort()
  }, [tecidosAtivos])

  const categoriasPapel = useMemo(() => {
    const cats = new Set<string>()
    papeisAtivos.forEach(p => { if (p.categoria) cats.add(`Papel: ${p.categoria}`) })
    return Array.from(cats).sort()
  }, [papeisAtivos])

  const abas = useMemo(() => {
    const all = [...categoriasTecido, ...categoriasPapel, 'Trilhos']
    if (tecidosAtivos.some(t => !t.categoria)) all.splice(categoriasTecido.length, 0, 'Sem categoria')
    return all
  }, [categoriasTecido, categoriasPapel, tecidosAtivos])

  useEffect(() => {
    if (!abaAtiva && abas.length > 0) {
      setAbaAtiva(abas[0])
    }
  }, [abas, abaAtiva])

  const itensFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim()

    if (abaAtiva === 'Trilhos') {
      return { tipo: 'trilhos' as const, items: trilhosAtivos.filter(t => !termo || t.nome.toLowerCase().includes(termo)) }
    }

    if (abaAtiva.startsWith('Papel: ')) {
      const catPapel = abaAtiva.replace('Papel: ', '')
      const filtered = papeisAtivos.filter(p => {
        const catMatch = p.categoria === catPapel
        const buscaMatch = !termo || p.album.toLowerCase().includes(termo) || (p.referencia?.toLowerCase().includes(termo) ?? false)
        return catMatch && buscaMatch
      })
      return { tipo: 'papeis' as const, items: filtered }
    }

    const filtered = tecidosAtivos.filter(t => {
      const catMatch = abaAtiva === 'Sem categoria' ? !t.categoria : t.categoria === abaAtiva
      const buscaMatch = !termo || t.nome.toLowerCase().includes(termo)
      return catMatch && buscaMatch
    })
    return { tipo: 'tecidos' as const, items: filtered }
  }, [abaAtiva, busca, tecidosAtivos, trilhosAtivos, papeisAtivos])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gold-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Tabelas de Materiais</h2>
          <p className="text-sm text-text-muted mt-0.5">Consulta de preços por fornecedor</p>
        </div>
        {isAdmin && (
          <Link
            href="/configuracoes"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gold-primary border border-gold-primary/30 hover:bg-gold-primary/5 transition-colors"
          >
            <ExternalLink size={15} />
            Editar no painel
          </Link>
        )}
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar material por nome..."
          className="input-base pl-9"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {abas.map(cat => (
          <button
            key={cat}
            onClick={() => setAbaAtiva(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              abaAtiva === cat
                ? 'bg-gold-primary text-white'
                : 'bg-brand-input text-text-secondary hover:bg-brand-border border border-brand-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="card-base overflow-hidden">
        {itensFiltrados.tipo === 'trilhos' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg">
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Valor/m</th>
              </tr>
            </thead>
            <tbody>
              {(itensFiltrados.items as Trilho[]).map((t, i) => (
                <tr key={t.id} className={`border-b border-brand-border last:border-0 ${i % 2 === 0 ? '' : 'bg-brand-bg/50'}`}>
                  <td className="px-4 py-3 font-medium text-text-primary">{t.nome}</td>
                  <td className="px-4 py-3 text-text-secondary">{fmt(Number(t.valorUnitario))}</td>
                </tr>
              ))}
              {itensFiltrados.items.length === 0 && (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-text-muted text-sm">Nenhum item encontrado</td></tr>
              )}
            </tbody>
          </table>
        )}

        {itensFiltrados.tipo === 'papeis' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg">
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Álbum</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Referência</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Dimensão</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Valor/Rolo</th>
              </tr>
            </thead>
            <tbody>
              {(itensFiltrados.items as PapelParede[]).map((p, i) => (
                <tr key={p.id} className={`border-b border-brand-border last:border-0 ${i % 2 === 0 ? '' : 'bg-brand-bg/50'}`}>
                  <td className="px-4 py-3 font-medium text-text-primary">{p.album}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.referencia || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.dimensao}</td>
                  <td className="px-4 py-3 text-text-secondary">{fmt(Number(p.valorRolo))}</td>
                </tr>
              ))}
              {itensFiltrados.items.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted text-sm">Nenhum item encontrado</td></tr>
              )}
            </tbody>
          </table>
        )}

        {itensFiltrados.tipo === 'tecidos' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg">
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Largura Máx.</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Valor/m</th>
              </tr>
            </thead>
            <tbody>
              {(itensFiltrados.items as Tecido[]).map((t, i) => (
                <tr key={t.id} className={`border-b border-brand-border last:border-0 ${i % 2 === 0 ? '' : 'bg-brand-bg/50'}`}>
                  <td className="px-4 py-3 font-medium text-text-primary">{t.nome}</td>
                  <td className="px-4 py-3 text-text-secondary">{Number(t.larguraMaxima).toFixed(2)}m</td>
                  <td className="px-4 py-3 text-text-secondary">{fmt(Number(t.valorMetro))}</td>
                </tr>
              ))}
              {itensFiltrados.items.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-text-muted text-sm">Nenhum item encontrado</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}