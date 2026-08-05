import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Boxes, Building2, ChevronLeft, ChevronRight, Plus, RefreshCw, Search, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../lib/empresa'
import { traducirErrorSupabase } from '../lib/errores'
import PageHeader from '../design-system/PageHeader'
import EmptyState from '../design-system/EmptyState'

type GranjaOption = {
  id: string
  codigo: string
  nombre: string
}

type Galpon = {
  id: string
  codigo: string
  nombre: string
  capacidad: number
  tipo_sistema: string
  ventilacion: string | null
  estado: string
  granja_id: string
  granjas: { nombre: string } | null
}

const PAGE_SIZE = 12
const ROLES_ESCRITURA = new Set(['propietario', 'administrador', 'supervisor'])

const estadoClass: Record<string, string> = {
  ACTIVO: 'bg-emerald-50 text-emerald-700',
  INACTIVO: 'bg-slate-100 text-slate-600',
  MANTENIMIENTO: 'bg-amber-50 text-amber-700',
  VACIO: 'bg-sky-50 text-sky-700',
}

const tipoLabel: Record<string, string> = {
  PISO: 'Piso',
  JAULA: 'Jaula',
  AVIARIO: 'Aviario',
  OTRO: 'Otro',
}

export default function Galpones() {
  const { empresaActiva } = useEmpresa()
  const [granjas, setGranjas] = useState<GranjaOption[]>([])
  const [galpones, setGalpones] = useState<Galpon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [granjaFiltro, setGranjaFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const nombreRef = useRef<HTMLInputElement>(null)
  const requestIdRef = useRef(0)
  const [form, setForm] = useState({
    granja_id: '',
    codigo: '',
    nombre: '',
    capacidad: '',
    tipo_sistema: 'PISO',
    ventilacion: '',
  })

  const puedeEscribir = !!empresaActiva && ROLES_ESCRITURA.has(empresaActiva.rol)

  const cargarGranjas = async () => {
    if (!empresaActiva) {
      setGranjas([])
      return
    }
    const { data, error: queryError } = await supabase
      .from('granjas')
      .select('id,codigo,nombre')
      .eq('empresa_id', empresaActiva.id)
      .is('deleted_at', null)
      .eq('estado', 'ACTIVA')
      .order('nombre')
    if (queryError) {
      setError(traducirErrorSupabase(queryError))
      return
    }
    setGranjas((data || []) as GranjaOption[])
  }

  const cargar = async () => {
    if (!empresaActiva) {
      setGalpones([])
      setTotal(0)
      setLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    let query = supabase
      .from('galpones')
      .select('id,codigo,nombre,capacidad,tipo_sistema,ventilacion,estado,granja_id,granjas(nombre)', { count: 'exact' })
      .eq('empresa_id', empresaActiva.id)
      .is('deleted_at', null)
      .order('nombre')
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    const q = search.trim()
    if (q) query = query.or(`codigo.ilike.%${q}%,nombre.ilike.%${q}%`)
    if (granjaFiltro) query = query.eq('granja_id', granjaFiltro)
    if (estadoFiltro) query = query.eq('estado', estadoFiltro)

    const { data, error: queryError, count } = await query
    if (requestId !== requestIdRef.current) return

    if (queryError) {
      setError(traducirErrorSupabase(queryError))
      setGalpones([])
      setTotal(0)
    } else {
      setGalpones((data || []) as unknown as Galpon[])
      setTotal(count || 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    void cargarGranjas()
  }, [empresaActiva?.id])

  useEffect(() => {
    const timer = window.setTimeout(() => void cargar(), search ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [empresaActiva?.id, page, search, granjaFiltro, estadoFiltro])

  useEffect(() => {
    if (!modalOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) setModalOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    requestAnimationFrame(() => nombreRef.current?.focus())
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [modalOpen, saving])

  useEffect(() => setPage(0), [search, granjaFiltro, estadoFiltro, empresaActiva?.id])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const resumen = useMemo(() => ({
    activos: galpones.filter((item) => item.estado === 'ACTIVO').length,
    capacidad: galpones.reduce((sum, item) => sum + item.capacidad, 0),
  }), [galpones])

  const abrirModal = () => {
    setModalError(null)
    setForm({
      granja_id: granjaFiltro || granjas[0]?.id || '',
      codigo: '',
      nombre: '',
      capacidad: '',
      tipo_sistema: 'PISO',
      ventilacion: '',
    })
    setModalOpen(true)
  }

  const crear = async (event: FormEvent) => {
    event.preventDefault()
    if (!empresaActiva) {
      setModalError('Selecciona una empresa antes de crear un galpón.')
      return
    }
    const capacidad = Number(form.capacidad)
    if (!form.granja_id) {
      setModalError('Selecciona la granja a la que pertenecerá el galpón.')
      return
    }
    if (!Number.isInteger(capacidad) || capacidad <= 0) {
      setModalError('La capacidad debe ser un número entero mayor que cero.')
      return
    }

    setSaving(true)
    setModalError(null)
    const { error: insertError } = await supabase.from('galpones').insert({
      empresa_id: empresaActiva.id,
      granja_id: form.granja_id,
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      capacidad,
      tipo_sistema: form.tipo_sistema,
      ventilacion: form.ventilacion.trim() || null,
      estado: 'VACIO',
    })
    setSaving(false)

    if (insertError) {
      setModalError(traducirErrorSupabase(insertError))
      return
    }

    setModalOpen(false)
    await cargar()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operación"
        title="Galpones"
        description="Controla capacidad, sistema productivo y estado operativo de cada galpón."
        actions={puedeEscribir ? <button className="btn-primary inline-flex items-center gap-2" onClick={abrirModal}><Plus size={16} /> Nuevo galpón</button> : undefined}
      />

      {!empresaActiva && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Selecciona o crea una empresa para administrar galpones.</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Registros visibles</p><p className="mt-1 text-2xl font-bold text-slate-950">{galpones.length}</p></div>
        <div className="card"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Galpones activos</p><p className="mt-1 text-2xl font-bold text-emerald-700">{resumen.activos}</p></div>
        <div className="card"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Capacidad visible</p><p className="mt-1 text-2xl font-bold text-slate-950">{resumen.capacidad.toLocaleString('es-DO')}</p></div>
        <div className="card"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total encontrados</p><p className="mt-1 text-2xl font-bold text-slate-950">{total.toLocaleString('es-DO')}</p></div>
      </div>

      <div className="card grid gap-3 lg:grid-cols-[1fr_220px_190px_auto]">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código o nombre" aria-label="Buscar galpones" />
        </div>
        <select className="input" value={granjaFiltro} onChange={(e) => setGranjaFiltro(e.target.value)} aria-label="Filtrar por granja">
          <option value="">Todas las granjas</option>
          {granjas.map((granja) => <option key={granja.id} value={granja.id}>{granja.nombre}</option>)}
        </select>
        <select className="input" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="VACIO">Vacío</option>
          <option value="MANTENIMIENTO">Mantenimiento</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
        <button className="btn-secondary inline-flex items-center justify-center gap-2" onClick={() => void cargar()} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar</button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {!loading && galpones.length === 0 ? (
        <EmptyState icon={Boxes} title="No hay galpones para mostrar" description="Crea el primer galpón o ajusta los filtros de búsqueda." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {galpones.map((galpon) => (
            <article key={galpon.id} className="card space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Boxes size={22} aria-hidden="true" /></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{galpon.codigo}</p><h2 className="text-lg font-semibold text-slate-900">{galpon.nombre}</h2></div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClass[galpon.estado] || 'bg-slate-100 text-slate-600'}`}>{galpon.estado}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Capacidad</p><p className="mt-1 font-semibold text-slate-900">{galpon.capacidad.toLocaleString('es-DO')} aves</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Sistema</p><p className="mt-1 font-semibold text-slate-900">{tipoLabel[galpon.tipo_sistema] || galpon.tipo_sistema}</p></div>
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
                <p className="flex items-center gap-2"><Building2 size={15} /><span>{galpon.granjas?.nombre || 'Granja no disponible'}</span></p>
                <p>Ventilación: <span className="font-medium text-slate-700">{galpon.ventilacion || 'No especificada'}</span></p>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Página {page + 1} de {totalPages}</p>
        <div className="flex gap-2">
          <button className="btn-secondary inline-flex items-center gap-2" disabled={page === 0 || loading} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft size={16} /> Anterior</button>
          <button className="btn-secondary inline-flex items-center gap-2" disabled={page + 1 >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Siguiente <ChevronRight size={16} /></button>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" onClick={() => !saving && setModalOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="nuevo-galpon-title" className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><h2 id="nuevo-galpon-title" className="text-lg font-semibold text-slate-900">Nuevo galpón</h2><p className="mt-1 text-sm text-slate-500">Registra la unidad física dentro de una granja activa.</p></div>
              <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => !saving && setModalOpen(false)} aria-label="Cerrar"><X size={18} /></button>
            </div>
            <form onSubmit={crear} className="space-y-4 p-5">
              {modalError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalError}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Granja<select required className="input mt-1" value={form.granja_id} onChange={(e) => setForm({ ...form, granja_id: e.target.value })}><option value="">Seleccionar granja</option>{granjas.map((granja) => <option key={granja.id} value={granja.id}>{granja.nombre}</option>)}</select></label>
                <label className="text-sm font-medium text-slate-700">Código<input required className="input mt-1" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="GAL-001" /></label>
                <label className="text-sm font-medium text-slate-700">Nombre<input ref={nombreRef} required className="input mt-1" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Galpón Norte" /></label>
                <label className="text-sm font-medium text-slate-700">Capacidad<input required inputMode="numeric" className="input mt-1" value={form.capacidad} onChange={(e) => setForm({ ...form, capacidad: e.target.value.replace(/\D/g, '') })} placeholder="12000" /></label>
                <label className="text-sm font-medium text-slate-700">Sistema<select className="input mt-1" value={form.tipo_sistema} onChange={(e) => setForm({ ...form, tipo_sistema: e.target.value })}><option value="PISO">Piso</option><option value="JAULA">Jaula</option><option value="AVIARIO">Aviario</option><option value="OTRO">Otro</option></select></label>
                <label className="text-sm font-medium text-slate-700">Ventilación<input className="input mt-1" value={form.ventilacion} onChange={(e) => setForm({ ...form, ventilacion: e.target.value })} placeholder="Natural, túnel, mixta…" /></label>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className="btn-secondary" disabled={saving} onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn-primary" disabled={saving || granjas.length === 0}>{saving ? 'Guardando…' : 'Guardar galpón'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
