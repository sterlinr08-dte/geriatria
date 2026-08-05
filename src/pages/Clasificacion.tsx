import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Boxes, Egg, PackageCheck, Percent, Plus, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../lib/empresa'
import { traducirError } from '../lib/errores'
import { AlertBanner, DataTable, FormField, KpiCard, Modal, PageHeader, StatusBadge } from '../design-system'
import type { DataColumn } from '../design-system'

const PAGE_SIZE = 15
const WRITERS = ['propietario', 'administrador', 'supervisor', 'produccion']
const campos = ['jumbo','extra_grande','grande','mediano','pequeno','industrial','sucios','rotos','fisurados'] as const
type Campo = typeof campos[number]

type ProduccionOption = { id: string; fecha: string; huevos_recolectados: number; lotes: { codigo: string } | null; galpones: { nombre: string } | null }
type Row = { id: string; fecha: string; jumbo: number; extra_grande: number; grande: number; mediano: number; pequeno: number; industrial: number; sucios: number; rotos: number; fisurados: number; estado: string; produccion_diaria: { huevos_recolectados: number } | null; lotes: { codigo: string } | null; galpones: { nombre: string } | null }

const vacio: Record<Campo, string> & { produccion_id: string; observaciones: string } = {
  produccion_id: '', jumbo: '', extra_grande: '', grande: '', mediano: '', pequeno: '', industrial: '', sucios: '', rotos: '', fisurados: '', observaciones: '',
}

const etiquetas: Record<Campo, string> = {
  jumbo: 'Jumbo', extra_grande: 'Extra Grande', grande: 'Grande', mediano: 'Mediano', pequeno: 'Pequeño', industrial: 'Industrial', sucios: 'Sucios', rotos: 'Rotos', fisurados: 'Fisurados',
}

