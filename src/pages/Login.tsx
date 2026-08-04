import { FormEvent, useState } from 'react'
import { Egg, LogIn, ShieldCheck } from 'lucide-react'
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
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-[#F6F7F9] p-4">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-300/25 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-amber-300/20 blur-[130px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_70px_-25px_rgba(15,23,42,0.28)]">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
              <Egg size={32} />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">AVÍCOLA ERP</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Control integral de la granja</h1>
            <p className="mt-2 text-sm text-slate-500">Accede a producción, inventarios, sanidad, ventas y rentabilidad.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Usuario</label>
              <input type="text" className="input" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="usuario" autoCapitalize="none" autoCorrect="off" autoComplete="username" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Contraseña</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
            </div>

            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              <LogIn size={17} /> {loading ? 'Entrando…' : 'Entrar al sistema'}
            </button>
          </form>

          <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500">
            <ShieldCheck size={14} className="text-emerald-700" /> Acceso protegido y actividad auditada
          </div>
        </div>
      </div>
    </div>
  )
}
