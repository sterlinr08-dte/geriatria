import type { ReactNode } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react'

export interface DataColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}

interface Props<T> {
  rows: T[]
  columns: DataColumn<T>[]
  getRowKey: (row: T) => string
  loading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyDescription?: string
  searchValue?: string
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  page: number
  totalPages: number
  totalRecords?: number
  onPageChange: (page: number) => void
  toolbar?: ReactNode
}

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }

export default function DataTable<T>({ rows, columns, getRowKey, loading = false, error, emptyTitle = 'Sin registros', emptyDescription = 'No hay información para mostrar con los filtros actuales.', searchValue = '', searchPlaceholder = 'Buscar…', onSearchChange, page, totalPages, totalRecords, onPageChange, toolbar }: Props<T>) {
  return <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_12px_34px_-28px_rgba(15,23,42,.5)]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
      <div className="flex min-w-[240px] flex-1 items-center gap-3">
        {onSearchChange && <label className="relative w-full max-w-md"><span className="sr-only">Buscar</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input className="input h-10 pl-9" value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} /></label>}
        {totalRecords !== undefined && <span className="whitespace-nowrap text-xs font-medium text-slate-500">{totalRecords.toLocaleString('es-DO')} registros</span>}
      </div>
      {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
    </div>

    {error ? <div role="alert" className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><AlertCircle size={22} /></div><h3 className="mt-4 font-semibold text-slate-900">No pudimos cargar la información</h3><p className="mt-1 max-w-lg text-sm text-slate-500">{error}</p></div> :
      <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50/80"><tr>{columns.map((column) => <th key={column.key} className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[.06em] text-slate-500 ${alignClass[column.align || 'left']} ${column.className || ''}`}>{column.header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{loading ? Array.from({ length: 6 }).map((_, index) => <tr key={index}>{columns.map((column) => <td key={column.key} className="px-4 py-4"><div className="h-4 animate-pulse rounded bg-slate-100" /></td>)}</tr>) : rows.length ? rows.map((row) => <tr key={getRowKey(row)} className="transition hover:bg-slate-50/70">{columns.map((column) => <td key={column.key} className={`px-4 py-3.5 text-slate-700 ${alignClass[column.align || 'left']} ${column.className || ''}`}>{column.render(row)}</td>)}</tr>) : <tr><td colSpan={columns.length} className="h-64 px-6 text-center"><h3 className="font-semibold text-slate-900">{emptyTitle}</h3><p className="mt-1 text-sm text-slate-500">{emptyDescription}</p></td></tr>}</tbody></table></div>}

    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3"><p className="text-sm text-slate-500">Página <span className="font-semibold text-slate-700">{page + 1}</span> de {Math.max(totalPages, 1)}</p><div className="flex gap-2"><button type="button" className="btn-ghost h-9 px-3" disabled={page <= 0 || loading} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} />Anterior</button><button type="button" className="btn-ghost h-9 px-3" disabled={page + 1 >= totalPages || loading} onClick={() => onPageChange(page + 1)}>Siguiente<ChevronRight size={16} /></button></div></div>
  </section>
}
