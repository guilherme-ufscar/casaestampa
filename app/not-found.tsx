import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-gold-primary mb-4">404</p>
        <h1 className="text-2xl font-semibold text-text-primary mb-2">Página não encontrada</h1>
        <p className="text-text-muted mb-8">A página que você está procurando não existe ou foi movida.</p>
        <Link href="/dashboard-vendedor" className="btn-gold inline-flex items-center gap-2 px-6 py-3 rounded-[10px] text-sm font-semibold">
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  )
}
