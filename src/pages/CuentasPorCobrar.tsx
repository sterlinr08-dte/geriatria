import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CalendarClock, CircleDollarSign, ClockAlert, HandCoins, RefreshCw, Search, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../lib/empresa'
import { traducirError } from '../lib/errores'
import { AlertBanner, DataTable, FormField, KpiCard, Modal, PageHeader, StatusBadge } from '../design-system'
import type { DataColumn } from '../design-system'

const PAGE_SIZE = 15
const WRITERS = ['propietario', 'administrador', 'supervisor', 'cobranzas']
type NumericDb = number | string
type EstadoOperativo = 'PENDIENTE' | 'PARCIAL' | 'VENCIDA' | 'SALDADA' | 'ANULADA'

type CuentaRow = {
  id: string
  numero: string
  cliente_nombre: string
  fecha_emision: string
  fecha_vencimiento: string
  cargos: NumericDb
  creditos: NumericDb
  saldo: NumericDb
  dias_vencidos: number
  estado_operativo: EstadoOperativo
}

type MovimientoRow = {
  id: string
  numero: string
  tipo: string
  monto: NumericDb
  fecha: string
  referencia: string | null
}

type FormState = { monto: string; fecha: string; referencia: string; observaciones: string }

const hoy = new Date().toISOString().slice(0, 10)
const formInicial: FormState = { monto: '', fecha: hoy, referencia: '', observaciones: '' }
const dinero = (value: NumericDb) => `RD$ ${Number(value).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fechaLocal = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('es-DO')

function tonoEstado(estado: EstadoOperativo): 'success' | 'danger' | 'warning' | 'neutral' {
  if (estado === 'SALDADA') return 'success'
  if (estado === 'VENCIDA' || estado === 'ANULADA') return 'danger'
  if (estado === 'PARCIAL') return 'warning'
  return 'neutral'
}

export default function CuentasPorCobrar() {
  const { empresaActiva } = useEmpresa()
  const [rows, setRows] = useState<CuentaRow[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('TODOS')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<CuentaRow | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoRow[]>([])
  const [movimientosLoading, setMovimientosLoading] = useState(false)
  const [form, setForm] = useState<FormState>(formInicial)
  const [saving, setSaving] = useState(false)
  const montoRef = useRef<HTMLInputElement>(null)
  const requestRef = useRef(0)
  const movRequestRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const puedeCobrar = !!empresaActiva && WRITERS.includes(empresaActiva.rol)

  const cargar = async (busqueda = search, filtroEstado = estado) => {
    const requestId = ++requestRef.current
    if (!empresaActiva) { setRows([]); setTotal(0); setLoading(false); return }
    setLoading(true); setLoadError(null)
    const from = page * PAGE_SIZE
    let query = supabase
      .from('cuentas_por_cobrar_saldos')
      .select('id,numero,cliente_nombre,fecha_emision,fecha_vencimiento,cargos,creditos,saldo,dias_vencidos,estado_operativo', { count: 'exact' })
      .eq('empresa_id', empresaActiva.id)
      .order('fecha_vencimiento', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    const term = busqueda.trim().replace(/[%_,()*]/g, '')
    if (term) query = query.or(`numero.ilike.%${term}%,cliente_nombre.ilike.%${term}%`)
    if (filtroEstado !== 'TODOS') query = query.eq('estado_operativo', filtroEstado)

    const { data, count, error } = await query
    if (requestId !== requestRef.current) return
    if (error) setLoadError(traducirError(error))
    setRows((data || []) as CuentaRow[])
    setTotal(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    requestRef.current += 1
    movRequestRef.current += 1
    setRows([]); setTotal(0); setPage(0); setSearch(''); setEstado('TODOS')
    setLoadError(null); setActionError(null)
    setModalOpen(false); setSelected(null); setMovimientos([]); setMovimientosLoading(false)
  }, [empresaActiva?.id])

  useEffect(() => { void cargar() }, [empresaActiva?.id, page, estado])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(0); void cargar(search, estado) }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const resumen = useMemo(() => ({
    saldo: rows.reduce((sum, row) => sum + Number(row.saldo), 0),
    vencido: rows.filter((row) => row.estado_operativo === 'VENCIDA').reduce((sum, row) => sum + Number(row.saldo), 0),
    porVencer: rows.filter((row) => row.estado_operativo === 'PENDIENTE' || row.estado_operativo === 'PARCIAL').reduce((sum, row) => sum + Number(row.saldo), 0),
    clientes: new Set(rows.filter((row) => Number(row.saldo) > 0).map((row) => row.cliente_nombre)).size,
  }), [rows])

  const abrirAbono = async (cuenta: CuentaRow) => {
    const requestId = ++movRequestRef.current
    setSelected(cuenta); setForm(formInicial); setActionError(null); setModalOpen(true)
    setMovimientos([]); setMovimientosLoading(true)
    const { data, error } = await supabase.from('movimientos_cxc')
      .select('id,numero,tipo,monto,fecha,referencia')
      .eq('cuenta_id', cuenta.id).is('deleted_at', null)
      .order('fecha', { ascending: false }).order('created_at', { ascending: false }).limit(20)
    if (requestId !== movRequestRef.current) return
    if (error) setActionError(`No fue posible cargar el historial: ${traducirError(error)}`)
    setMovimientos((data || []) as MovimientoRow[])
    setMovimientosLoading(false)
  }

  const registrarAbono = async (event: FormEvent) => {
    event.preventDefault(); setActionError(null)
    if (!selected) return
    const monto = Number(form.monto)
    if (!Number.isFinite(monto) || monto <= 0) return setActionError('El monto del abono debe ser mayor que cero.')
    if (monto > Number(selected.saldo)) return setActionError(`El abono no puede superar el saldo pendiente de ${dinero(selected.saldo)}.`)
    setSaving(true)
    const { error } = await supabase.rpc('avicola_registrar_abono', {
      p_cuenta_id: selected.id,
      p_monto: monto,
      p_fecha: form.fecha,
      p_referencia: form.referencia.trim() || null,
      p_observaciones: form.observaciones.trim() || null,
    })
    setSaving(false)
    if (error) { setActionError(traducirError(error)); return }
    setModalOpen(false); setSelected(null); setForm(formInicial)
    await cargar()
  }

  const columns: DataColumn<CuentaRow>[] = [
    { key: 'cuenta', header: 'Cuenta', render: (row) => <div><p className="font-semibold text-slate-900">{row.numero}</p><p className="text-xs text-slate-500">Emitida {fechaLocal(row.fecha_emision)}</p></div> },
    { key: 'cliente', header: 'Cliente', render: (row) => <span className="font-semibold text-slate-900">{row.cliente_nombre}</span> },
    { key: 'vencimiento', header: 'Vencimiento', render: (row) => <div><p>{fechaLocal(row.fecha_vencimiento)}</p><p className={`text-xs ${row.dias_vencidos > 0 ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>{row.dias_vencidos > 0 ? `${row.dias_vencidos} días vencida` : 'Dentro de plazo'}</p></div> },
    { key: 'progreso', header: 'Progreso', render: (row) => { const cargos = Number(row.cargos); const creditos = Number(row.creditos); const porcentaje = cargos > 0 ? Math.min(100, Math.round((creditos / cargos) * 100)) : 100; return <div className="min-w-36"><div className="mb-1 flex justify-between text-xs"><span>{porcentaje}% cobrado</span><span>{dinero(row.creditos)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${porcentaje}%` }} /></div></div> } },
    { key: 'saldo', header: 'Saldo', align: 'right', render: (row) => <span className="font-semibold text-slate-900">{dinero(row.saldo)}</span> },
    { key: 'estado', header: 'Estado', render: (row) => <StatusBadge tone={tonoEstado(row.estado_operativo)}>{row.estado_operativo.charAt(0) + row.estado_operativo.slice(1).toLowerCase()}</StatusBadge> },
    { key: 'acciones', header: 'Acciones', render: (row) => puedeCobrar && Number(row.saldo) > 0 && !['ANULADA', 'SALDADA'].includes(row.estado_operativo) ? <button className="btn-ghost" onClick={() => void abrirAbono(row)}><HandCoins size={16}/>Registrar abono</button> : <span className="text-xs text-slate-400">Sin acciones</span> },
  ]

  return <div className="space-y-6">
    <PageHeader eyebrow="Finanzas" title="Cuentas por cobrar" description="Controla vencimientos, saldos y abonos con movimientos financieros inmutables." />
    <AlertBanner tone="info" title="Saldo protegido">Los saldos se derivan de cargos y abonos. Ningún usuario puede editarlos directamente.</AlertBanner>
    {actionError && !modalOpen && <AlertBanner tone="error" title="No se pudo completar la acción">{actionError}</AlertBanner>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Total por cobrar" value={dinero(resumen.saldo)} icon={CircleDollarSign} helper="página actual" />
      <KpiCard label="Saldo vencido" value={dinero(resumen.vencido)} icon={ClockAlert} helper="página actual" />
      <KpiCard label="Saldo por vencer" value={dinero(resumen.porVencer)} icon={CalendarClock} helper="pendiente y parcial · página actual" />
      <KpiCard label="Clientes con saldo" value={resumen.clientes} icon={Users} helper="sin duplicar · página actual" />
    </section>

    <DataTable rows={rows} columns={columns} getRowKey={(row) => row.id} loading={loading} error={loadError} page={page} totalPages={Math.ceil(total / PAGE_SIZE)} totalRecords={total} onPageChange={setPage} emptyTitle="No hay cuentas por cobrar" emptyDescription="Las ventas a crédito confirmadas aparecerán aquí automáticamente." toolbar={<div className="flex flex-wrap items-center gap-2"><label className="relative"><span className="sr-only">Buscar cuentas</span><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input w-64 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cuenta o cliente" /></label><select className="input w-40" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(0) }} aria-label="Filtrar por estado"><option value="TODOS">Todos</option><option value="PENDIENTE">Pendientes</option><option value="PARCIAL">Parciales</option><option value="VENCIDA">Vencidas</option><option value="SALDADA">Saldadas</option><option value="ANULADA">Anuladas</option></select><button className="btn-ghost" onClick={() => { setActionError(null); void cargar() }} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>Actualizar</button></div>} />

    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar abono" description={selected ? `${selected.numero} · ${selected.cliente_nombre}` : undefined} initialFocusRef={montoRef} busy={saving} size="lg" footer={<><button type="button" className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button type="submit" form="abono-form" className="btn-primary" disabled={saving}>{saving ? 'Registrando…' : 'Registrar abono'}</button></>}>
      <form id="abono-form" onSubmit={registrarAbono} className="space-y-5">
        {actionError && <AlertBanner tone="error" title="No se pudo registrar el abono">{actionError}</AlertBanner>}
        {selected && <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Total</p><p className="font-semibold">{dinero(selected.cargos)}</p></div><div><p className="text-xs text-slate-500">Abonado</p><p className="font-semibold">{dinero(selected.creditos)}</p></div><div><p className="text-xs text-slate-500">Saldo</p><p className="font-semibold text-emerald-700">{dinero(selected.saldo)}</p></div></div>}
        <div className="grid gap-4 sm:grid-cols-2"><FormField label="Monto" htmlFor="abono-monto" required><input ref={montoRef} id="abono-monto" className="input" type="number" min="0.01" step="0.01" max={selected ? Number(selected.saldo) : undefined} value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} required /></FormField><FormField label="Fecha" htmlFor="abono-fecha" required><input id="abono-fecha" className="input" type="date" max={hoy} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required /></FormField><FormField label="Referencia" htmlFor="abono-referencia"><input id="abono-referencia" className="input" value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} placeholder="Transferencia, recibo…" /></FormField><FormField label="Observaciones" htmlFor="abono-observaciones"><input id="abono-observaciones" className="input" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} /></FormField></div>
        <div><h3 className="mb-2 text-sm font-semibold text-slate-900">Movimientos recientes</h3>{movimientosLoading ? <p className="text-sm text-slate-500">Cargando historial…</p> : movimientos.length === 0 ? <p className="text-sm text-slate-500">No hay movimientos disponibles.</p> : <div className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">{movimientos.map((mov) => <div key={mov.id} className="flex items-center justify-between gap-4 px-3 py-2 text-sm"><div><p className="font-medium text-slate-800">{mov.numero} · {mov.tipo.split('_').join(' ')}</p><p className="text-xs text-slate-500">{fechaLocal(mov.fecha)}{mov.referencia ? ` · ${mov.referencia}` : ''}</p></div><span className={mov.tipo === 'ABONO' ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-900'}>{dinero(mov.monto)}</span></div>)}</div>}</div>
      </form>
    </Modal>
  </div>
}