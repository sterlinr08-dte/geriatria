import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Boxes, Egg, Package, PackageCheck, Plus, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../lib/empresa'
import { traducirError } from '../lib/errores'
import { AlertBanner, DataTable, FormField, KpiCard, Modal, PageHeader, StatusBadge } from '../design-system'
import type { DataColumn } from '../design-system'

const PAGE_SIZE = 15
const WRITERS = ['propietario', 'administrador', 'supervisor', 'produccion', 'empaque']
const CATEGORIAS = ['JUMBO', 'EXTRA_GRANDE', 'GRANDE', 'MEDIANO', 'PEQUENO', 'INDUSTRIAL'] as const
type Categoria = typeof CATEGORIAS[number]

type Clasificacion = {
  id: string
  fecha: string
  jumbo: number
  extra_grande: number
  grande: number
  mediano: number
  pequeno: number
  industrial: number
  lotes: { codigo: string } | null
  galpones: { nombre: string } | null
}
type Presentacion = { id: string; nombre: string; unidades_por_empaque: number; tipo: string }
type Empleado = { id: string; nombre: string }
type EmpaqueRow = {
  id: string
  fecha: string
  categoria: Categoria
  cantidad_empaques: number
  unidades_por_empaque: number
  unidades_totales: number
  estado: string
  presentaciones_huevos: { nombre: string } | null
  lotes: { codigo: string } | null
  empleados: { nombre: string } | null
}
type EmpaqueAcumulado = { clasificacion_id: string; categoria: Categoria; unidades_totales: number }

const categoriaCampo: Record<Categoria, keyof Pick<Clasificacion, 'jumbo' | 'extra_grande' | 'grande' | 'mediano' | 'pequeno' | 'industrial'>> = {
  JUMBO: 'jumbo', EXTRA_GRANDE: 'extra_grande', GRANDE: 'grande', MEDIANO: 'mediano', PEQUENO: 'pequeno', INDUSTRIAL: 'industrial',
}
const categoriaLabel: Record<Categoria, string> = {
  JUMBO: 'Jumbo', EXTRA_GRANDE: 'Extra Grande', GRANDE: 'Grande', MEDIANO: 'Mediano', PEQUENO: 'Pequeño', INDUSTRIAL: 'Industrial',
}
const hoy = new Date().toISOString().slice(0, 10)
const vacio = { clasificacion_id: '', categoria: 'GRANDE' as Categoria, presentacion_id: '', cantidad_empaques: '', operario_id: '', fecha: hoy, observaciones: '' }