export default function Clasificacion() {
  const { empresaActiva } = useEmpresa()
  const [rows, setRows] = useState<Row[]>([])
  const [producciones, setProducciones] = useState<ProduccionOption[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(vacio)
  const produccionRef = useRef<HTMLSelectElement>(null)
  const requestRef = useRef(0)

  const puedeEscribir = !!empresaActiva && WRITERS.includes(empresaActiva.rol)
  const produccionSeleccionada = producciones.find((item) => item.id === form.produccion_id)
  const valores = useMemo(() => Object.fromEntries(campos.map((campo) => [campo, Number(form[campo] || 0)])) as Record<Campo, number>, [form])
  const suma = campos.reduce((totalActual, campo) => totalActual + valores[campo], 0)
  const diferencia = (produccionSeleccionada?.huevos_recolectados || 0) - suma

  const cargarProducciones = async () => {
    if (!empresaActiva) { setProducciones([]); return }
    const empresaId = empresaActiva.id
    const [{ data, error: queryError }, { data: existentes, error: existentesError }] = await Promise.all([
      supabase.from('produccion_diaria').select('id,fecha,huevos_recolectados,lotes(codigo),galpones(nombre)').eq('empresa_id', empresaId).gt('huevos_recolectados', 0).order('fecha', { ascending: false }).limit(250),
      supabase.from('clasificaciones_huevos').select('produccion_id').eq('empresa_id', empresaId).is('deleted_at', null).neq('estado', 'ANULADA'),
    ])
    if (empresaActiva.id !== empresaId) return
    if (queryError || existentesError) { setError(traducirError(queryError || existentesError)); return }
    const usados = new Set((existentes || []).map((item) => item.produccion_id))
    setProducciones(((data || []) as unknown as ProduccionOption[]).filter((item) => !usados.has(item.id)))
  }

  const cargar = async () => {
    const requestId = ++requestRef.current
    if (!empresaActiva) { setRows([]); setTotal(0); setLoading(false); return }
    setLoading(true); setError(null)
    const from = page * PAGE_SIZE
    const { data, count, error: queryError } = await supabase.from('clasificaciones_huevos')
      .select('id,fecha,jumbo,extra_grande,grande,mediano,pequeno,industrial,sucios,rotos,fisurados,estado,produccion_diaria(huevos_recolectados),lotes(codigo),galpones(nombre)', { count: 'exact' })
      .eq('empresa_id', empresaActiva.id).is('deleted_at', null).order('fecha', { ascending: false }).range(from, from + PAGE_SIZE - 1)
    if (requestId !== requestRef.current) return
    if (queryError) setError(traducirError(queryError))
    setRows((data || []) as unknown as Row[]); setTotal(count || 0); setLoading(false)
  }

  useEffect(() => { void cargarProducciones(); setPage(0) }, [empresaActiva?.id])
  useEffect(() => { void cargar() }, [empresaActiva?.id, page])

  const resumen = useMemo(() => {
    const clasificados = rows.reduce((sum, row) => sum + campos.reduce((subtotal, campo) => subtotal + row[campo], 0), 0)
    const comercializables = rows.reduce((sum, row) => sum + row.jumbo + row.extra_grande + row.grande + row.mediano + row.pequeno + row.industrial, 0)
    return { clasificados, comercializables, merma: clasificados ? ((clasificados - comercializables) / clasificados) * 100 : 0 }
  }, [rows])

  const crear = async (event: FormEvent) => {
    event.preventDefault(); setModalError(null)
    if (!empresaActiva || !form.produccion_id) return setModalError('Selecciona una empresa y una producción pendiente.')
    if (campos.some((campo) => !Number.isInteger(valores[campo]) || valores[campo] < 0)) return setModalError('Todas las cantidades deben ser enteros no negativos.')
    if (diferencia !== 0) return setModalError(`La clasificación debe coincidir exactamente con la producción. Diferencia: ${diferencia.toLocaleString('es-DO')}.`)
    setSaving(true)
    const { error: insertError } = await supabase.from('clasificaciones_huevos').insert({ empresa_id: empresaActiva.id, produccion_id: form.produccion_id, ...valores, observaciones: form.observaciones.trim() || null, estado: 'CONFIRMADA' })
    setSaving(false)
    if (insertError) { setModalError(traducirError(insertError)); return }
    setModalOpen(false); setForm(vacio); await Promise.all([cargar(), cargarProducciones()])
  }

  const columns: DataColumn<Row>[] = [
    { key: 'fecha', header: 'Fecha', render: (row) => new Date(`${row.fecha}T00:00:00`).toLocaleDateString('es-DO') },
    { key: 'lote', header: 'Lote / Galpón', render: (row) => <div><p className="font-semibold text-slate-900">{row.lotes?.codigo || 'Sin lote'}</p><p className="text-xs text-slate-500">{row.galpones?.nombre || 'Sin galpón'}</p></div> },
    { key: 'recolectados', header: 'Recolectados', align: 'right', render: (row) => (row.produccion_diaria?.huevos_recolectados || 0).toLocaleString('es-DO') },
    { key: 'comercial', header: 'Comercializables', align: 'right', render: (row) => (row.jumbo + row.extra_grande + row.grande + row.mediano + row.pequeno + row.industrial).toLocaleString('es-DO') },
    { key: 'merma', header: 'Merma', align: 'right', render: (row) => { const totalRow = campos.reduce((sum, campo) => sum + row[campo], 0); const mala = row.sucios + row.rotos + row.fisurados; return `${totalRow ? (mala / totalRow * 100).toFixed(1) : '0.0'}%` } },
    { key: 'estado', header: 'Estado', render: (row) => <StatusBadge tone={row.estado === 'CONFIRMADA' ? 'success' : 'warning'}>{row.estado === 'CONFIRMADA' ? 'Confirmada' : 'Anulada'}</StatusBadge> },
  ]

  return <div className="space-y-6">
    <PageHeader eyebrow="Operación" title="Clasificación" description="Distribuye cada producción por tamaño y condición sin alterar el total recolectado." actions={puedeEscribir ? <button className="btn-primary" onClick={() => { setForm(vacio); setModalOpen(true) }}><Plus size={16}/> Nueva clasificación</button> : undefined} />
    <AlertBanner tone="info" title="Fuente única de verdad">El total recolectado proviene exclusivamente de Producción Diaria. Clasificación solo distribuye ese total.</AlertBanner>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Registros visibles" value={rows.length} icon={Boxes} helper="en la página actual" />
      <KpiCard label="Huevos clasificados" value={resumen.clasificados.toLocaleString('es-DO')} icon={Egg} helper="categorías visibles" />
      <KpiCard label="Comercializables" value={resumen.comercializables.toLocaleString('es-DO')} icon={PackageCheck} helper="tamaños vendibles" />
      <KpiCard label="Merma visible" value={resumen.merma.toFixed(1)} suffix="%" icon={Percent} helper="sucios, rotos y fisurados" />
    </section>
    <DataTable rows={rows} columns={columns} getRowKey={(row) => row.id} loading={loading} error={error} page={page} totalPages={Math.ceil(total / PAGE_SIZE)} totalRecords={total} onPageChange={setPage} emptyTitle="No hay clasificaciones" emptyDescription="Selecciona una producción pendiente y registra su distribución por categorías." toolbar={<button className="btn-ghost" onClick={() => { void cargar(); void cargarProducciones() }} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>Actualizar</button>} />

    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva clasificación" description="La suma debe coincidir exactamente con los huevos recolectados." initialFocusRef={produccionRef} busy={saving} size="lg" footer={<><button type="button" className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button type="submit" form="clasificacion-form" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Confirmar clasificación'}</button></>}>
      <form id="clasificacion-form" onSubmit={crear} className="space-y-5">
        {modalError && <AlertBanner tone="error" title="No se pudo guardar">{modalError}</AlertBanner>}
        <FormField label="Producción pendiente" htmlFor="clasificacion-produccion" required hint="Solo aparecen producciones todavía no clasificadas."><select ref={produccionRef} id="clasificacion-produccion" className="input" value={form.produccion_id} onChange={(event) => setForm({ ...form, produccion_id: event.target.value })} required><option value="">Seleccionar producción</option>{producciones.map((item) => <option key={item.id} value={item.id}>{new Date(`${item.fecha}T00:00:00`).toLocaleDateString('es-DO')} · {item.lotes?.codigo} · {item.galpones?.nombre} · {item.huevos_recolectados.toLocaleString('es-DO')} huevos</option>)}</select></FormField>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{campos.map((campo) => <FormField key={campo} label={etiquetas[campo]} htmlFor={`clasificacion-${campo}`} required><input id={`clasificacion-${campo}`} className="input" type="number" min="0" step="1" value={form[campo]} onChange={(event) => setForm({ ...form, [campo]: event.target.value })} required /></FormField>)}</div>
        <div className={`rounded-xl border px-4 py-3 ${diferencia === 0 && produccionSeleccionada ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}><p className="text-sm font-semibold">Clasificados: {suma.toLocaleString('es-DO')} · Recolectados: {(produccionSeleccionada?.huevos_recolectados || 0).toLocaleString('es-DO')}</p><p className="mt-1 text-xs">Diferencia: {diferencia.toLocaleString('es-DO')}</p></div>
        <FormField label="Observaciones" htmlFor="clasificacion-observaciones" hint="Registra incidencias de calidad o clasificación."><textarea id="clasificacion-observaciones" className="input min-h-24" value={form.observaciones} onChange={(event) => setForm({ ...form, observaciones: event.target.value })} /></FormField>
      </form>
    </Modal>
  </div>
}
