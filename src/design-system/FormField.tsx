import { cloneElement } from 'react'
import type { ReactElement } from 'react'

type FieldControlProps = {
  id?: string
  required?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

interface Props {
  label: string
  htmlFor: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactElement<FieldControlProps>
}

export default function FormField({ label, htmlFor, required, hint, error, children }: Props) {
  const helpId = `${htmlFor}-help`
  const describedBy = [children.props['aria-describedby'], error || hint ? helpId : null].filter(Boolean).join(' ') || undefined
  const control = cloneElement(children, {
    id: children.props.id || htmlFor,
    required: children.props.required ?? required,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : children.props['aria-invalid'],
  })

  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}{required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}
      </label>
      {control}
      {(error || hint) && <p id={helpId} role={error ? 'alert' : undefined} className={`mt-1.5 text-xs leading-5 ${error ? 'text-rose-700' : 'text-slate-500'}`}>{error || hint}</p>}
    </div>
  )
}