export default function Empaque() {
  const { empresaActiva } = useEmpresa()
  const [rows, setRows] = useState<EmpaqueRow[]>([])
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([])
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [acumulados, setAcumulados] = useState<EmpaqueAcumulado[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(vacio)
  const clasificacionRef = useRef<HTMLSelectElement>(null)
  const requestRef = useRef(0)

  const puedeEscribir = !!empresaActiva && WRITERS.includes(empresaActiva.rol)
  const clasificacion = clasificaciones.find((item) => item.id === form.clasificacion_id)
  const presentacion = presentaciones.find((item) => item.id === form.presentacion_id)
  const cantidadEmpaques = Number(form.cantidad_empaques || 0)
  const unidadesSolicitadas = cantidadEmpaques * (presentacion?.unidades_por_empaque || 0)
  const totalCategoria = clasificacion ? clasificacion[categoriaCampo[form.categoria]] : 0
  const yaEmpacado = acumulados.filter((item) => item.clasificacion_id === form.clasificacion_id && item.categoria === form.categoria).reduce((sum, item) => sum + item.unidades_totales, 0)
  const disponible = Math.max(0, totalCategoria - yaEmpacado)

  const cargarCatalogos = async () => {
    if (!empresaActiva) { setClasificaciones([]); setPresentaciones([]); setEmpleados([]); setAcumulados([]); return }
    const empresaId = empresaActiva.id
    const [clasResult, presResult, empResult, acumResult] = await Promise.all([
      supabase.from('clasificaciones_huevos_activas').select('id,fecha,jumbo,extra_grande,grande,mediano,pequeno,industrial,lotes(codigo),galpones(nombre)').eq('empresa_id', empresaId).order('fecha', { ascending: false }).limit(250),
      supabase.from('presentaciones_huevos').select('id,nombre,unidades_por_empaque,tipo').eq('empresa_id', empresaId).eq('activo', true).is('deleted_at', null).order('unidades_por_empaque'),
      supabase.from('empleados').select('id,nombre').eq('empresa_id', empresaId).eq('activo', true).order('nombre'),
      supabase.from('empaques_huevos').select('clasificacion_id,categoria,unidades_totales').eq('empresa_id', empresaId).eq('estado', 'CONFIRMADO').is('deleted_at', null),
    ])
    if (empresaActiva.id !== empresaId) return
    const firstError = clasResult.error || presResult.error || empResult.error || acumResult.error
    if (firstError) { setError(traducirError(firstError)); return }
    setClasificaciones((clasResult.data || []) as unknown as Clasificacion[])
    setPresentaciones((presResult.data || []) as Presentacion[])
    setEmpleados((empResult.data || []) as Empleado[])
    setAcumulados((acumResult.data || []) as EmpaqueAcumulado[])
  }

  const cargar = async () => {
    const requestId = ++requestRef.current
    if (!empresaActiva) { setRows([]); setTotal(0); setLoading(false); return }
    setLoading(true); setError(null)
    const from = page * PAGE_SIZE
    const { data, count, error: queryError } = await supabase.from('empaques_huevos')
      .select('id,fecha,categoria,cantidad_empaques,unidades_por_empaque,unidades_totales,estado,presentaciones_huevos(nombre),lotes(codigo),empleados(nombre)', { count: 'exact' })
      .eq('empresa_id', empresaActiva.id).is('deleted_at', null).order('fecha', { ascending: false }).range(from, from + PAGE_SIZE - 1)
    if (requestId !== requestRef.current) return
    if (queryError) setError(traducirError(queryError))
    setRows((data || []) as unknown as EmpaqueRow[]); setTotal(count || 0); setLoading(false)
  }

  useEffect(() => { void cargarCatalogos(); setPage(0) }, [empresaActiva?.id])
  useEffect(() => { void cargar() }, [empresaActiva?.id, page])

  const resumen = useMemo(() => ({
    empaques: rows.reduce((sum, row) => sum + row.cantidad_empaques, 0),
    unidades: rows.reduce((sum, row) => sum + row.unidades_totales, 0),
    presentaciones: new Set(rows.map((row) => row.presentaciones_huevos?.nombre).filter(Boolean)).size,
  }), [rows])

  const crear = async (event: FormEvent) => {
    event.preventDefault(); setModalError(null)
    if (!empresaActiva || !form.clasificacion_id || !form.presentacion_id) return setModalError('Selecciona la clasificación y la presentación.')
    if (!Number.isInteger(cantidadEmpaques) || cantidadEmpaques <= 0) return setModalError('La cantidad de empaques debe ser un entero mayor que cero.')
    if (unidadesSolicitadas > disponible) return setModalError(`Solo hay ${disponible.toLocaleString('es-DO')} huevos disponibles en esta categoría.`)
    setSaving(true)
    const { error: insertError } = await supabase.from('empaques_huevos').insert({
      empresa_id: empresaActiva.id, clasificacion_id: form.clasificacion_id, categoria: form.categoria,
      presentacion_id: form.presentacion_id, cantidad_empaques: cantidadEmpaques,
      operario_id: form.operario_id || null, fecha: form.fecha, observaciones: form.observaciones.trim() || null, estado: 'CONFIRMADO',
    })
    setSaving(false)
    if (insertError) { setModalError(traducirError(insertError)); return }
    setModalOpen(false); setForm(vacio); await Promise.all([cargar(), cargarCatalogos()])
  }

  const columns: DataColumn<EmpaqueRow>[] = [
    { key: 'fecha', header: 'Fecha', render: (row) => new Date(`${row.fecha}T00:00:00`).toLocaleDateString('es-DO') },
    { key: 'lote', header: 'Lote', render: (row) => <span className="font-semibold text-slate-900">{row.lotes?.codigo || 'Sin lote'}</span> },
    { key: 'categoria', header: 'Clasificación', render: (row) => categoriaLabel[row.categoria] },
    { key: 'presentacion', header: 'Presentación', render: (row) => row.presentaciones_huevos?.nombre || 'Sin presentación' },
    { key: 'empaques', header: 'Empaques', align: 'right', render: (row) => row.cantidad_empaques.toLocaleString('es-DO') },
    { key: 'unidades', header: 'Unidades', align: 'right', render: (row) => row.unidades_totales.toLocaleString('es-DO') },
    { key: 'operario', header: 'Operario', render: (row) => row.empleados?.nombre || 'No asignado' },
    { key: 'estado', header: 'Estado', render: (row) => <StatusBadge tone={row.estado === 'CONFIRMADO' ? 'success' : row.estado === 'ANULADO' ? 'danger' : 'warning'}>{row.estado === 'CONFIRMADO' ? 'Confirmado' : row.estado === 'ANULADO' ? 'Anulado' : 'Borrador'}</StatusBadge> },
  ]

  return <div className="space-y-6">
    <PageHeader eyebrow="Operación" title="Empaque" description="Convierte huevos clasificados en presentaciones comerciales y genera la entrada de inventario." actions={puedeEscribir ? <button className="btn-primary" onClick={() => { setForm(vacio); setModalOpen(true) }}><Plus size={16}/> Registrar empaque</button> : undefined} />
    <AlertBanner tone="info" title="Disponibilidad protegida">Clasificación es la única fuente de cantidad. El backend bloquea la clasificación durante cada operación para impedir sobreempaque concurrente.</AlertBanner>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Registros visibles" value={rows.length} icon={Boxes} helper="página actual" />
      <KpiCard label="Empaques visibles" value={resumen.empaques.toLocaleString('es-DO')} icon={Package} helper="todas las presentaciones" />
      <KpiCard label="Unidades empacadas" value={resumen.unidades.toLocaleString('es-DO')} icon={Egg} helper="entrada de inventario" />
      <KpiCard label="Presentaciones usadas" value={resumen.presentaciones} icon={PackageCheck} helper="en registros visibles" />
    </section>
    <DataTable rows={rows} columns={columns} getRowKey={(row) => row.id} loading={loading} error={error} page={page} totalPages={Math.ceil(total / PAGE_SIZE)} totalRecords={total} onPageChange={setPage} emptyTitle="No hay empaques registrados" emptyDescription="Registra el primer empaque desde una clasificación confirmada." toolbar={<button className="btn-ghost" onClick={() => { void cargar(); void cargarCatalogos() }} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>Actualizar</button>} />

    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar empaque" description="El sistema calcula las unidades y valida la disponibilidad en Supabase." initialFocusRef={clasificacionRef} busy={saving} size="lg" footer={<><button type="button" className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button type="submit" form="empaque-form" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Confirmar empaque'}</button></>}>
      <form id="empaque-form" onSubmit={crear} className="space-y-5">
        {modalError && <AlertBanner tone="error" title="No se pudo guardar">{modalError}</AlertBanner>}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Clasificación" htmlFor="empaque-clasificacion" required><select ref={clasificacionRef} id="empaque-clasificacion" className="input" value={form.clasificacion_id} onChange={(event) => setForm({ ...form, clasificacion_id: event.target.value })} required><option value="">Seleccionar clasificación</option>{clasificaciones.map((item) => <option key={item.id} value={item.id}>{new Date(`${item.fecha}T00:00:00`).toLocaleDateString('es-DO')} · {item.lotes?.codigo} · {item.galpones?.nombre}</option>)}</select></FormField>
          <FormField label="Categoría" htmlFor="empaque-categoria" required><select id="empaque-categoria" className="input" value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value as Categoria })}>{CATEGORIAS.map((categoria) => <option key={categoria} value={categoria}>{categoriaLabel[categoria]}</option>)}</select></FormField>
          <FormField label="Presentación" htmlFor="empaque-presentacion" required><select id="empaque-presentacion" className="input" value={form.presentacion_id} onChange={(event) => setForm({ ...form, presentacion_id: event.target.value })} required><option value="">Seleccionar presentación</option>{presentaciones.map((item) => <option key={item.id} value={item.id}>{item.nombre} · {item.unidades_por_empaque} huevos</option>)}</select></FormField>
          <FormField label="Cantidad de empaques" htmlFor="empaque-cantidad" required><input id="empaque-cantidad" className="input" type="number" min="1" step="1" value={form.cantidad_empaques} onChange={(event) => setForm({ ...form, cantidad_empaques: event.target.value })} required /></FormField>
          <FormField label="Fecha" htmlFor="empaque-fecha" required><input id="empaque-fecha" className="input" type="date" max={hoy} value={form.fecha} onChange={(event) => setForm({ ...form, fecha: event.target.value })} required /></FormField>
          <FormField label="Operario" htmlFor="empaque-operario"><select id="empaque-operario" className="input" value={form.operario_id} onChange={(event) => setForm({ ...form, operario_id: event.target.value })}><option value="">No asignado</option>{empleados.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></FormField>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${unidadesSolicitadas > 0 && unidadesSolicitadas <= disponible ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          <p className="text-sm font-semibold">Disponibles: {disponible.toLocaleString('es-DO')} · Solicitados: {unidadesSolicitadas.toLocaleString('es-DO')}</p>
          <p className="mt-1 text-xs">Restantes estimados: {Math.max(0, disponible - unidadesSolicitadas).toLocaleString('es-DO')}. Supabase vuelve a validar al guardar.</p>
        </div>
        <FormField label="Observaciones" htmlFor="empaque-observaciones"><textarea id="empaque-observaciones" className="input min-h-24" value={form.observaciones} onChange={(event) => setForm({ ...form, observaciones: event.target.value })} /></FormField>
      </form>
    </Modal>
  </div>
}
