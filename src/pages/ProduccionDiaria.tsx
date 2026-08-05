import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Egg, Plus, RefreshCw, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../lib/empresa'
import { traducirError } from '../lib/errores'
import PageHeader from '../design-system/PageHeader'
import EmptyState from '../design-system/EmptyState'

const WRITERS = ['propietario', 'administrador', 'supervisor', 'produccion']
const PAGE_SIZE = 15

type LoteOption = { id: string; codigo: string; cantidad_actual: number; granjas: { nombre: string } | null; galpones: { nombre: string; codigo: string } | null }
type Produccion = { id: string; fecha: string; aves_vivas_snapshot: number; huevos_recolectados: number; huevos_buenos: number; huevos_rotos: number; huevos_sucios: number; huevos_deformes: number; huevos_descartados: number; lotes: { codigo: string } | null; galpones: { nombre: string } | null }

const hoy = new Date().toISOString().slice(0, 10)
const vacio = { fecha: hoy, lote_id: '', huevos_recolectados: '', huevos_buenos: '', huevos_rotos: '', huevos_sucios: '', huevos_deformes: '', huevos_descartados: '', observaciones: '' }

export default function ProduccionDiaria() {
  const { empresaActiva } = useEmpresa()
  const [lotes, setLotes] = useState<LoteOption[]>([])
  const [registros, setRegistros] = useState<Produccion[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(vacio)
  const loteRef = useRef<HTMLSelectElement>(null)
  const requestRef = useRef(0)

  const puedeEscribir = !!empresaActiva && WRITERS.includes(empresaActiva.rol)
  const loteSeleccionado = lotes.find((l) => l.id === form.lote_id)
  const numeros = useMemo(() => ({
    recolectados: Number(form.huevos_recolectados || 0), buenos: Number(form.huevos_buenos || 0), rotos: Number(form.huevos_rotos || 0),
    sucios: Number(form.huevos_sucios || 0), deformes: Number(form.huevos_deformes || 0), descartados: Number(form.huevos_descartados || 0),
  }), [form])
  const clasificados = numeros.buenos + numeros.rotos + numeros.sucios + numeros.deformes + numeros.descartados
  const postura = loteSeleccionado?.cantidad_actual ? (numeros.recolectados / loteSeleccionado.cantidad_actual) * 100 : 0
  const merma = numeros.recolectados ? ((numeros.rotos + numeros.deformes + numeros.descartados) / numeros.recolectados) * 100 : 0

  const cargarLotes = async () => {
    if (!empresaActiva) return setLotes([])
    const { data } = await supabase.from('lotes').select('id,codigo,cantidad_actual,granjas(nombre),galpones(nombre,codigo)').eq('empresa_id', empresaActiva.id).in('estado', ['ACTIVO','DESARROLLO','PRODUCCION']).is('deleted_at', null).not('galpon_id', 'is', null).order('codigo')
    setLotes((data || []) as unknown as LoteOption[])
  }

  const cargar = async () => {
    const requestId = ++requestRef.current
    if (!empresaActiva) { setRegistros([]); setTotal(0); setLoading(false); return }
    setLoading(true); setError(null)
    const from = page * PAGE_SIZE
    const { data, count, error: queryError } = await supabase.from('produccion_diaria')
      .select('id,fecha,aves_vivas_snapshot,huevos_recolectados,huevos_buenos,huevos_rotos,huevos_sucios,huevos_deformes,huevos_descartados,lotes(codigo),galpones(nombre)', { count: 'exact' })
      .eq('empresa_id', empresaActiva.id).order('fecha', { ascending: false }).range(from, from + PAGE_SIZE - 1)
    if (requestId !== requestRef.current) return
    if (queryError) setError(traducirError(queryError))
    setRegistros((data || []) as unknown as Produccion[]); setTotal(count || 0); setLoading(false)
  }

  useEffect(() => { void cargarLotes(); setPage(0) }, [empresaActiva?.id])
  useEffect(() => { void cargar() }, [empresaActiva?.id, page])
  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) setModalOpen(false) }
    document.addEventListener('keydown', onKey); requestAnimationFrame(() => loteRef.current?.focus())
    return () => document.removeEventListener('keydown', onKey)
  }, [modalOpen, saving])

  const crear = async (event: FormEvent) => {
    event.preventDefault(); setModalError(null)
    if (!empresaActiva || !form.lote_id) return setModalError('Selecciona una empresa y un lote.')
    if (Object.values(numeros).some((n) => !Number.isInteger(n) || n < 0)) return setModalError('Todas las cantidades deben ser enteros no negativos.')
    if (clasificados > numeros.recolectados) return setModalError('La suma clasificada no puede superar los huevos recolectados.')
    setSaving(true)
    const { error: insertError } = await supabase.from('produccion_diaria').insert({
      empresa_id: empresaActiva.id, lote_id: form.lote_id, fecha: form.fecha,
      huevos_recolectados: numeros.recolectados, huevos_buenos: numeros.buenos, huevos_rotos: numeros.rotos,
      huevos_sucios: numeros.sucios, huevos_deformes: numeros.deformes, huevos_descartados: numeros.descartados,
      observaciones: form.observaciones.trim() || null,
    })
    setSaving(false)
    if (insertError) { setModalError(traducirError(insertError)); return }
    setForm(vacio); setModalOpen(false); await cargar()
  }

  return <div className="space-y-5">
    <PageHeader eyebrow="Operación" title="Producción diaria" description="Registra huevos, calidad, postura y merma por lote y fecha."
      actions={puedeEscribir ? <button className="btn-primary inline-flex items-center gap-2" onClick={() => { setForm(vacio); setModalOpen(true) }}><Plus size={16}/> Registrar producción</button> : undefined} />

    <div className="card flex items-center justify-between gap-3"><p className="text-sm text-slate-500">{total.toLocaleString('es-DO')} registros</p><button className="btn-secondary inline-flex items-center gap-2" onClick={() => void cargar()} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> Actualizar</button></div>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    {!loading && registros.length === 0 ? <EmptyState icon={Egg} title="No hay producción registrada" description="Registra la producción del primer lote para alimentar los indicadores."/> :
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Lote</th><th className="px-4 py-3">Galpón</th><th className="px-4 py-3 text-right">Recolectados</th><th className="px-4 py-3 text-right">Postura</th><th className="px-4 py-3 text-right">Merma</th></tr></thead><tbody className="divide-y divide-slate-100">{registros.map(r => { const p = r.aves_vivas_snapshot ? r.huevos_recolectados / r.aves_vivas_snapshot * 100 : 0; const m = r.huevos_recolectados ? (r.huevos_rotos+r.huevos_deformes+r.huevos_descartados)/r.huevos_recolectados*100 : 0; return <tr key={r.id}><td className="px-4 py-3">{new Date(`${r.fecha}T00:00:00`).toLocaleDateString('es-DO')}</td><td className="px-4 py-3 font-medium">{r.lotes?.codigo}</td><td className="px-4 py-3">{r.galpones?.nombre}</td><td className="px-4 py-3 text-right">{r.huevos_recolectados.toLocaleString('es-DO')}</td><td className="px-4 py-3 text-right">{p.toFixed(1)}%</td><td className="px-4 py-3 text-right">{m.toFixed(1)}%</td></tr> })}</tbody></table></div></div>}
    <div className="flex justify-between text-sm text-slate-500"><span>Página {page+1} de {Math.max(1, Math.ceil(total/PAGE_SIZE))}</span><div className="flex gap-2"><button className="btn-secondary" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Anterior</button><button className="btn-secondary" disabled={(page+1)*PAGE_SIZE>=total} onClick={()=>setPage(p=>p+1)}>Siguiente</button></div></div>

    {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" onClick={()=>!saving&&setModalOpen(false)}><div role="dialog" aria-modal="true" aria-labelledby="produccion-title" className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between border-b px-5 py-4"><div><h2 id="produccion-title" className="text-lg font-semibold">Registrar producción</h2><p className="text-sm text-slate-500">La granja, galpón y aves vivas se derivan del lote.</p></div><button aria-label="Cerrar" className="rounded-lg p-2 hover:bg-slate-100" onClick={()=>!saving&&setModalOpen(false)}><X size={18}/></button></div><form onSubmit={crear} className="space-y-4 p-5">{modalError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalError}</div>}<div className="grid gap-4 md:grid-cols-3"><label className="text-sm font-medium">Fecha<input type="date" max={hoy} required className="input mt-1" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></label><label className="text-sm font-medium md:col-span-2">Lote<select ref={loteRef} required className="input mt-1" value={form.lote_id} onChange={e=>setForm({...form,lote_id:e.target.value})}><option value="">Seleccionar lote</option>{lotes.map(l=><option key={l.id} value={l.id}>{l.codigo} · {l.granjas?.nombre} · {l.galpones?.codigo} · {l.cantidad_actual} aves</option>)}</select></label></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(['huevos_recolectados','huevos_buenos','huevos_rotos','huevos_sucios','huevos_deformes','huevos_descartados'] as const).map(c=><label key={c} className="text-sm font-medium capitalize">{c.split('_').join(' ')}<input type="number" min="0" step="1" required className="input mt-1" value={form[c]} onChange={e=>setForm({...form,[c]:e.target.value})}/></label>)}</div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Postura estimada</p><p className="text-xl font-bold text-emerald-800">{postura.toFixed(1)}%</p></div><div className="rounded-xl bg-amber-50 p-3"><p className="text-xs text-amber-700">Merma</p><p className="text-xl font-bold text-amber-800">{merma.toFixed(1)}%</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Sin clasificar</p><p className="text-xl font-bold text-slate-800">{Math.max(0,numeros.recolectados-clasificados)}</p></div></div><p className="text-xs text-slate-500">La postura mostrada es una estimación con la población actual del lote. El valor histórico definitivo se calcula con el snapshot guardado por el servidor.</p><label className="text-sm font-medium">Observaciones<textarea className="input mt-1 min-h-20" value={form.observaciones} onChange={e=>setForm({...form,observaciones:e.target.value})}/></label><div className="flex justify-end gap-2 border-t pt-4"><button type="button" className="btn-secondary" onClick={()=>setModalOpen(false)} disabled={saving}>Cancelar</button><button className="btn-primary" disabled={saving}>{saving?'Guardando…':'Guardar producción'}</button></div></form></div></div>}
  </div>
}
