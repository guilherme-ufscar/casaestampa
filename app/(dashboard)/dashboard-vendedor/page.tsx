import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FileText, Users, ShoppingBag, PlusCircle } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardVendedorPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">
            Olá, {session.user.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            Bem-vindo ao sistema Casa Estampa
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
        <Link href="/orcamentos" className="card-base p-5 hover:shadow-card-hover transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gold-primary/10 flex items-center justify-center">
              <FileText size={20} className="text-gold-primary" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Orçamentos</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">—</p>
          <p className="text-xs text-text-muted mt-1">Em andamento</p>
        </Link>

        <Link href="/clientes" className="card-base p-5 hover:shadow-card-hover transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users size={20} className="text-blue-500" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Clientes</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">—</p>
          <p className="text-xs text-text-muted mt-1">Cadastrados</p>
        </Link>

        <Link href="/pedidos" className="card-base p-5 hover:shadow-card-hover transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <ShoppingBag size={20} className="text-green-500" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Pedidos</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">—</p>
          <p className="text-xs text-text-muted mt-1">Em produção</p>
        </Link>
      </div>
    </div>
  )
}
