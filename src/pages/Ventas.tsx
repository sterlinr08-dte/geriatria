import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { BadgeDollarSign, CheckCircle2, Plus, ReceiptText, RefreshCw, ShoppingCart, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../lib/empresa'
import { traducirError } from '../lib/errores'
import { AlertBanner, DataTable, FormField, KpiCard, Modal, PageHeader, StatusBadge } from '../design-system'
import type { DataColumn } from '../design-system'

const PAGE_SIZE = 15
const WRITERS = ['propietario', 'administrador', 'supervisor', 'ventas']
const CATEGORIAS = ['JUMBO', 'EXTRA_GRANDE', 'GRANDE', 'MEDIANO', 'PEQUENO', 'INDUSTRIAL'] as const

type Categoria = typeof CATEGORIAS[number]
type NumericDb = number | string

type Cliente = {
  id: string
  codigo: string
  nombre: string
  telefono: string | null
  limite_credito: NumericDb
  dias_credito: number
}

type Presentacion = {
  id: string
  nombre: string
  unidades_por_empaque: number
}

type VentaRow = {
  id: string
  numero: NumericDb
  cliente_nombre: string
  fecha: string
  tipo_venta: 'CONTADO' | 'CREDITO'
  subtotal: NumericDb
  descuento: NumericDb
  total: NumericDb
  estado: 'BORRADOR' | 'CONFIRMADA' | 'ANULADA'
  confirmada_at: string | null
}

type FormState = {
  cliente_id: string
  cliente_nombre: string
  fecha: string
  tipo_venta: 'CONTADO' | 'CREDITO'
  presentacion_id: string
  categoria: Categoria
  cantidad_empaques: string
  precio_unitario: string
  descuento: string
  observaciones: string
}

const hoy = new Date().toISOString().slice(0, 10)
const formInicial: FormState = {
  cliente_id: '',
  cliente_nombre: 'Cliente de contado',
  fecha: hoy,
  tipo_venta: 'CONTADO',
  presentacion_id: '',
  categoria: 'GRANDE',
  cantidad_empaques: '',
  precio_unitario: '',
  descuento: '0',
  observaciones: '',
}

const categoriaLabel = (value: string) => value
  .toLowerCase()
  .split('_')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ')

export default function Ventas() {
  const { empresaActiva } = useEmpresa()
  const [rows, setRows] = useState<VentaRow[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(formInicial)
  const clienteRef = useRef<HTMLSelectElement>(null)
  const rowsRequestRef = useRef(0)
  const catalogRequestRef = useRef(0)

  const puedeEscribir = !!empresaActiva && WRITERS.includes(empresaActiva.rol)
  const presentacion = presentaciones.find((item) => item.id === form.presentacion_id)
  const cantidad = Number(form.cantidad_empaques || 0)
  const precio = Number(form.precio_unitario || 0)
  const descuento = Number(form.descuento || 0)
  const subtotalEstimado = cantidad * precio
  const totalEstimado = Math.max(0, subtotalEstimado - descuento)

  const cargarCatalogos = async () => {
    const requestId = ++catalogRequestRef.current
    if (!empresaActiva) {
      setClientes([])
      setPresentaciones([])
      return
    }

    const empresaId = empresaActiva.id
    const [clientesResult, presentacionesResult] = await Promise.all([
      supabase
        .from('clientes_comerciales')
        .select('id,codigo,nombre,telefono,limite_credito,dias_credito')
        .eq('empresa_id', empresaId)
        .eq('activo', true)
        .is('deleted_at', null)
        .order('nombre')
        .limit(300),
      supabase
        .from('presentaciones_huevos')
        .select('id,nombre,unidades_por_empaque')
        .eq('empresa_id', empresaId)
        .eq('activo', true)
        .is('deleted_at', null)
        .order('unidades_por_empaque'),
    ])

    if (requestId !== catalogRequestRef.current) return
    const catalogError = clientesResult.error || presentacionesResult.error
    if (catalogError) {
      setActionError(`No fue posible cargar los catálogos: ${traducirError(catalogError)}`)
      return
    }

    setClientes((clientesResult.data || []) as Cliente[])
    setPresentaciones((presentacionesResult.data || []) as Presentacion[])
  }

  const cargar = async () => {
    const requestId = ++rowsRequestRef.current
    if (!empresaActiva) {
      setRows([])
      setTotal(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)
    const from = page * PAGE_SIZE
    const { data, count, error: queryError } = await supabase
      .from('ventas_huevos')
      .select('id,numero,cliente_nombre,fecha,tipo_venta,subtotal,descuento,total,estado,confirmada_at', { count: 'exact' })
      .eq('empresa_id', empresaActiva.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (requestId !== rowsRequestRef.current) return
    if (queryError) setLoadError(traducirError(queryError))
    setRows((data || []) as VentaRow[])
    setTotal(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    catalogRequestRef.current += 1
    rowsRequestRef.current += 1
    setClientes([])
    setPresentaciones([])
    setRows([])
    setTotal(0)
    setActionError(null)
    setLoadError(null)
    setPage(0)
    void cargarCatalogos()
  }, [empresaActiva?.id])

  useEffect(() => {
    void cargar()
  }, [empresaActiva?.id, page])

  const resumen = useMemo(() => ({
    totalVisible: rows
      .filter((row) => row.estado === 'CONFIRMADA')
      .reduce((sum, row) => sum + Number(row.total), 0),
    confirmadas: rows.filter((row) => row.estado === 'CONFIRMADA').length,
    borradores: rows.filter((row) => row.estado === 'BORRADOR').length,
    clientes: new Set(rows.map((row) => row.cliente_nombre)).size,
  }), [rows])

  const crear = async (event: FormEvent) => {
    event.preventDefault()
    setModalError(null)

    if (!empresaActiva || !form.presentacion_id) return setModalError('Selecciona una empresa y una presentación.')
    if (!Number.isInteger(cantidad) || cantidad <= 0) return setModalError('La cantidad de empaques debe ser un entero mayor que cero.')
    if (!Number.isFinite(precio) || precio < 0) return setModalError('El precio debe ser un valor válido mayor o igual que cero.')
    if (!Number.isFinite(descuento) || descuento < 0 || descuento > subtotalEstimado) return setModalError('El descuento no puede ser negativo ni superar el subtotal estimado.')
    if (!form.cliente_nombre.trim()) return setModalError('Indica el nombre del cliente.')

    setSaving(true)
    const { data: venta, error: ventaError } = await supabase
      .from('ventas_huevos')
      .insert({
        empresa_id: empresaActiva.id,
        cliente_id: form.cliente_id || null,
        cliente_nombre: form.cliente_nombre.trim(),
        fecha: form.fecha,
        tipo_venta: form.tipo_venta,
        descuento,
        observaciones: form.observaciones.trim() || null,
        estado: 'BORRADOR',
      })
      .select('id')
      .single()

    if (ventaError || !venta) {
      setSaving(false)
      setModalError(traducirError(ventaError))
      return
    }

    const { error: detalleError } = await supabase
      .from('venta_huevos_detalles')
      .insert({
        empresa_id: empresaActiva.id,
        venta_id: venta.id,
        presentacion_id: form.presentacion_id,
        categoria: form.categoria,
        cantidad_empaques: cantidad,
        unidades_por_empaque: presentacion?.unidades_por_empaque || 1,
        unidades_totales: cantidad * (presentacion?.unidades_por_empaque || 1),
        precio_unitario: precio,
        subtotal: subtotalEstimado,
      })

    if (detalleError) {
      const { data: cleanedRows, error: cleanupError } = await supabase
        .from('ventas_huevos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', venta.id)
        .eq('estado', 'BORRADOR')
        .select('id')

      const cleanupFailed = !!cleanupError || !cleanedRows || cleanedRows.length === 0
      setSaving(false)
      setModalError(cleanupFailed
        ? `${traducirError(detalleError)} Además, no se pudo limpiar el borrador incompleto.`
        : traducirError(detalleError))
      return
    }

    setSaving(false)
    setModalOpen(false)
    setForm(formInicial)
    await cargar()
  }

  const confirmar = async (venta: VentaRow) => {
    if (venta.estado !== 'BORRADOR' || confirmandoId) return
    setActionError(null)
    setConfirmandoId(venta.id)
    const { error: rpcError } = await supabase.rpc('avicola_confirmar_venta', { p_venta_id: venta.id })
    setConfirmandoId(null)
    if (rpcError) {
      setActionError(traducirError(rpcError))
      return
    }
    await cargar()
  }

  const columns: DataColumn<VentaRow>[] = [
    {
      key: 'numero',
      header: 'Venta',
      render: (row) => <div>
        <p className="font-semibold text-slate-900">#{Number(row.numero).toLocaleString('es-DO')}</p>
        <p className="text-xs text-slate-500">{new Date(`${row.fecha}T00:00:00`).toLocaleDateString('es-DO')}</p>
      </div>,
    },
    { key: 'cliente', header: 'Cliente', render: (row) => <span className="font-semibold text-slate-900">{row.cliente_nombre}</span> },
    { key: 'tipo', header: 'Tipo', render: (row) => <StatusBadge tone={row.tipo_venta === 'CREDITO' ? 'warning' : 'neutral'}>{row.tipo_venta === 'CREDITO' ? 'Crédito' : 'Contado'}</StatusBadge> },
    { key: 'subtotal', header: 'Subtotal', align: 'right', render: (row) => `RD$ ${Number(row.subtotal).toLocaleString('es-DO', { minimumFractionDigits: 2 })}` },
    { key: 'total', header: 'Total', align: 'right', render: (row) => <span className="font-semibold text-slate-900">RD$ {Number(row.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span> },
    { key: 'estado', header: 'Estado', render: (row) => <StatusBadge tone={row.estado === 'CONFIRMADA' ? 'success' : row.estado === 'ANULADA' ? 'danger' : 'warning'}>{row.estado === 'CONFIRMADA' ? 'Confirmada' : row.estado === 'ANULADA' ? 'Anulada' : 'Borrador'}</StatusBadge> },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (row) => row.estado === 'BORRADOR' && puedeEscribir
        ? <button className="btn-ghost" onClick={() => void confirmar(row)} disabled={confirmandoId !== null}>
            <CheckCircle2 size={16} />
            {confirmandoId === row.id ? 'Confirmando…' : 'Confirmar'}
          </button>
        : <span className="text-xs text-slate-400">Sin acciones</span>,
    },
  ]

  return <div className="space-y-6">
    <PageHeader
      eyebrow="Comercial"
      title="Ventas"
      description="Crea borradores y confirma ventas con descuento automático de inventario mediante FEFO."
      actions={puedeEscribir
        ? <button className="btn-primary" onClick={() => { setForm(formInicial); setModalError(null); setActionError(null); setModalOpen(true) }}>
            <Plus size={16} /> Nueva venta
          </button>
        : undefined}
    />

    <AlertBanner tone="info" title="Inventario protegido">
      La pantalla no calcula FEFO ni descuenta existencias. La confirmación delega toda la operación a Supabase de forma transaccional.
    </AlertBanner>

    {actionError && <AlertBanner tone="error" title="No se pudo completar la acción">
      {actionError}
    </AlertBanner>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Ventas visibles" value={rows.length} icon={ReceiptText} helper="página actual" />
      <KpiCard label="Total confirmado" value={`RD$ ${resumen.totalVisible.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`} icon={BadgeDollarSign} helper="página actual" />
      <KpiCard label="Borradores" value={resumen.borradores} icon={ShoppingCart} helper={`${resumen.confirmadas} confirmadas visibles · página actual`} />
      <KpiCard label="Clientes visibles" value={resumen.clientes} icon={Users} helper="sin duplicar nombres · página actual" />
    </section>

    <DataTable
      rows={rows}
      columns={columns}
      getRowKey={(row) => row.id}
      loading={loading}
      error={loadError}
      page={page}
      totalPages={Math.ceil(total / PAGE_SIZE)}
      totalRecords={total}
      onPageChange={setPage}
      emptyTitle="No hay ventas registradas"
      emptyDescription="Crea una venta en borrador y confírmala cuando esté lista para descontar inventario."
      toolbar={<button className="btn-ghost" onClick={() => { setActionError(null); void cargar(); void cargarCatalogos() }} disabled={loading}>
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar
      </button>}
    />

    <Modal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      title="Nueva venta"
      description="Se creará un borrador con una primera línea de producto."
      initialFocusRef={clienteRef}
      busy={saving}
      size="lg"
      footer={<>
        <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button>
        <button type="submit" form="venta-form" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar borrador'}</button>
      </>}
    >
      <form id="venta-form" onSubmit={crear} className="space-y-5">
        {modalError && <AlertBanner tone="error" title="No se pudo guardar">{modalError}</AlertBanner>}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Cliente registrado" htmlFor="venta-cliente" hint="Puedes dejarlo vacío y usar un nombre de contado.">
            <select
              ref={clienteRef}
              id="venta-cliente"
              className="input"
              value={form.cliente_id}
              onChange={(event) => {
                const cliente = clientes.find((item) => item.id === event.target.value)
                setForm({ ...form, cliente_id: event.target.value, cliente_nombre: cliente?.nombre || form.cliente_nombre })
              }}
            >
              <option value="">Cliente de contado</option>
              {clientes.map((item) => <option key={item.id} value={item.id}>{item.codigo} · {item.nombre}</option>)}
            </select>
          </FormField>

          <FormField label="Nombre en la venta" htmlFor="venta-cliente-nombre" required>
            <input id="venta-cliente-nombre" className="input" value={form.cliente_nombre} onChange={(event) => setForm({ ...form, cliente_nombre: event.target.value })} required />
          </FormField>

          <FormField label="Fecha" htmlFor="venta-fecha" required>
            <input id="venta-fecha" className="input" type="date" max={hoy} value={form.fecha} onChange={(event) => setForm({ ...form, fecha: event.target.value })} required />
          </FormField>

          <FormField label="Tipo de venta" htmlFor="venta-tipo" required>
            <select id="venta-tipo" className="input" value={form.tipo_venta} onChange={(event) => setForm({ ...form, tipo_venta: event.target.value as FormState['tipo_venta'] })}>
              <option value="CONTADO">Contado</option>
              <option value="CREDITO">Crédito</option>
            </select>
          </FormField>

          <FormField label="Presentación" htmlFor="venta-presentacion" required>
            <select id="venta-presentacion" className="input" value={form.presentacion_id} onChange={(event) => setForm({ ...form, presentacion_id: event.target.value })} required>
              <option value="">Seleccionar presentación</option>
              {presentaciones.map((item) => <option key={item.id} value={item.id}>{item.nombre} · {item.unidades_por_empaque} huevos</option>)}
            </select>
          </FormField>

          <FormField label="Categoría" htmlFor="venta-categoria" required>
            <select id="venta-categoria" className="input" value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value as Categoria })}>
              {CATEGORIAS.map((categoria) => <option key={categoria} value={categoria}>{categoriaLabel(categoria)}</option>)}
            </select>
          </FormField>

          <FormField label="Cantidad de empaques" htmlFor="venta-cantidad" required>
            <input id="venta-cantidad" className="input" type="number" min="1" step="1" value={form.cantidad_empaques} onChange={(event) => setForm({ ...form, cantidad_empaques: event.target.value })} required />
          </FormField>

          <FormField label="Precio por empaque" htmlFor="venta-precio" required>
            <input id="venta-precio" className="input" type="number" min="0" step="0.01" value={form.precio_unitario} onChange={(event) => setForm({ ...form, precio_unitario: event.target.value })} required />
          </FormField>

          <FormField label="Descuento" htmlFor="venta-descuento">
            <input id="venta-descuento" className="input" type="number" min="0" step="0.01" value={form.descuento} onChange={(event) => setForm({ ...form, descuento: event.target.value })} />
          </FormField>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          <p className="text-sm font-semibold">Subtotal estimado: RD$ {subtotalEstimado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
          <p className="mt-1 text-xs">
            {presentacion ? `${cantidad || 0} × ${presentacion.nombre} (${presentacion.unidades_por_empaque} huevos c/u)` : 'Selecciona una presentación'}
            {' · '}Total estimado RD$ {totalEstimado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <FormField label="Observaciones" htmlFor="venta-observaciones">
          <textarea id="venta-observaciones" className="input min-h-24" value={form.observaciones} onChange={(event) => setForm({ ...form, observaciones: event.target.value })} />
        </FormField>
      </form>
    </Modal>
  </div>
}
