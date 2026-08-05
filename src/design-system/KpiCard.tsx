import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

interface Props {
  label: string
  value: ReactNode
  icon: LucideIcon
  helper?: string
  trend?: number
  suffix?: string
}

export default function KpiCard({ label, value, icon: Icon, helper, trend, suffix }: Props) {
  const hasTrend = trend !== undefined
  const TrendIcon = trend === 0 ? Minus : (trend ?? 0) > 0 ? ArrowUpRight : ArrowDownRight
  const trendClass = trend === 0 ? 'text-slate-500' : (trend ?? 0) > 0 ? 'text-emerald-700' : 'text-rose-700'

  return (
    <article className="rounded-[14px] border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_-24px_rgba(15,23,42,.45)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="truncate text-xs font-semibold uppercase tracking-[.08em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}{suffix && <span className="ml-1 text-sm font-semibold text-slate-500">{suffix}</span>}</p></div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={20} aria-hidden="true" /></div>
      </div>
      {(helper || hasTrend) && <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs">{hasTrend && <span className={`inline-flex items-center gap-1 font-semibold ${trendClass}`}><TrendIcon size={14} aria-hidden="true" />{`${Math.abs(trend).toFixed(1)}%`}</span>}{helper && <span className="truncate text-slate-500">{helper}</span>}</div>}
    </article>
  )
}
