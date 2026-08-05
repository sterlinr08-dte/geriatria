import type { ReactNode } from 'react'

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

interface Props {
  children: ReactNode
  tone?: StatusTone
  dot?: boolean
}

const tones: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
}

const dots: Record<StatusTone, string> = {
  neutral: 'bg-slate-400', success: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-rose-500', info: 'bg-sky-500',
}

export default function StatusBadge({ children, tone = 'neutral', dot = true }: Props) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>
    {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} aria-hidden="true" />}{children}
  </span>
}
