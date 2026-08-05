import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

export type AlertTone = 'info' | 'success' | 'warning' | 'error'

interface Props {
  tone?: AlertTone
  title?: string
  children: ReactNode
  onDismiss?: () => void
}

const styles: Record<AlertTone, { box: string; icon: typeof Info }> = {
  info: { box: 'border-sky-200 bg-sky-50 text-sky-800', icon: Info },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle2 },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-800', icon: TriangleAlert },
  error: { box: 'border-rose-200 bg-rose-50 text-rose-800', icon: AlertCircle },
}

export default function AlertBanner({ tone = 'info', title, children, onDismiss }: Props) {
  const Icon = styles[tone].icon
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-[14px] border px-4 py-3.5 ${styles[tone].box}`}>
      <Icon size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm leading-6">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>
      </div>
      {onDismiss && <button type="button" onClick={onDismiss} className="rounded-lg p-1 opacity-70 hover:bg-white/60 hover:opacity-100" aria-label="Cerrar alerta"><X size={16} /></button>}
    </div>
  )
}
