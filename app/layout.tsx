import type { Metadata } from "next"
import "./globals.css"
import Providers from "./providers"
import { Suspense } from "react"
import ProgressBar from "@/components/ui/NProgressBar"

export const metadata: Metadata = {
  title: {
    default: "Casa Estampa Interiores",
    template: "%s — Casa Estampa Interiores",
  },
  description: "Sistema de Orçamento de Cortinas",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-poppins antialiased bg-brand-bg text-text-primary">
        <Providers>
          <Suspense fallback={null}>
            <ProgressBar />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  )
}
