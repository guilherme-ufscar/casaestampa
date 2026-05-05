import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FileText, Users, ShoppingBag, PlusCircle, BarChart2, Settings } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardAdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard-vendedor')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">
            Painel Administrativo
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            Visão geral do sistema
          </p>
        </div>
        <Link
          href="/orcamentos/novo"
          className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-semibold transition-all hover:opacity-90"
        >
          <PlusCircle size={16} />
          Novo Orçamento
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/orcamentos" className="card-base p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gold-primary/10 flex items-center justify-center">
              <FileText size={20} className="text-gold-primary" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Orçamentos</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">—</p>
          <p className="text-xs text-text-muted mt-1">Total no sistema</p>
        </Link>

        <Link href="/clientes" className="card-base p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users size={20} className="text-blue-500" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Clientes</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">—</p>
          <p className="text-xs text-text-muted mt-1">Cadastrados</p>
        </Link>

        <Link href="/pedidos" className="card-base p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <ShoppingBag size={20} className="text-green-500" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Pedidos</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">—</p>
          <p className="text-xs text-text-muted mt-1">Em produção</p>
        </Link>

        <Link href="/relatorios" className="card-base p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <BarChart2 size={20} className="text-purple-500" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Relatórios</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">—</p>
          <p className="text-xs text-text-muted mt-1">Disponíveis</p>
        </Link>

        <Link href="/configuracoes" className="card-base p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Settings size={20} className="text-text-secondary" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Configurações</span>
          </div>
          <p className="text-sm font-medium text-text-primary">Tecidos, Trilhos</p>
          <p className="text-xs text-text-muted mt-1">Margens e fatores</p>
        </Link>
      </div>
    </div>
  )
}
