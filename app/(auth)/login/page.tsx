'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password: senha,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setErro('Email ou senha inválidos.')
      return
    }

    const res = await fetch('/api/auth/session')
    const session = await res.json()
    const role = session?.user?.role

    if (role === 'ADMIN') {
      router.push('/dashboard-admin')
    } else {
      router.push('/dashboard-vendedor')
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div className="card-base p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8 flex flex-col items-center">
            {!logoError ? (
              <img src="/logo-casa-estampa.svg" alt="Casa Estampa Interiores" width={180} height={56} className="object-contain" onError={() => setLogoError(true)} />
            ) : (
              <>
                <h1 className="text-2xl font-semibold text-gold-primary tracking-wide">Casa Estampa</h1>
                <div className="h-px bg-gradient-to-r from-transparent via-gold-primary to-transparent mt-2 mb-2 opacity-50 w-full" />
                <p className="text-[11px] font-normal text-text-muted tracking-widest uppercase">Interiores</p>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com.br"
                required
                className="input-base"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <p className="text-sm text-red-500 text-center">{erro}</p>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full h-[50px] rounded-[10px] text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            {/* Esqueci senha */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-gold-primary hover:text-gold-dark transition-colors font-medium"
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-[11px] text-text-muted mt-6">
          © {new Date().getFullYear()} Casa Estampa Interiores
        </p>
      </div>
    </div>
  )
}
