import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Building2, ChevronLeft, ChevronRight, MapPin, Plus, RefreshCw, Search, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../lib/empresa'
import { mensajeErrorSupabase } from '../lib/errores'
import PageHeader from '../design-system/PageHeader'
import EmptyState from '../design-system/EmptyState'

type Granja = {
  id: string
  codigo: string
  nombre: string
  municipio: string | null
  provincia: string | null
  estado: string
  foto_url: string | null
}

const PAGE_SIZE = 12
const ROLES_ESCRITURA = new Set(['propietario', 'administrador', 'supervisor'])

const estadoClass: Record<string, string> = {
  ACTIVA: 'bg-emerald-50 text-emerald-700',
  INACTIVA: 'bg-slate-100 text-slate-600',
  MANTENIMIENTO: 'bg-amber-50 text-amber-700',
}

export default function Granjas() {
  const { empresaActiva } = useEmpresa()
  const [granjas, setGranjas] = useState<Granja[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ codigo: '', nombre: '', municipio: '', provincia: '' })
  const nombreInputRef = useRef<HTMLInputElement>(null)
  const requestIdRef = useRef(0)

  const puedeEscribir = !!empresaActiva && ROLES_ESCRITURA.has(empresaActiva.rol)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const cargar = async () => {
    const requestId = ++requestIdRef.current
    if (!empresaActiva) {
      setGranjas([])
      setTotal(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    let query = supabase
      .from('granjas')
      .select('id,codigo,nombre,municipio,provincia,estado,foto_url', { count: 'exact' })
      .eq('empresa_id', empresaActiva.id)
      .is('deleted_at', null)

    const termino = search.trim()
    if (termino) {
      const safe = termino.replace(/[,%()]/g, ' ')
      query = query.or(`codigo.ilike.%${safe}%,nombre.ilike.%${safe}%,municipio.ilike.%${safe}%,provincia.ilike.%${safe}%`)
    }

    const { data, count, error: queryError } = await query.order('nombre').range(from, to)
    if (requestId !== requestIdRef.current) return

    if (queryError) {
      setError(mensajeErrorSupabase(queryError))
      setGranjas([])
      setTotal(0)
    } else {
      setGranjas((data || []) as Granja[])
      setTotal(count || 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void cargar(), 250)
    return () => window.clearTimeout(timeout)
  }, [empresaActiva?.id, page, search])

  useEffect(() => {
    setPage(1)
  }, [empresaActiva?.id, search])

  useEffect(() => {
    if (!modalOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) setModalOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    requestAnimationFrame(() => nombreInputRef.current?.focus())
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [modalOpen, saving])

  const resumen = useMemo(() => `${total} ${total === 1 ? 'granja' : 'granjas'}`, [total])

  const abrirModal = () => {
    if (!empresaActiva) {
      setError('Selecciona una empresa antes de crear una granja.')
      return
    }
    if (!puedeEscribir) return
    setModalError(null)
    setModalOpen(true)
  }

  const crear = async (event: FormEvent) => {
    event.preventDefault()
    if (!empresaActiva) {
      setModalError('Selecciona una empresa antes de guardar.')
      return
    }
    if (!puedeEscribir) {
      setModalError('Tu rol no permite crear granjas.')
      return
    }

    setSaving(true)
    setModalError(null)
    const { error: insertError } = await supabase.from('granjas').insert({
      empresa_id: empresaActiva.id,
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      municipio: form.municipio.trim() || null,
      provincia: form.provincia.trim() || null,
      estado: 'ACTIVA',
    })
    setSaving(false)

    if (insertError) {
      setModalError(mensajeErrorSupabase(insertError))
      return
    }

    setForm({ codigo: '', nombre: '', municipio: '', provincia: '' })
    setModalOpen(false)
    setPage(1)
    await cargar()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operación"
        title="Granjas"
        description="Administra las unidades productivas de la empresa activa."
        actions={puedeEscribir ? <button className="btn-primary inline-flex items-center gap-2" onClick={abrirModal}><Plus size={16} /> Nueva granja</button> : undefined}
      />

      {!empresaActiva && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No tienes una empresa activa. Selecciona o crea una empresa para administrar granjas.
        </div>
      )}

      <div className="card flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código, nombre o ubicación" aria-label="Buscar granjas" />
        </div>
        <span className="text-sm text-slate-500">{resumen}</span>
        <button className="btn-secondary inline-flex items-center justify-center gap-2" onClick={() => void cargar()} disabled={loading || !empresaActiva}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar</button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {!loading && granjas.length === 0 ? (
        <EmptyState icon={Building2} title="No hay granjas registradas" description="Crea la primera granja para comenzar a organizar galpones, lotes y producción." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {granjas.map((granja) => (
            <article key={granja.id} className="card overflow-hidden p-0">
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50">
                <Building2 size={42} className="text-emerald-700" aria-hidden="true" />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{granja.codigo}</p><h2 className="text-lg font-semibold text-slate-900">{granja.nombre}</h2></div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClass[granja.estado] || 'bg-slate-100 text-slate-600'}`}>{granja.estado}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500"><MapPin size={16} aria-hidden="true" /><span>{[granja.municipio, granja.provincia].filter(Boolean).join(', ') || 'Ubicación pendiente'}</span></div>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-end gap-2" aria-label="Paginación de granjas">
          <button className="btn-secondary inline-flex items-center gap-1" disabled={page === 1 || loading} onClick={() => setPage((actual) => Math.max(1, actual - 1))}><ChevronLeft size={16} /> Anterior</button>
          <span className="px-2 text-sm text-slate-600">Página {page} de {totalPages}</span>
          <button className="btn-secondary inline-flex items-center gap-1" disabled={page >= totalPages || loading} onClick={() => setPage((actual) => Math.min(totalPages, actual + 1))}>Siguiente <ChevronRight size={16} /></button>
        </nav>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" onClick={() => !saving && setModalOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="nueva-granja-title" className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 id="nueva-granja-title" className="text-lg font-semibold text-slate-900">Nueva granja</h2><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setModalOpen(false)} aria-label="Cerrar" disabled={saving}><X size={18} /></button></div>
            <form onSubmit={crear} className="space-y-4 p-5">
              {modalError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{modalError}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Código<input required className="input mt-1" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="GRA-002" /></label>
                <label className="text-sm font-medium text-slate-700">Nombre<input ref={nombreInputRef} required className="input mt-1" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Granja Norte" /></label>
                <label className="text-sm font-medium text-slate-700">Municipio<input className="input mt-1" value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} /></label>
                <label className="text-sm font-medium text-slate-700">Provincia<input className="input mt-1" value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} /></label>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar granja'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
