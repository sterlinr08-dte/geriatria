import type { ReactNode } from 'react'

interface Props {
  label: string
  htmlFor: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
}

export default function FormField({ label, htmlFor, required, hint, error, children }: Props) {
  const helpId = `${htmlFor}-help`
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}{required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}
      </label>
      {children}
      {(error || hint) && <p id={helpId} className={`mt-1.5 text-xs leading-5 ${error ? 'text-rose-700' : 'text-slate-500'}`}>{error || hint}</p>}
    </div>
  )
}
