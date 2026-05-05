'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  ShoppingBag,
  BarChart2,
} from 'lucide-react'

const navVendedor = [
  { href: '/dashboard-vendedor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
]

const navAdmin = [
  { href: '/dashboard-admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const navItems = isAdmin ? navAdmin : navVendedor

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-brand-border shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-brand-border">
        <p className="text-gold-primary font-semibold text-lg leading-tight tracking-wide">
          Casa Estampa
        </p>
        <p className="text-text-muted font-normal text-[11px] tracking-widest uppercase mt-0.5">
          Interiores
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'sidebar-item-active' : 'sidebar-item-inactive'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.75} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-brand-border">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-text-primary truncate">
            {session?.user?.name}
          </p>
          <p className="text-[11px] text-text-muted truncate">
            {session?.user?.email}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-brand-input rounded-lg transition-colors"
        >
          <LogOut size={18} strokeWidth={1.75} />
          Sair
        </button>
      </div>
    </aside>
  )
}
