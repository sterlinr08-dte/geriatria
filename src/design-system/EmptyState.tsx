import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  description: string
  footer?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, footer }: Props) {
  return (
    <div className="card flex min-h-[360px] flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Icon size={28} aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
      {footer && <div className="mt-6">{footer}</div>}
    </div>
  )
}
