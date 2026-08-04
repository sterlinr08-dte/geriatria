import { Egg } from 'lucide-react'

interface Props {
  texto?: string
  className?: string
}

export default function Cargando({ texto = 'Cargando…', className = '' }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-12 ${className}`}>
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute h-16 w-16 animate-ping rounded-full bg-emerald-300/25" style={{ animationDuration: '1.5s' }} />
        <span className="absolute h-20 w-20 animate-ping rounded-full bg-amber-200/20" style={{ animationDuration: '1.5s', animationDelay: '0.4s' }} />
        <div className="animate-carga-pulse relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-[0_8px_22px_-8px_rgba(46,125,50,0.55)] ring-1 ring-emerald-800/10">
          <Egg size={28} aria-hidden="true" />
        </div>
      </div>

      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="animate-carga-dot h-2.5 w-2.5 rounded-full bg-emerald-600" style={{ animationDelay: `${i * 0.16}s` }} />
        ))}
      </div>

      {texto && <p className="text-sm font-medium text-slate-500" aria-live="polite">{texto}</p>}
    </div>
  )
}
