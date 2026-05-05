'use client'

import { useSession } from 'next-auth/react'
import { Bell } from 'lucide-react'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="h-16 bg-white border-b border-brand-border flex items-center justify-between px-6 shrink-0">
      <h1 className="text-base font-semibold text-text-primary">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-brand-input transition-colors">
          <Bell size={18} strokeWidth={1.75} className="text-text-secondary" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gold-primary flex items-center justify-center">
          <span className="text-xs font-semibold text-white">
            {session?.user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </span>
        </div>
      </div>
    </header>
  )
}
