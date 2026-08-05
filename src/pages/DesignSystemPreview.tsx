import { useMemo, useRef, useState } from 'react'
import { Bird, Egg, Package, Plus, TrendingUp } from 'lucide-react'
import { AlertBanner, DataTable, FormField, KpiCard, Modal, PageHeader, StatusBadge } from '../design-system'
import type { DataColumn } from '../design-system'

type Row = { id: string; lote: string; galpon: string; aves: number; postura: number; estado: 'Producción' | 'Desarrollo' | 'Alerta' }

const rows: Row[] = Array.from({ length: 50 }, (_, index) => ({
  id: String(index + 1),
  lote: `LOT-2026-${String(index + 1).padStart(3, '0')}`,
  galpon: `Galpón ${String.fromCharCode(65 + (index % 8))}`,
  aves: 8200 + index * 37,
  postura: 79 + (index % 14) * 0.9,
  estado: index % 11 === 0 ? 'Alerta' : index % 4 === 0 ? 'Desarrollo' : 'Producción',
}))

export default function DesignSystemPreview() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<'normal' | 'empty' | 'error'>('normal')
  const nameRef = useRef<HTMLInputElement>(null)
  const pageSize = 8
  const filtered = useMemo(() => rows.filter((row) => `${row.lote} ${row.galpon}`.toLowerCase().includes(search.toLowerCase())), [search])
  const visible = mode === 'normal' ? filtered.slice(page * pageSize, page * pageSize + pageSize) : []
  const columns: DataColumn<Row>[] = [
    { key: 'lote', header: 'Lote', render: (row) => <div><p className="font-semibold text-slate-900">{row.lote}</p><p className="text-xs text-slate-500">{row.galpon}</p></div> },
    { key: 'aves', header: 'Aves', align: 'right', render: (row) => row.aves.toLocaleString('es-DO') },
    { key: 'postura', header: 'Postura', align: 'right', render: (row) => `${row.postura.toFixed(1)}%` },
    { key: 'estado', header: 'Estado', render: (row) => <StatusBadge tone={row.estado === 'Alerta' ? 'danger' : row.estado === 'Desarrollo' ? 'info' : 'success'}>{row.estado}</StatusBadge> },
  ]

  return <div className="space-y-6">
    <PageHeader eyebrow="Sistema visual" title="Design System AVÍCOLA ERP" description="Componentes React reales, probados con datos extensos, estados vacíos, error y contenido variable." actions={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Probar modal</button>} />

    <AlertBanner tone="info" title="Vista de aprobación visual">Esta pantalla no usa Supabase y no modifica los módulos aprobados. Sirve para validar el lenguaje visual común.</AlertBanner>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Aves activas" value="124,850" icon={Bird} trend={2.8} helper="frente al mes anterior" />
      <KpiCard label="Producción de hoy" value="108,420" icon={Egg} trend={1.4} helper="huevos recolectados" />
      <KpiCard label="Postura promedio" value="86.8" suffix="%" icon={TrendingUp} trend={-0.6} helper="últimas 24 horas" />
      <KpiCard label="Inventario" value="9,035" icon={Package} trend={0} helper="bandejas disponibles" />
    </section>

    <div className="flex flex-wrap gap-2">
      <button className={mode === 'normal' ? 'btn-primary' : 'btn-ghost'} onClick={() => { setMode('normal'); setPage(0) }}>Con datos</button>
      <button className={mode === 'empty' ? 'btn-primary' : 'btn-ghost'} onClick={() => { setMode('empty'); setPage(0) }}>Estado vacío</button>
      <button className={mode === 'error' ? 'btn-primary' : 'btn-ghost'} onClick={() => setMode('error')}>Estado de error</button>
    </div>

    <DataTable rows={visible} columns={columns} getRowKey={(row) => row.id} page={page} totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))} totalRecords={filtered.length} onPageChange={setPage} searchValue={search} onSearchChange={(value) => { setSearch(value); setPage(0) }} searchPlaceholder="Buscar lote o galpón" error={mode === 'error' ? 'No fue posible consultar los lotes. Revisa la conexión e inténtalo nuevamente.' : null} emptyTitle="No hay lotes para mostrar" emptyDescription="Prueba otro término o registra el primer lote productivo." />

    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar lote de prueba" description="Ejemplo del modal estándar con focus trap y restauración de foco." initialFocusRef={nameRef} footer={<><button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn-primary" onClick={() => setModalOpen(false)}>Guardar prueba</button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Código del lote" htmlFor="ds-code" required hint="Debe ser único dentro de la empresa."><input ref={nameRef} id="ds-code" className="input" placeholder="LOT-2026-051" /></FormField>
        <FormField label="Estado" htmlFor="ds-status" required><select id="ds-status" className="input"><option>Producción</option><option>Desarrollo</option></select></FormField>
        <div className="sm:col-span-2"><FormField label="Observaciones" htmlFor="ds-notes" hint="Este campo admite textos largos sin romper el diseño."><textarea id="ds-notes" className="input min-h-24" defaultValue="Lote recibido con documentación completa. Mantener seguimiento de postura durante los primeros siete días." /></FormField></div>
      </div>
    </Modal>
  </div>
}
