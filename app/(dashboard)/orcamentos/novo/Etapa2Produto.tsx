'use client'

import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useOrcamento } from '@/context/OrcamentoContext'

const produtos = [
  {
    id: 'cortina',
    nome: 'Cortina',
    descricao: 'Cortinas sob medida com cálculo automático de tecido, prega e instalação.',
    disponivel: true,
    principal: true,
  },
  {
    id: 'persiana',
    nome: 'Persiana',
    descricao: 'Persianas horizontais e verticais em diversos materiais.',
    disponivel: true,
  },
  {
    id: 'papel_parede',
    nome: 'Papel de Parede',
    descricao: 'Papéis de parede nacionais e importados com cálculo de rolos.',
    disponivel: true,
  },
]

export default function Etapa2Produto() {
  const { cliente, produto, setProduto, setEtapa } = useOrcamento()

  return (
    <div className="space-y-4">
      {/* Resumo cliente */}
      {cliente && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-brand-border rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-primary to-gold-light flex items-center justify-center">
              <span className="text-xs font-semibold text-white">{cliente.nome.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-text-primary">{cliente.nome}</span>
            {cliente.telefone && <span className="text-sm text-text-muted">· {cliente.telefone}</span>}
          </div>
          <button onClick={() => setEtapa(1)} className="text-xs font-medium text-gold-primary hover:text-gold-dark transition-colors">
            Editar
          </button>
        </div>
      )}

      <div className="card-base p-6 md:p-8 space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Etapa 2 — Selecione o Produto</h3>

        <div className="space-y-3">
          {produtos.map(p => {
            const selecionado = produto === p.id && p.disponivel
            return (
              <button
                key={p.id}
                onClick={() => p.disponivel && setProduto(p.id)}
                disabled={!p.disponivel}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all relative ${
                  selecionado
                    ? 'border-gold-primary bg-[rgba(201,168,76,0.03)] shadow-[0_4px_20px_rgba(201,168,76,0.15)]'
                    : p.disponivel
                    ? 'border-brand-border hover:border-gold-light bg-white'
                    : 'border-brand-border bg-brand-bg opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-semibold text-text-primary">{p.nome}</span>
                      {p.principal && p.disponivel && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-primary/10 text-gold-dark">
                          Principal
                        </span>
                      )}
                      {!p.disponivel && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-text-muted">
                          Em breve
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">{p.descricao}</p>
                  </div>
                  {selecionado && (
                    <div className="w-6 h-6 rounded-full bg-gold-primary flex items-center justify-center shrink-0 ml-3">
                      <Check size={13} strokeWidth={2.5} className="text-white" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setEtapa(1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-brand-input transition-colors"
          >
            <ChevronLeft size={16} />
            Voltar
          </button>
          <button
            onClick={() => setEtapa(3)}
            disabled={!produto || !produtos.find(p => p.id === produto)?.disponivel}
            className="btn-gold flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo — {produto === 'papel_parede' ? 'Detalhes do Papel' : produto === 'persiana' ? 'Detalhes da Persiana' : 'Detalhes da Cortina'}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
