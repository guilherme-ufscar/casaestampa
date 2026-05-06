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
  PlusCircle,
  CalendarCheck,
  UserCog,
  Table2,
} from 'lucide-react'

const navVendedor = [
  { href: '/dashboard-vendedor', label: 'Início', icon: LayoutDashboard },
  { href: '/orcamentos/novo', label: 'Novo Orçamento', icon: PlusCircle },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/painel-pedidos', label: 'Painel de Pedidos', icon: ShoppingBag },
  { href: '/painel-pedidos?status=pronto', label: 'Instalações Agendadas', icon: CalendarCheck },
  { href: '/configuracoes/tabelas', label: 'Tabelas de Preço', icon: Table2 },
]

const navAdmin = [
  { href: '/dashboard-admin', label: 'Início', icon: LayoutDashboard },
  { href: '/orcamentos/novo', label: 'Novo Orçamento', icon: PlusCircle },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/painel-pedidos', label: 'Painel de Pedidos', icon: ShoppingBag },
  { href: '/painel-pedidos?status=pronto', label: 'Instalações Agendadas', icon: CalendarCheck },
]

const navAdminExtra = [
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/configuracoes/usuarios', label: 'Usuários', icon: UserCog },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const navItems = isAdmin ? navAdmin : navVendedor

  function isActive(href: string) {
    const base = href.split('?')[0]
    return pathname === base || (base !== '/dashboard-vendedor' && base !== '/dashboard-admin' && pathname.startsWith(base + '/'))
  }

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-brand-border shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-brand-border">
        <p className="text-gold-primary font-semibold text-lg leading-tight tracking-wide">Casa Estampa</p>
        <p className="text-text-muted font-normal text-[11px] tracking-widest uppercase mt-0.5">Interiores</p>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
              <Icon size={18} strokeWidth={active ? 2 : 1.75} />
              {label}
            </Link>
          )
        })}

        {/* Seção admin */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Administrador</p>
            </div>
            {navAdminExtra.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
                  <Icon size={18} strokeWidth={active ? 2 : 1.75} />
                  {label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-brand-border">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-text-primary truncate">{session?.user?.name}</p>
          <p className="text-[11px] text-text-muted truncate">{session?.user?.email}</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-brand-input rounded-lg transition-colors">
          <LogOut size={18} strokeWidth={1.75} />
          Sair
        </button>
      </div>
    </aside>
  )
}
