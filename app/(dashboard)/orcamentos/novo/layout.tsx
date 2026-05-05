'use client'

import { OrcamentoProvider } from '@/context/OrcamentoContext'

export default function NovoOrcamentoLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrcamentoProvider>
      {children}
    </OrcamentoProvider>
  )
}
