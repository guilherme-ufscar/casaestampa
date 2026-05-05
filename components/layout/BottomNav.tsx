'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { LayoutDashboard, FileText, Users, Settings } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const items = [
    { href: isAdmin ? '/dashboard-admin' : '/dashboard-vendedor', label: 'Início', icon: LayoutDashboard },
    { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
    { href: '/clientes', label: 'Clientes', icon: Users },
    ...(isAdmin ? [{ href: '/configuracoes', label: 'Config', icon: Settings }] : []),
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-border z-50">
      <div className="flex items-center justify-around h-16">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-4 py-2 text-[10px] font-medium transition-colors ${
                active ? 'text-gold-primary' : 'text-text-secondary'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.75} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
