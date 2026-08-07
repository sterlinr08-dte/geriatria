import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Building2, CircleDollarSign, Pencil, Plus, RefreshCw, Search, ToggleLeft, ToggleRight, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../lib/empresa'
import { traducirError } from '../lib/errores'
import { AlertBanner, DataTable, FormField, KpiCard, Modal, PageHeader, StatusBadge } from '../design-system'
import type { DataColumn } from '../design-system'

const PAGE_SIZE = 15
const WRITERS = ['propietario', 'administrador', 'supervisor', 'compras']
type NumericDb = number | string

type Proveedor = {
  id: string
  codigo: string | null
  nombre: string
  identificacion: string | null
  contacto_nombre: string | null
  telefono: string | null
  correo: string | null
  direccion: string | null
  dias_credito: number
  limite_credito: NumericDb
  activo: boolean
  notas: string | null
}

type FormState = {
  nombre: string
  codigo: string
  identificacion: string
  contacto_nombre: string
  telefono: string
  correo: string
  direccion: string
  dias_credito: string
  limite_credito: string
  notas: string
}

const formInicial: FormState = {
  nombre: '', codigo: '', identificacion: '', contacto_nombre: '', telefono: '', correo: '',
  direccion: '', dias_credito: '0', limite_credito: '0', notas: '',
}

