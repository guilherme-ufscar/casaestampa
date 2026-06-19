'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import PushNotificationSetup from '@/components/PushNotificationSetup'

const pageTitles: Record<string, string> = {
  '/dashboard-vendedor': 'Dashboard',
  '/dashboard-admin': 'Dashboard',
  '/orcamentos': 'Orçamentos',
  '/clientes': 'Clientes',
  '/arquitetos': 'Arquitetos',
  '/painel-pedidos': 'Painel de Pedidos',
  '/tabelas': 'Tabelas',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
  '/mapa': 'Mapa de Clientes',
  '/agenda': 'Agenda',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const title = Object.entries(pageTitles).find(([key]) =>
    pathname.startsWith(key)
  )?.[1] ?? 'Casa Estampa'

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header title={title} />
        <main className="flex-1 p-8 pb-20 md:pb-8 overflow-auto">
          {children}
        </main>
      </div>
      <BottomNav />
      <PushNotificationSetup />
    </div>
  )
}
