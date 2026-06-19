'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, Plus, Trash2, X, ZoomIn } from 'lucide-react'
import dynamic from 'next/dynamic'

const FotoAnotacao = dynamic(() => import('./FotoAnotacao'), { ssr: false })

type Foto = { id: string; nomeAmbiente?: string | null; imagem: string; observacao?: string | null; createdAt: string }

export default function FotosOrcamento({ orcamentoId }: { orcamentoId: string }) {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [imagemParaAnotar, setImagemParaAnotar] = useState<string | null>(null)
  const [fotoVisualizando, setFotoVisualizando] = useState<Foto | null>(null)
  const [nomeAmbiente, setNomeAmbiente] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/orcamentos/${orcamentoId}/fotos`)
      .then(r => r.json())
      .then(data => { setFotos(data); setCarregando(false) })
  }, [orcamentoId])

  function abrirArquivo() { fileRef.current?.click() }

  function onArquivoSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImagemParaAnotar(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function salvarFoto(imagemAnotada: string) {
    const res = await fetch(`/api/orcamentos/${orcamentoId}/fotos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagem: imagemAnotada, nomeAmbiente: nomeAmbiente || null }),
    })
    if (res.ok) {
      const nova = await res.json()
      setFotos(prev => [...prev, nova])
    }
    setImagemParaAnotar(null)
    setNomeAmbiente('')
  }

  async function excluirFoto(id: string) {
    if (!confirm('Excluir esta foto?')) return
    await fetch(`/api/orcamentos/${orcamentoId}/fotos/${id}`, { method: 'DELETE' })
    setFotos(prev => prev.filter(f => f.id !== id))
    if (fotoVisualizando?.id === id) setFotoVisualizando(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Camera size={12} /> Fotos do ambiente ({fotos.length})
        </p>
        <div className="flex items-center gap-2">
          {imagemParaAnotar === null && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ambiente (opcional)"
                value={nomeAmbiente}
                onChange={e => setNomeAmbiente(e.target.value)}
                className="text-xs border border-brand-border rounded px-2 py-1 outline-none focus:border-gold-primary w-36"
              />
              <button
                onClick={abrirArquivo}
                className="flex items-center gap-1.5 text-xs font-medium text-gold-primary hover:text-gold-dark transition-colors border border-gold-primary/30 rounded-lg px-2.5 py-1.5"
              >
                <Plus size={12} /> Adicionar foto
              </button>
            </div>
          )}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onArquivoSelecionado} capture="environment" />

      {carregando && <p className="text-xs text-text-muted">Carregando fotos...</p>}

      {fotos.length === 0 && !carregando && (
        <p className="text-xs text-text-muted italic">Nenhuma foto adicionada ainda</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {fotos.map(f => (
          <div key={f.id} className="relative group rounded-lg overflow-hidden border border-brand-border aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.imagem} alt={f.nomeAmbiente ?? 'Foto'} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button onClick={() => setFotoVisualizando(f)} className="p-1.5 bg-white/90 rounded-full text-gray-800 hover:bg-white">
                <ZoomIn size={14} />
              </button>
              <button onClick={() => excluirFoto(f.id)} className="p-1.5 bg-white/90 rounded-full text-red-600 hover:bg-white">
                <Trash2 size={14} />
              </button>
            </div>
            {f.nomeAmbiente && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                <p className="text-[10px] text-white truncate">{f.nomeAmbiente}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Editor de anotação */}
      {imagemParaAnotar && (
        <FotoAnotacao
          imagemBase64={imagemParaAnotar}
          onSalvar={salvarFoto}
          onCancelar={() => setImagemParaAnotar(null)}
        />
      )}

      {/* Visualizador */}
      {fotoVisualizando && (
        <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col" onClick={() => setFotoVisualizando(null)}>
          <div className="flex items-center justify-between px-4 py-3" onClick={e => e.stopPropagation()}>
            <p className="text-white text-sm font-medium">{fotoVisualizando.nomeAmbiente ?? 'Foto'}</p>
            <div className="flex items-center gap-3">
              <button onClick={() => excluirFoto(fotoVisualizando.id)} className="p-2 text-red-400 hover:text-red-300">
                <Trash2 size={18} />
              </button>
              <button onClick={() => setFotoVisualizando(null)} className="p-2 text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={() => setFotoVisualizando(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoVisualizando.imagem} alt="" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  )
}