const dinero = (value: NumericDb) => `RD$ ${Number(value).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const limpio = (value: string) => value.trim() || null

export default function Proveedores() {
  const { empresaActiva } = useEmpresa()
  const [rows, setRows] = useState<Proveedor[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('TODOS')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Proveedor | null>(null)
  const [form, setForm] = useState<FormState>(formInicial)
  const [saving, setSaving] = useState(false)
  const nombreRef = useRef<HTMLInputElement>(null)
  const requestRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const puedeEscribir = !!empresaActiva && WRITERS.includes(empresaActiva.rol)

  const cargar = async (busqueda = search, filtroEstado = estado) => {
    const requestId = ++requestRef.current
    if (!empresaActiva) { setRows([]); setTotal(0); setLoading(false); return }
    setLoading(true); setLoadError(null)
    const from = page * PAGE_SIZE
    let query = supabase
      .from('proveedores_avicola')
      .select('id,codigo,nombre,identificacion,contacto_nombre,telefono,correo,direccion,dias_credito,limite_credito,activo,notas', { count: 'exact' })
      .eq('empresa_id', empresaActiva.id)
      .is('deleted_at', null)
      .order('nombre', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    const term = busqueda.trim().replace(/[%_,()*]/g, '')
    if (term) query = query.or(`nombre.ilike.%${term}%,codigo.ilike.%${term}%,identificacion.ilike.%${term}%`)
    if (filtroEstado !== 'TODOS') query = query.eq('activo', filtroEstado === 'ACTIVOS')

    const { data, count, error } = await query
    if (requestId !== requestRef.current) return
    if (error) setLoadError(traducirError(error))
    setRows((data || []) as Proveedor[])
    setTotal(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    requestRef.current += 1
    setRows([]); setTotal(0); setPage(0); setSearch(''); setEstado('TODOS')
    setLoadError(null); setActionError(null); setModalOpen(false); setEditing(null); setForm(formInicial)
  }, [empresaActiva?.id])

  useEffect(() => { void cargar() }, [empresaActiva?.id, page, estado])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(0); void cargar(search, estado) }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const resumen = useMemo(() => ({
    activos: rows.filter((row) => row.activo).length,
    inactivos: rows.filter((row) => !row.activo).length,
    credito: rows.filter((row) => row.dias_credito > 0).length,
    limite: rows.reduce((sum, row) => sum + Number(row.limite_credito), 0),
  }), [rows])

  const abrirNuevo = () => {
    setEditing(null); setForm(formInicial); setActionError(null); setModalOpen(true)
  }

  const abrirEditar = (row: Proveedor) => {
    setEditing(row)
    setForm({
      nombre: row.nombre, codigo: row.codigo || '', identificacion: row.identificacion || '',
      contacto_nombre: row.contacto_nombre || '', telefono: row.telefono || '', correo: row.correo || '',
      direccion: row.direccion || '', dias_credito: String(row.dias_credito),
      limite_credito: String(Number(row.limite_credito)), notas: row.notas || '',
    })
    setActionError(null); setModalOpen(true)
  }

  const guardar = async (event: FormEvent) => {
    event.preventDefault(); setActionError(null)
    if (!empresaActiva) return setActionError('Selecciona una empresa antes de guardar.')
    if (form.nombre.trim().length < 2) return setActionError('El nombre del proveedor es obligatorio.')
    const dias = Number(form.dias_credito)
    const limite = Number(form.limite_credito)
    if (!Number.isInteger(dias) || dias < 0 || dias > 365) return setActionError('Los días de crédito deben estar entre 0 y 365.')
    if (!Number.isFinite(limite) || limite < 0) return setActionError('El límite de crédito no puede ser negativo.')

    setSaving(true)
    const params = {
      p_nombre: form.nombre.trim(), p_codigo: limpio(form.codigo), p_identificacion: limpio(form.identificacion),
      p_contacto_nombre: limpio(form.contacto_nombre), p_telefono: limpio(form.telefono),
      p_correo: limpio(form.correo), p_direccion: limpio(form.direccion), p_dias_credito: dias,
      p_limite_credito: limite, p_notas: limpio(form.notas),
    }
    const { error } = editing
      ? await supabase.rpc('avicola_actualizar_proveedor', { p_proveedor_id: editing.id, ...params })
      : await supabase.rpc('avicola_crear_proveedor', { p_empresa_id: empresaActiva.id, ...params })
    setSaving(false)
    if (error) { setActionError(traducirError(error)); return }
    setModalOpen(false); setEditing(null); setForm(formInicial)
    await cargar()
  }

  const cambiarEstado = async (row: Proveedor) => {
    if (!puedeEscribir) return
    setActionError(null)
    const { error } = await supabase.rpc('avicola_cambiar_estado_proveedor', { p_proveedor_id: row.id, p_activo: !row.activo })
    if (error) { setActionError(traducirError(error)); return }
    await cargar()
  }

  const columns: DataColumn<Proveedor>[] = [
    { key: 'proveedor', header: 'Proveedor', render: (row) => <div><p className="font-semibold text-slate-900">{row.nombre}</p><p className="text-xs text-slate-500">{row.codigo || 'Sin código'}{row.identificacion ? ` · ${row.identificacion}` : ''}</p></div> },
    { key: 'contacto', header: 'Contacto', render: (row) => <div><p className="text-slate-800">{row.contacto_nombre || 'Sin contacto'}</p><p className="text-xs text-slate-500">{row.telefono || row.correo || 'Sin datos de contacto'}</p></div> },
    { key: 'credito', header: 'Crédito', render: (row) => <div><p className="font-medium text-slate-800">{row.dias_credito} días</p><p className="text-xs text-slate-500">Límite {dinero(row.limite_credito)}</p></div> },
    { key: 'estado', header: 'Estado', render: (row) => <StatusBadge tone={row.activo ? 'success' : 'neutral'}>{row.activo ? 'Activo' : 'Inactivo'}</StatusBadge> },
    { key: 'acciones', header: 'Acciones', render: (row) => puedeEscribir ? <div className="flex flex-wrap gap-2"><button className="btn-ghost" onClick={() => abrirEditar(row)}><Pencil size={15}/>Editar</button><button className="btn-ghost" onClick={() => void cambiarEstado(row)}>{row.activo ? <ToggleLeft size={16}/> : <ToggleRight size={16}/>} {row.activo ? 'Desactivar' : 'Activar'}</button></div> : <span className="text-xs text-slate-400">Solo lectura</span> },
  ]

  return <div className="space-y-6">
    <PageHeader eyebrow="Compras" title="Proveedores" description="Administra los suplidores de alimentos, medicamentos, empaques, equipos y repuestos." actions={puedeEscribir ? <button className="btn-primary" onClick={abrirNuevo}><Plus size={16}/>Nuevo proveedor</button> : undefined} />
    <AlertBanner tone="info" title="Catálogo avícola independiente">Este catálogo no utiliza la tabla heredada del sistema clínico y será la fuente oficial para Compras y Cuentas por Pagar.</AlertBanner>
    {actionError && !modalOpen && <AlertBanner tone="error" title="No se pudo completar la acción">{actionError}</AlertBanner>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Activos" value={resumen.activos} icon={Building2} helper="página actual" />
      <KpiCard label="Inactivos" value={resumen.inactivos} icon={Users} helper="página actual" />
      <KpiCard label="Con crédito" value={resumen.credito} icon={CircleDollarSign} helper="página actual" />
      <KpiCard label="Límite acumulado" value={dinero(resumen.limite)} icon={CircleDollarSign} helper="página actual" />
    </section>

    <DataTable rows={rows} columns={columns} getRowKey={(row) => row.id} loading={loading} error={loadError} page={page} totalPages={Math.ceil(total / PAGE_SIZE)} totalRecords={total} onPageChange={setPage} emptyTitle="No hay proveedores" emptyDescription="Registra el primer proveedor para preparar el flujo de Compras." toolbar={<div className="flex flex-wrap items-center gap-2"><label className="relative"><span className="sr-only">Buscar proveedores</span><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input w-64 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre, código o identificación" /></label><select className="input w-40" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(0) }} aria-label="Filtrar por estado"><option value="TODOS">Todos</option><option value="ACTIVOS">Activos</option><option value="INACTIVOS">Inactivos</option></select><button className="btn-ghost" onClick={() => { setActionError(null); void cargar() }} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>Actualizar</button></div>} />

    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar proveedor' : 'Nuevo proveedor'} description="Información comercial y condiciones de crédito." initialFocusRef={nombreRef} busy={saving} size="lg" footer={<><button type="button" className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button type="submit" form="proveedor-form" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar proveedor'}</button></>}>
      <form id="proveedor-form" onSubmit={guardar} className="space-y-5">
        {actionError && <AlertBanner tone="error" title="No se pudo guardar">{actionError}</AlertBanner>}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre" htmlFor="proveedor-nombre" required><input ref={nombreRef} id="proveedor-nombre" className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required /></FormField>
          <FormField label="Código" htmlFor="proveedor-codigo"><input id="proveedor-codigo" className="input" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} /></FormField>
          <FormField label="RNC / identificación" htmlFor="proveedor-identificacion"><input id="proveedor-identificacion" className="input" value={form.identificacion} onChange={(e) => setForm({ ...form, identificacion: e.target.value })} /></FormField>
          <FormField label="Persona de contacto" htmlFor="proveedor-contacto"><input id="proveedor-contacto" className="input" value={form.contacto_nombre} onChange={(e) => setForm({ ...form, contacto_nombre: e.target.value })} /></FormField>
          <FormField label="Teléfono" htmlFor="proveedor-telefono"><input id="proveedor-telefono" className="input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></FormField>
          <FormField label="Correo" htmlFor="proveedor-correo"><input id="proveedor-correo" className="input" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></FormField>
          <FormField label="Días de crédito" htmlFor="proveedor-dias"><input id="proveedor-dias" className="input" type="number" min="0" max="365" step="1" value={form.dias_credito} onChange={(e) => setForm({ ...form, dias_credito: e.target.value })} required /></FormField>
          <FormField label="Límite de crédito" htmlFor="proveedor-limite"><input id="proveedor-limite" className="input" type="number" min="0" step="0.01" value={form.limite_credito} onChange={(e) => setForm({ ...form, limite_credito: e.target.value })} required /></FormField>
          <FormField label="Dirección" htmlFor="proveedor-direccion"><input id="proveedor-direccion" className="input" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></FormField>
          <FormField label="Notas" htmlFor="proveedor-notas"><input id="proveedor-notas" className="input" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></FormField>
        </div>
      </form>
    </Modal>
  </div>
}
