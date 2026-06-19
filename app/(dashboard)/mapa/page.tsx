'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, MapPin, Phone, Mail, Home, ExternalLink } from 'lucide-react'
import { StatusBadge, STATUS_CONFIG } from '@/components/ui/StatusBadge'

type OrcamentoPin = {
  id: string; numero: number; status: string; precoFinalTotal: number | null; createdAt: string
}

type ClientePin = {
  id: string; nome: string; telefone?: string | null; endereco?: string | null; bairro?: string | null
  lat: number | null; lng: number | null
  orcamentos: OrcamentoPin[]
}

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtData(d: string) { return new Date(d).toLocaleDateString('pt-BR') }

export default function MapaClientesPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<{ map: L.Map; markers: L.Marker[] } | null>(null)
  const [clientes, setClientes] = useState<ClientePin[]>([])
  const [selecionado, setSelecionado] = useState<ClientePin | null>(null)
  const [busca, setBusca] = useState('')
  const [geocodificando, setGeocodificando] = useState(false)
  const [semCoordenadas, setSemCoordenadas] = useState(0)

  useEffect(() => {
    fetch('/api/clientes/mapa').then(r => r.json()).then((data: ClientePin[]) => {
      setClientes(data)
      setSemCoordenadas(data.filter(c => !c.lat || !c.lng).length)
    })
  }, [])

  useEffect(() => {
    if (!mapRef.current || clientes.length === 0) return

    let L: typeof import('leaflet')
    let map: import('leaflet').Map

    async function initMap() {
      L = (await import('leaflet')).default

      // Fix default icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (leafletRef.current) {
        leafletRef.current.map.remove()
      }

      map = L.map(mapRef.current!).setView([-23.55, -46.63], 12)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const goldIcon = L.divIcon({
        html: `<div style="width:28px;height:28px;background:#C9A84C;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      })

      const markers: import('leaflet').Marker[] = []
      const comCoordenadas = clientes.filter(c => c.lat && c.lng)

      comCoordenadas.forEach(c => {
        const marker = L.marker([c.lat!, c.lng!], { icon: goldIcon })
          .addTo(map)
          .on('click', () => setSelecionado(c))
        markers.push(marker)
      })

      if (comCoordenadas.length > 0) {
        const group = L.featureGroup(markers)
        map.fitBounds(group.getBounds().pad(0.1))
      }

      leafletRef.current = { map, markers }
    }

    initMap()

    return () => {
      if (leafletRef.current) {
        leafletRef.current.map.remove()
        leafletRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes])

  async function geocodificarTodos() {
    if (!confirm(`Geocodificar ${semCoordenadas} clientes sem coordenadas? Isso pode demorar alguns minutos.`)) return
    setGeocodificando(true)
    await fetch('/api/clientes/geocodificar', { method: 'PUT' })
    const data: ClientePin[] = await fetch('/api/clientes/mapa').then(r => r.json())
    setClientes(data)
    setSemCoordenadas(data.filter(c => !c.lat || !c.lng).length)
    setGeocodificando(false)
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.bairro ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  const comCoordenadas = clientes.filter(c => c.lat && c.lng).length

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-brand-border bg-white flex items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Mapa de Clientes</h1>
          <p className="text-xs text-text-muted mt-0.5">{comCoordenadas} de {clientes.length} clientes no mapa</p>
        </div>
        <div className="flex items-center gap-3">
          {semCoordenadas > 0 && (
            <button
              onClick={geocodificarTodos}
              disabled={geocodificando}
              className="text-xs px-3 py-2 rounded-lg border border-gold-primary text-gold-primary hover:bg-gold-primary/8 transition-colors disabled:opacity-50"
            >
              {geocodificando ? 'Geocodificando...' : `Localizar ${semCoordenadas} clientes sem pin`}
            </button>
          )}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar cliente..."
              className="input-base pl-9 w-56 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista lateral */}
        <div className="w-64 border-r border-brand-border bg-white overflow-y-auto flex-shrink-0">
          {clientesFiltrados.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setSelecionado(c)
                if (c.lat && c.lng && leafletRef.current) {
                  leafletRef.current.map.setView([c.lat, c.lng], 16)
                }
              }}
              className={`w-full text-left px-4 py-3 border-b border-brand-border hover:bg-gold-primary/4 transition-colors ${selecionado?.id === c.id ? 'bg-gold-primary/8 border-l-2 border-l-gold-primary' : ''}`}
            >
              <div className="flex items-start gap-2">
                <MapPin size={13} className={`mt-0.5 shrink-0 ${c.lat ? 'text-gold-primary' : 'text-text-muted'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{c.nome}</p>
                  {c.bairro && <p className="text-xs text-text-muted truncate">{c.bairro}</p>}
                </div>
              </div>
            </button>
          ))}
          {clientesFiltrados.length === 0 && (
            <p className="text-xs text-text-muted text-center py-8">Nenhum cliente encontrado</p>
          )}
        </div>

        {/* Mapa */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />

          {/* Painel do cliente selecionado */}
          {selecionado && (
            <div className="absolute top-4 right-4 w-72 bg-white rounded-xl shadow-xl border border-brand-border overflow-hidden z-[1000]">
              <div className="flex items-center justify-between px-4 py-3 bg-[#FFFBF2] border-b border-brand-border">
                <p className="text-sm font-semibold text-text-primary truncate">{selecionado.nome}</p>
                <button onClick={() => setSelecionado(null)} className="text-text-muted hover:text-text-primary p-1">
                  <X size={15} />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {selecionado.telefone && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Phone size={12} className="text-text-muted" />
                    <span>{selecionado.telefone}</span>
                  </div>
                )}
                {selecionado.endereco && (
                  <div className="flex items-start gap-2 text-xs text-text-secondary">
                    <Home size={12} className="text-text-muted mt-0.5" />
                    <span>{[selecionado.endereco, selecionado.bairro].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {selecionado.orcamentos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-brand-border space-y-1.5">
                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Últimos orçamentos</p>
                    {selecionado.orcamentos.map(o => (
                      <div key={o.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={o.status} />
                          <span className="text-xs text-text-muted">#{String(o.numero).padStart(4, '0')}</span>
                        </div>
                        <span className="text-xs font-medium text-text-primary">
                          {o.precoFinalTotal ? fmt(Number(o.precoFinalTotal)) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <a
                  href={`/clientes?abrir=${selecionado.id}`}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gold-primary hover:text-gold-dark transition-colors"
                >
                  <ExternalLink size={12} /> Ver ficha completa
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
