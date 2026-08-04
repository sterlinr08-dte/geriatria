import { FormEvent, useState } from 'react'
import { Egg, LogIn, ShieldCheck, TrendingUp } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { usuarioAEmail } from '../lib/constants'

export default function Login() {
  const { signIn } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(usuarioAEmail(usuario), password)
    setLoading(false)
    if (error) setError('Usuario o contraseña incorrectos. Verifica e intenta de nuevo.')
  }

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-[#F4F7F4] p-4">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-300/25 blur-[130px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-amber-300/20 blur-[130px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-emerald-200/30 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-[0_30px_60px_-15px_rgba(18,58,37,0.22)]">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#123A25] text-white shadow-lg shadow-emerald-950/20">
              <Egg size={40} strokeWidth={1.8} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Enterprise 2026</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">AVÍCOLA ERP</h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Gestiona producción, inventario, sanidad, ventas y rentabilidad desde una sola plataforma.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-usuario" className="mb-1.5 block text-sm font-medium text-slate-700">Usuario</label>
              <input
                id="login-usuario"
                type="text"
                className="input w-full lowercase"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="usuario"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700">Contraseña</label>
              <input
                id="login-password"
                type="password"
                className="input w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              <LogIn size={17} />
              {loading ? 'Entrando…' : 'Entrar al sistema'}
            </button>
          </form>

          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 text-xs text-slate-500">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
              <ShieldCheck size={16} className="text-emerald-700" /> Acceso seguro
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
              <TrendingUp size={16} className="text-amber-700" /> Datos en tiempo real
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
