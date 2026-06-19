'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Pencil, Eraser, Trash2, Check, X, RotateCcw } from 'lucide-react'

type Props = {
  imagemBase64: string
  onSalvar: (imagemAnotada: string) => void
  onCancelar: () => void
}

const CORES = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#A855F7', '#000000', '#FFFFFF']

export default function FotoAnotacao({ imagemBase64, onSalvar, onCancelar }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [desenhando, setDesenhando] = useState(false)
  const [ferramenta, setFerramenta] = useState<'lapis' | 'borracha'>('lapis')
  const [cor, setCor] = useState('#EF4444')
  const [espessura, setEspessura] = useState(4)
  const [historico, setHistorico] = useState<ImageData[]>([])
  const ultimoPos = useRef<{ x: number; y: number } | null>(null)

  const getCanvas = () => canvasRef.current!
  const getCtx = () => getCanvas().getContext('2d')!

  useEffect(() => {
    const canvas = getCanvas()
    const ctx = getCtx()
    const img = new Image()
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)
      setHistorico([ctx.getImageData(0, 0, canvas.width, canvas.height)])
    }
    img.src = imagemBase64
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagemBase64])

  function getPosCanvas(e: React.MouseEvent | React.TouchEvent) {
    const canvas = getCanvas()
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  function iniciarDesenho(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    setDesenhando(true)
    ultimoPos.current = getPosCanvas(e)
    // Salvar estado antes de desenhar
    const canvas = getCanvas()
    const ctx = getCtx()
    setHistorico(h => [...h.slice(-19), ctx.getImageData(0, 0, canvas.width, canvas.height)])
  }

  function desenhar(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!desenhando || !ultimoPos.current) return
    const ctx = getCtx()
    const pos = getPosCanvas(e)

    ctx.beginPath()
    ctx.moveTo(ultimoPos.current.x, ultimoPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = ferramenta === 'borracha' ? '#FFFFFF' : cor
    ctx.lineWidth = ferramenta === 'borracha' ? espessura * 4 : espessura
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    ultimoPos.current = pos
  }

  function pararDesenho() {
    setDesenhando(false)
    ultimoPos.current = null
  }

  const desfazer = useCallback(() => {
    if (historico.length <= 1) return
    const novoHistorico = historico.slice(0, -1)
    const canvas = getCanvas()
    const ctx = getCtx()
    ctx.putImageData(novoHistorico[novoHistorico.length - 1], 0, 0)
    setHistorico(novoHistorico)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historico])

  function limparTudo() {
    const canvas = getCanvas()
    const ctx = getCtx()
    if (historico.length > 0) {
      ctx.putImageData(historico[0], 0, 0)
      setHistorico([historico[0]])
    }
  }

  function salvar() {
    onSalvar(getCanvas().toDataURL('image/jpeg', 0.85))
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] border-b border-white/10 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFerramenta('lapis')}
            className={`p-2 rounded-lg transition-colors ${ferramenta === 'lapis' ? 'bg-gold-primary text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            title="Lápis"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => setFerramenta('borracha')}
            className={`p-2 rounded-lg transition-colors ${ferramenta === 'borracha' ? 'bg-gold-primary text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            title="Borracha"
          >
            <Eraser size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {CORES.map(c => (
            <button
              key={c}
              onClick={() => { setCor(c); setFerramenta('lapis') }}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${cor === c && ferramenta === 'lapis' ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 text-white/60 text-xs">
          <span>Espessura</span>
          <input
            type="range" min={2} max={20} value={espessura}
            onChange={e => setEspessura(Number(e.target.value))}
            className="w-20 accent-gold-primary"
          />
          <span className="w-4">{espessura}</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={desfazer} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Desfazer">
            <RotateCcw size={16} />
          </button>
          <button onClick={limparTudo} className="p-2 text-white/60 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors" title="Limpar tudo">
            <Trash2 size={16} />
          </button>
          <button onClick={onCancelar} className="px-3 py-1.5 text-sm text-white/60 hover:text-white border border-white/20 rounded-lg transition-colors">
            <X size={16} />
          </button>
          <button onClick={salvar} className="px-4 py-1.5 text-sm font-semibold bg-gold-primary text-white rounded-lg hover:bg-gold-dark transition-colors flex items-center gap-1.5">
            <Check size={16} /> Salvar
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain cursor-crosshair touch-none"
          style={{ imageRendering: 'pixelated' }}
          onMouseDown={iniciarDesenho}
          onMouseMove={desenhar}
          onMouseUp={pararDesenho}
          onMouseLeave={pararDesenho}
          onTouchStart={iniciarDesenho}
          onTouchMove={desenhar}
          onTouchEnd={pararDesenho}
        />
      </div>
    </div>
  )
}
