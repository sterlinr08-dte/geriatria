import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ClipboardList, Clock3, Plus, RefreshCw, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../lib/empresa'
import { traducirError } from '../lib/errores'
import PageHeader from '../design-system/PageHeader'
import EmptyState from '../design-system/EmptyState'

const PAGE_SIZE = 15
const WRITERS = ['propietario', 'administrador', 'supervisor', 'produccion']
const hoy = new Date().toISOString().slice(0, 10)

type LoteOption = { id: string; codigo: string; cantidad_actual: number; granjas: { nombre: string } | null; galpones: { codigo: string; nombre: string } | null }
type EmpleadoOption = { id: string; nombre: string }
type RecoleccionRow = {
  id: string; fecha: string; numero_recorrido: number; hora_inicio: string; hora_fin: string | null
  cantidad: number; sector: string | null; estado: string
  lotes: { codigo: string } | null; galpones: { nombre: string } | null; empleados: { nombre: string } | null
}

const formVacio = { fecha: hoy, lote_id: '', numero_recorrido: '1', hora_inicio: '', hora_fin: '', operario_id: '', sector: '', cantidad: '', observaciones: '' }

export default function Recoleccion() {
  const { empresaActiva } = useEmpresa()
  const [lotes, setLotes] = useState<LoteOption[]>([])
  const [empleados, setEmpleados] = useState<EmpleadoOption[]>([])
  const [rows, setRows] = useState<RecoleccionRow[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(formVacio)
  const loteRef = useRef<HTMLSelectElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef(0)

  const puedeEscribir = !!empresaActiva && WRITERS.includes(empresaActiva.rol)
  const resumen = useMemo(() => ({
    cantidad: rows.reduce((sum, row) => sum + row.cantidad, 0),
    cerrados: rows.filter((row) => row.estado === 'CERRADO').length,
  }), [rows])

  const cargarCatalogos = async () => {
    if (!empresaActiva) { setLotes([]); setEmpleados([]); return }
    const empresaId = empresaActiva.id
    const [lotesResult, empleadosResult] = await Promise.all([
      supabase.from('lotes').select('id,codigo,cantidad_actual,granjas(nombre),galpones(codigo,nombre)').eq('empresa_id', empresaId).in('estado', ['ACTIVO','DESARROLLO','PRODUCCION']).is('deleted_at', null).not('galpon_id', 'is', null).order('codigo'),
      supabase.from('empleados').select('id,nombre').eq('empresa_id', empresaId).eq('activo', true).order('nombre'),
    ])
    if (empresaActiva.id !== empresaId) return
    if (lotesResult.error || empleadosResult.error) setError(traducirError(lotesResult.error || empleadosResult.error))
    setLotes((lotesResult.data || []) as unknown as LoteOption[])
    setEmpleados((empleadosResult.data || []) as EmpleadoOption[])
  }

  const cargar = async () => {
    const requestId = ++requestRef.current
    if (!empresaActiva) { setRows([]); setTotal(0); setLoading(false); return }
    setLoading(true); setError(null)
    const from = page * PAGE_SIZE
    const { data, count, error: queryError } = await supabase.from('recolecciones')
      .select('id,fecha,numero_recorrido,hora_inicio,hora_fin,cantidad,sector,estado,lotes(codigo),galpones(nombre),empleados(nombre)', { count: 'exact' })
      .eq('empresa_id', empresaActiva.id).is('deleted_at', null)
      .order('fecha', { ascending: false }).order('numero_recorrido', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (requestId !== requestRef.current) return
    if (queryError) setError(traducirError(queryError))
    setRows((data || []) as unknown as RecoleccionRow[])
    setTotal(count || 0); setLoading(false)
  }

  useEffect(() => { void cargarCatalogos(); setPage(0) }, [empresaActiva?.id])
  useEffect(() => { void cargar() }, [empresaActiva?.id, page])
  useEffect(() => {
    if (!modalOpen) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) setModalOpen(false)
      if (event.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),select:not([disabled]),input:not([disabled]),textarea:not([disabled])'))
        if (!focusables.length) return
        const first = focusables[0]; const last = focusables[focusables.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => loteRef.current?.focus())
    return () => { document.removeEventListener('keydown', onKey); previous?.focus() }
  }, [modalOpen, saving])

  const crear = async (event: FormEvent) => {
    event.preventDefault(); setModalError(null)
    if (!empresaActiva || !form.lote_id) return setModalError('Selecciona una empresa y un lote.')
    const cantidad = Number(form.cantidad)
    const recorrido = Number(form.numero_recorrido)
    if (!Number.isInteger(cantidad) || cantidad < 0) return setModalError('La cantidad debe ser un entero no negativo.')
    if (!Number.isInteger(recorrido) || recorrido <= 0) return setModalError('El número de recorrido debe ser mayor que cero.')
    if (form.hora_fin && form.hora_fin < form.hora_inicio) return setModalError('La hora final no puede ser anterior a la hora inicial.')

    setSaving(true)
    const { error: insertError } = await supabase.from('recolecciones').insert({
      empresa_id: empresaActiva.id, lote_id: form.lote_id, fecha: form.fecha,
      numero_recorrido: recorrido, hora_inicio: form.hora_inicio, hora_fin: form.hora_fin || null,
      operario_id: form.operario_id || null, sector: form.sector.trim() || null,
      cantidad, observaciones: form.observaciones.trim() || null, estado: form.hora_fin ? 'CERRADO' : 'ABIERTO',
    })
    setSaving(false)
    if (insertError) { setModalError(traducirError(insertError)); return }
    setForm(formVacio); setModalOpen(false); await cargar()
  }

  return <div className="space-y-5">
    <PageHeader eyebrow="Operación" title="Recolección" description="Registra recorridos, tiempos, operarios y cantidades; Producción Diaria se consolida automáticamente."
      actions={puedeEscribir ? <button className="btn-primary inline-flex items-center gap-2" onClick={() => { setForm(formVacio); setModalOpen(true) }}><Plus size={16}/> Nuevo recorrido</button> : undefined} />

    <section className="grid gap-3 sm:grid-cols-3">
      <div className="card"><p className="text-xs uppercase tracking-wide text-slate-400">Recorridos visibles</p><p className="mt-2 text-2xl font-bold">{rows.length}</p></div>
      <div className="card"><p className="text-xs uppercase tracking-wide text-slate-400">Huevos visibles</p><p className="mt-2 text-2xl font-bold">{resumen.cantidad.toLocaleString('es-DO')}</p></div>
      <div className="card"><p className="text-xs uppercase tracking-wide text-slate-400">Recorridos cerrados</p><p className="mt-2 text-2xl font-bold">{resumen.cerrados}</p></div>
    </section>

    <div className="card flex items-center justify-between gap-3"><p className="text-sm text-slate-500">{total.toLocaleString('es-DO')} registros encontrados</p><button className="btn-secondary inline-flex items-center gap-2" onClick={() => void cargar()} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> Actualizar</button></div>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

    {!loading && rows.length === 0 ? <EmptyState icon={ClipboardList} title="No hay recorridos registrados" description="Registra el primer recorrido para consolidar la producción del lote."/> :
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Lote</th><th className="px-4 py-3">Recorrido</th><th className="px-4 py-3">Horario</th><th className="px-4 py-3">Operario</th><th className="px-4 py-3 text-right">Cantidad</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(row => <tr key={row.id}><td className="px-4 py-3">{new Date(`${row.fecha}T00:00:00`).toLocaleDateString('es-DO')}</td><td className="px-4 py-3 font-medium">{row.lotes?.codigo || '—'}</td><td className="px-4 py-3">#{row.numero_recorrido}</td><td className="px-4 py-3">{row.hora_inicio.slice(0,5)}{row.hora_fin ? `–${row.hora_fin.slice(0,5)}` : ''}</td><td className="px-4 py-3">{row.empleados?.nombre || 'Sin asignar'}</td><td className="px-4 py-3 text-right font-semibold">{row.cantidad.toLocaleString('es-DO')}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.estado === 'CERRADO' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{row.estado}</span></td></tr>)}</tbody></table></div></div>}

    <div className="flex justify-between text-sm text-slate-500"><span>Página {page+1} de {Math.max(1, Math.ceil(total/PAGE_SIZE))}</span><div className="flex gap-2"><button className="btn-secondary" disabled={page===0} onClick={()=>setPage(value=>value-1)}>Anterior</button><button className="btn-secondary" disabled={(page+1)*PAGE_SIZE>=total} onClick={()=>setPage(value=>value+1)}>Siguiente</button></div></div>

    {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" onClick={()=>!saving&&setModalOpen(false)}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="recoleccion-title" className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl" onClick={event=>event.stopPropagation()}><div className="flex items-center justify-between border-b px-5 py-4"><div><h2 id="recoleccion-title" className="text-lg font-semibold">Nuevo recorrido</h2><p className="text-sm text-slate-500">La granja y el galpón se derivan automáticamente desde el lote.</p></div><button aria-label="Cerrar" className="rounded-lg p-2 hover:bg-slate-100" onClick={()=>!saving&&setModalOpen(false)}><X size={18}/></button></div><form onSubmit={crear} className="space-y-4 p-5">{modalError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalError}</div>}<div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Fecha<input type="date" max={hoy} required className="input mt-1" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></label><label className="text-sm font-medium">Lote<select ref={loteRef} required className="input mt-1" value={form.lote_id} onChange={e=>setForm({...form,lote_id:e.target.value})}><option value="">Seleccionar lote</option>{lotes.map(lote=><option key={lote.id} value={lote.id}>{lote.codigo} · {lote.galpones?.codigo} · {lote.cantidad_actual} aves</option>)}</select></label><label className="text-sm font-medium">Número de recorrido<input type="number" min="1" step="1" required className="input mt-1" value={form.numero_recorrido} onChange={e=>setForm({...form,numero_recorrido:e.target.value})}/></label><label className="text-sm font-medium">Operario<select className="input mt-1" value={form.operario_id} onChange={e=>setForm({...form,operario_id:e.target.value})}><option value="">Sin asignar</option>{empleados.map(empleado=><option key={empleado.id} value={empleado.id}>{empleado.nombre}</option>)}</select></label><label className="text-sm font-medium">Hora de inicio<input type="time" required className="input mt-1" value={form.hora_inicio} onChange={e=>setForm({...form,hora_inicio:e.target.value})}/></label><label className="text-sm font-medium">Hora final<input type="time" className="input mt-1" value={form.hora_fin} onChange={e=>setForm({...form,hora_fin:e.target.value})}/></label><label className="text-sm font-medium">Sector<input className="input mt-1" value={form.sector} onChange={e=>setForm({...form,sector:e.target.value})} placeholder="Sector A"/></label><label className="text-sm font-medium">Cantidad<input type="number" min="0" step="1" required className="input mt-1" value={form.cantidad} onChange={e=>setForm({...form,cantidad:e.target.value})}/></label></div><label className="text-sm font-medium">Observaciones<textarea className="input mt-1 min-h-20" value={form.observaciones} onChange={e=>setForm({...form,observaciones:e.target.value})}/></label><div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><Clock3 size={16} className="mr-2 inline"/>Al guardar, la cantidad se suma automáticamente a Producción Diaria.</div><div className="flex justify-end gap-2 border-t pt-4"><button type="button" className="btn-secondary" onClick={()=>setModalOpen(false)} disabled={saving}>Cancelar</button><button className="btn-primary" disabled={saving}>{saving?'Guardando…':'Guardar recorrido'}</button></div></form></div></div>}
  </div>
}
