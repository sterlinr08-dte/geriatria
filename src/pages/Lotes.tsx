import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Bird, CalendarDays, Plus, RefreshCw, Search, Users, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../lib/empresa'
import { traducirError } from '../lib/errores'
import PageHeader from '../design-system/PageHeader'
import EmptyState from '../design-system/EmptyState'

const PAGE_SIZE = 12
const WRITERS = ['propietario', 'administrador', 'supervisor']

type Opcion = { id: string; nombre: string; granja_id?: string; capacidad?: number; estado?: string }
type Lote = {
  id: string; codigo: string; fecha_ingreso: string; fecha_nacimiento: string | null
  cantidad_inicial: number; cantidad_actual: number; costo_total: number; estado: string
  granjas: { nombre: string } | null; galpones: { nombre: string; codigo: string } | null
  razas: { nombre: string } | null; proveedores: { nombre: string } | null
}

const estadoClass: Record<string, string> = {
  ACTIVO: 'bg-emerald-50 text-emerald-700', DESARROLLO: 'bg-blue-50 text-blue-700',
  PRODUCCION: 'bg-amber-50 text-amber-700', DESCARTADO: 'bg-slate-100 text-slate-600', CERRADO: 'bg-rose-50 text-rose-700',
}

export default function Lotes() {
  const { empresaActiva } = useEmpresa()
  const [lotes, setLotes] = useState<Lote[]>([])
  const [granjas, setGranjas] = useState<Opcion[]>([])
  const [galpones, setGalpones] = useState<Opcion[]>([])
  const [razas, setRazas] = useState<Opcion[]>([])
  const [proveedores, setProveedores] = useState<Opcion[]>([])
  const [search, setSearch] = useState('')
  const [granjaFiltro, setGranjaFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const nombreRef = useRef<HTMLInputElement>(null)
  const requestRef = useRef(0)
  const [form, setForm] = useState({ codigo: '', granja_id: '', galpon_id: '', raza_id: '', proveedor_id: '', fecha_ingreso: '', fecha_nacimiento: '', cantidad_inicial: '', costo_total: '' })

  const puedeEscribir = !!empresaActiva && WRITERS.includes(empresaActiva.rol)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const galponesFormulario = useMemo(() => galpones.filter((g) => g.granja_id === form.granja_id && ['ACTIVO', 'VACIO'].includes(g.estado || '')), [galpones, form.granja_id])

  const cargarCatalogos = async () => {
    if (!empresaActiva) return
    const [g, ga, r, p] = await Promise.all([
      supabase.from('granjas').select('id,nombre').eq('empresa_id', empresaActiva.id).eq('estado', 'ACTIVA').is('deleted_at', null).order('nombre'),
      supabase.from('galpones').select('id,nombre,granja_id,capacidad,estado').eq('empresa_id', empresaActiva.id).is('deleted_at', null).order('nombre'),
      supabase.from('razas').select('id,nombre').eq('empresa_id', empresaActiva.id).eq('activa', true).order('nombre'),
      supabase.from('proveedores').select('id,nombre').eq('empresa_id', empresaActiva.id).order('nombre'),
    ])
    setGranjas((g.data || []) as Opcion[]); setGalpones((ga.data || []) as Opcion[])
    setRazas((r.data || []) as Opcion[]); setProveedores((p.data || []) as Opcion[])
  }

  const cargar = async () => {
    const requestId = ++requestRef.current
    if (!empresaActiva) { setLotes([]); setTotal(0); setLoading(false); return }
    setLoading(true); setError(null)
    let query = supabase.from('lotes')
      .select('id,codigo,fecha_ingreso,fecha_nacimiento,cantidad_inicial,cantidad_actual,costo_total,estado,granjas(nombre),galpones(nombre,codigo),razas(nombre),proveedores(nombre)', { count: 'exact' })
      .eq('empresa_id', empresaActiva.id).is('deleted_at', null)
    if (search.trim()) query = query.or(`codigo.ilike.%${search.trim()}%`)
    if (granjaFiltro) query = query.eq('granja_id', granjaFiltro)
    if (estadoFiltro) query = query.eq('estado', estadoFiltro)
    const from = page * PAGE_SIZE
    const { data, count, error: queryError } = await query.order('fecha_ingreso', { ascending: false }).range(from, from + PAGE_SIZE - 1)
    if (requestId !== requestRef.current) return
    if (queryError) setError(traducirError(queryError))
    setLotes((data || []) as unknown as Lote[]); setTotal(count || 0); setLoading(false)
  }

  useEffect(() => { void cargarCatalogos() }, [empresaActiva?.id])
  useEffect(() => { void cargar() }, [empresaActiva?.id, search, granjaFiltro, estadoFiltro, page])
  useEffect(() => { setPage(0) }, [search, granjaFiltro, estadoFiltro, empresaActiva?.id])
  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) setModalOpen(false) }
    document.addEventListener('keydown', onKey); requestAnimationFrame(() => nombreRef.current?.focus())
    return () => document.removeEventListener('keydown', onKey)
  }, [modalOpen, saving])

  const crear = async (event: FormEvent) => {
    event.preventDefault(); setModalError(null)
    if (!empresaActiva) { setModalError('Selecciona una empresa activa.'); return }
    const cantidad = Number(form.cantidad_inicial)
    if (!Number.isInteger(cantidad) || cantidad <= 0) { setModalError('La cantidad inicial debe ser un entero mayor que cero.'); return }
    const galpon = galpones.find((g) => g.id === form.galpon_id)
    if (galpon?.capacidad && cantidad > galpon.capacidad) { setModalError(`La cantidad supera la capacidad del galpón (${galpon.capacidad.toLocaleString('es-DO')}).`); return }
    setSaving(true)
    const { error: insertError } = await supabase.from('lotes').insert({
      empresa_id: empresaActiva.id, granja_id: form.granja_id, galpon_id: form.galpon_id || null,
      raza_id: form.raza_id || null, proveedor_id: form.proveedor_id || null,
      codigo: form.codigo.trim().toUpperCase(), fecha_ingreso: form.fecha_ingreso,
      fecha_nacimiento: form.fecha_nacimiento || null, cantidad_inicial: cantidad, cantidad_actual: cantidad,
      costo_total: Number(form.costo_total || 0), estado: 'ACTIVO',
    })
    setSaving(false)
    if (insertError) { setModalError(traducirError(insertError)); return }
    setForm({ codigo: '', granja_id: '', galpon_id: '', raza_id: '', proveedor_id: '', fecha_ingreso: '', fecha_nacimiento: '', cantidad_inicial: '', costo_total: '' })
    setModalOpen(false); await cargar()
  }

  return <div className="space-y-5">
    <PageHeader eyebrow="Operación" title="Lotes de gallinas" description="Controla ingreso, ubicación, población, raza, costo y estado productivo de cada lote."
      actions={puedeEscribir ? <button className="btn-primary inline-flex items-center gap-2" onClick={() => setModalOpen(true)}><Plus size={16}/> Nuevo lote</button> : undefined} />

    <section className="grid gap-3 sm:grid-cols-3">
      <div className="card"><p className="text-xs uppercase tracking-wide text-slate-400">Lotes visibles</p><p className="mt-2 text-2xl font-bold text-slate-900">{total}</p></div>
      <div className="card"><p className="text-xs uppercase tracking-wide text-slate-400">Aves actuales</p><p className="mt-2 text-2xl font-bold text-slate-900">{lotes.reduce((a,l)=>a+l.cantidad_actual,0).toLocaleString('es-DO')}</p></div>
      <div className="card"><p className="text-xs uppercase tracking-wide text-slate-400">Costo visible</p><p className="mt-2 text-2xl font-bold text-slate-900">RD$ {lotes.reduce((a,l)=>a+Number(l.costo_total),0).toLocaleString('es-DO')}</p></div>
    </section>

    <div className="card grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
      <label className="relative"><span className="sr-only">Buscar lotes</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input pl-9" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar por código"/></label>
      <select className="input" value={granjaFiltro} onChange={(e)=>setGranjaFiltro(e.target.value)} aria-label="Filtrar por granja"><option value="">Todas las granjas</option>{granjas.map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}</select>
      <select className="input" value={estadoFiltro} onChange={(e)=>setEstadoFiltro(e.target.value)} aria-label="Filtrar por estado"><option value="">Todos los estados</option>{['ACTIVO','DESARROLLO','PRODUCCION','DESCARTADO','CERRADO'].map(e=><option key={e}>{e}</option>)}</select>
      <button className="btn-secondary inline-flex items-center justify-center gap-2" onClick={()=>void cargar()} disabled={loading}><RefreshCw size={16} className={loading?'animate-spin':''}/> Actualizar</button>
    </div>

    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    {!empresaActiva ? <EmptyState icon={Bird} title="Selecciona una empresa" description="Necesitas una empresa activa para consultar y crear lotes."/> : !loading && lotes.length===0 ? <EmptyState icon={Bird} title="No hay lotes registrados" description="Crea el primer lote para comenzar el control productivo."/> :
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{lotes.map(l=><article key={l.id} className="card space-y-4">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{l.codigo}</p><h2 className="text-lg font-semibold text-slate-900">{l.granjas?.nombre || 'Granja pendiente'}</h2></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClass[l.estado] || 'bg-slate-100 text-slate-600'}`}>{l.estado}</span></div>
        <div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">Aves actuales</p><p className="mt-1 font-semibold text-slate-900">{l.cantidad_actual.toLocaleString('es-DO')}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">Mortalidad</p><p className="mt-1 font-semibold text-slate-900">{(l.cantidad_inicial-l.cantidad_actual).toLocaleString('es-DO')}</p></div></div>
        <div className="space-y-2 text-sm text-slate-500"><p className="flex items-center gap-2"><Users size={16}/> {l.galpones ? `${l.galpones.codigo} · ${l.galpones.nombre}` : 'Sin galpón asignado'}</p><p className="flex items-center gap-2"><Bird size={16}/> {l.razas?.nombre || 'Raza pendiente'}</p><p className="flex items-center gap-2"><CalendarDays size={16}/> Ingreso: {new Date(`${l.fecha_ingreso}T00:00:00`).toLocaleDateString('es-DO')}</p></div>
      </article>)}</div>}

    <div className="flex items-center justify-between text-sm text-slate-500"><span>Página {page+1} de {totalPages}</span><div className="flex gap-2"><button className="btn-secondary" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Anterior</button><button className="btn-secondary" disabled={page+1>=totalPages} onClick={()=>setPage(p=>p+1)}>Siguiente</button></div></div>

    {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" onClick={()=>{if(!saving)setModalOpen(false)}}><div role="dialog" aria-modal="true" aria-labelledby="nuevo-lote-title" className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 id="nuevo-lote-title" className="text-lg font-semibold">Nuevo lote</h2><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={()=>setModalOpen(false)} disabled={saving} aria-label="Cerrar"><X size={18}/></button></div>
      <form onSubmit={crear} className="space-y-4 p-5">{modalError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalError}</div>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">Código<input ref={nombreRef} required className="input mt-1" value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value})} placeholder="LOT-2026-001"/></label>
          <label className="text-sm font-medium text-slate-700">Granja<select required className="input mt-1" value={form.granja_id} onChange={e=>setForm({...form,granja_id:e.target.value,galpon_id:''})}><option value="">Seleccionar</option>{granjas.map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Galpón<select className="input mt-1" value={form.galpon_id} onChange={e=>setForm({...form,galpon_id:e.target.value})}><option value="">Sin asignar</option>{galponesFormulario.map(g=><option key={g.id} value={g.id}>{g.nombre} · cap. {g.capacidad}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Raza<select className="input mt-1" value={form.raza_id} onChange={e=>setForm({...form,raza_id:e.target.value})}><option value="">Seleccionar</option>{razas.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Proveedor<select className="input mt-1" value={form.proveedor_id} onChange={e=>setForm({...form,proveedor_id:e.target.value})}><option value="">Seleccionar</option>{proveedores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Fecha de ingreso<input required type="date" className="input mt-1" value={form.fecha_ingreso} onChange={e=>setForm({...form,fecha_ingreso:e.target.value})}/></label>
          <label className="text-sm font-medium text-slate-700">Fecha de nacimiento<input type="date" className="input mt-1" value={form.fecha_nacimiento} onChange={e=>setForm({...form,fecha_nacimiento:e.target.value})}/></label>
          <label className="text-sm font-medium text-slate-700">Cantidad inicial<input required type="number" min="1" step="1" className="input mt-1" value={form.cantidad_inicial} onChange={e=>setForm({...form,cantidad_inicial:e.target.value})}/></label>
          <label className="text-sm font-medium text-slate-700">Costo total RD$<input type="number" min="0" step="0.01" className="input mt-1" value={form.costo_total} onChange={e=>setForm({...form,costo_total:e.target.value})}/></label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className="btn-secondary" disabled={saving} onClick={()=>setModalOpen(false)}>Cancelar</button><button className="btn-primary" disabled={saving}>{saving?'Guardando…':'Guardar lote'}</button></div>
      </form></div></div>}
  </div>
}
