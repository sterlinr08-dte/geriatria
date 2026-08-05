import { useEffect, useMemo, useRef, useState } from 'react'
import { Boxes, CalendarClock, Egg, RefreshCw, ShieldAlert } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEmpresa } from '../lib/empresa'
import { traducirError } from '../lib/errores'
import { AlertBanner, DataTable, KpiCard, PageHeader, StatusBadge } from '../design-system'
import type { DataColumn } from '../design-system'

const PAGE_SIZE = 15

type NumericDb = number | string

type Row = {
  empresa_id: string
  presentacion_id: string
  lote_id: string
  categoria: string
  fecha_empaque: string
  fecha_vencimiento: string
  presentacion: string
  lote_codigo: string
  empaques_disponibles: NumericDb
  unidades_disponibles: NumericDb
  dias_restantes: number
  estado_fefo: 'VIGENTE' | 'PROXIMO' | 'CRITICO' | 'VENCIDO'
}

const categoriaLabel = (value: string) => value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')

export default function InventarioHuevos() {
  const { empresaActiva } = useEmpresa()
  const [rows, setRows] = useState<Row[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestRef = useRef(0)

  const cargar = async () => {
    const requestId = ++requestRef.current
    if (!empresaActiva) { setRows([]); setTotal(0); setLoading(false); return }
    setLoading(true); setError(null)
    const from = page * PAGE_SIZE
    const { data, count, error: queryError } = await supabase
      .from('inventario_huevos_saldos')
      .select('*', { count: 'exact' })
      .eq('empresa_id', empresaActiva.id)
      .order('fecha_vencimiento', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (requestId !== requestRef.current) return
    if (queryError) setError(traducirError(queryError))
    setRows((data || []) as Row[])
    setTotal(count || 0)
    setLoading(false)
  }

  useEffect(() => { setPage(0) }, [empresaActiva?.id])
  useEffect(() => { void cargar() }, [empresaActiva?.id, page])

  const resumen = useMemo(() => ({
    unidades: rows.reduce((sum, row) => sum + Number(row.unidades_disponibles), 0),
    empaques: rows.reduce((sum, row) => sum + Number(row.empaques_disponibles), 0),
    proximos: rows.filter((row) => row.estado_fefo === 'PROXIMO' || row.estado_fefo === 'CRITICO').length,
    vencidos: rows.filter((row) => row.estado_fefo === 'VENCIDO').length,
  }), [rows])

  const tone = (estado: Row['estado_fefo']) => estado === 'VIGENTE' ? 'success' : estado === 'PROXIMO' ? 'warning' : 'danger'

  const columns: DataColumn<Row>[] = [
    { key: 'vence', header: 'FEFO / Vence', render: (row) => <div><p className="font-semibold text-slate-900">{new Date(`${row.fecha_vencimiento}T00:00:00`).toLocaleDateString('es-DO')}</p><p className="text-xs text-slate-500">{row.dias_restantes} días restantes</p></div> },
    { key: 'lote', header: 'Lote', render: (row) => <span className="font-semibold text-slate-900">{row.lote_codigo}</span> },
    { key: 'categoria', header: 'Clasificación', render: (row) => categoriaLabel(row.categoria) },
    { key: 'presentacion', header: 'Presentación', render: (row) => row.presentacion },
    { key: 'empaques', header: 'Empaques', align: 'right', render: (row) => Number(row.empaques_disponibles).toLocaleString('es-DO') },
    { key: 'unidades', header: 'Huevos', align: 'right', render: (row) => Number(row.unidades_disponibles).toLocaleString('es-DO') },
    { key: 'estado', header: 'Estado', render: (row) => <StatusBadge tone={tone(row.estado_fefo)}>{row.estado_fefo === 'PROXIMO' ? 'Próximo' : row.estado_fefo === 'CRITICO' ? 'Crítico' : row.estado_fefo === 'VENCIDO' ? 'Vencido' : 'Vigente'}</StatusBadge> },
  ]

  return <div className="space-y-6">
    <PageHeader eyebrow="Inventario" title="Inventario de huevos" description="Existencias comerciales derivadas exclusivamente de movimientos válidos, ordenadas por vencimiento FEFO." />
    <AlertBanner tone="info" title="Saldo protegido">El inventario no se edita manualmente. Las existencias provienen de empaques confirmados y futuros movimientos de salida, devolución o ajuste.</AlertBanner>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Huevos visibles" value={resumen.unidades.toLocaleString('es-DO')} icon={Egg} helper="página actual" />
      <KpiCard label="Empaques visibles" value={resumen.empaques.toLocaleString('es-DO')} icon={Boxes} helper="página actual" />
      <KpiCard label="Próximos a vencer" value={resumen.proximos} icon={CalendarClock} helper="página actual · 7 días o menos" />
      <KpiCard label="Vencidos" value={resumen.vencidos} icon={ShieldAlert} helper="página actual · requieren revisión" />
    </section>
    <DataTable
      rows={rows}
      columns={columns}
      getRowKey={(row) => `${row.presentacion_id}-${row.lote_id}-${row.categoria}-${row.fecha_empaque}`}
      loading={loading}
      error={error}
      page={page}
      totalPages={Math.ceil(total / PAGE_SIZE)}
      totalRecords={total}
      onPageChange={setPage}
      emptyTitle="No hay existencias disponibles"
      emptyDescription="Los empaques confirmados aparecerán aquí automáticamente como inventario comercial."
      toolbar={<button className="btn-ghost" onClick={() => void cargar()} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>Actualizar</button>}
    />
  </div>
}
