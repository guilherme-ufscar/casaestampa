import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'Casa Estampa Interiores',
  description: 'Sistema de Orçamento de Cortinas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="font-poppins antialiased bg-brand-bg text-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
