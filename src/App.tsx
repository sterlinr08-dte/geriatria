import { ReactElement, useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Bell, ChevronDown, Menu, Search, Settings2, X } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Cargando from './components/Cargando'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ModuloAvicola from './pages/ModuloAvicola'
import { useAuth } from './lib/auth'
import { MODULOS } from './lib/permisos'

const modulos = [
  ['/granjas', 'granjas', 'Granjas', 'Administración de granjas, ubicaciones, capacidad, responsables y rendimiento.'],
  ['/galpones', 'galpones', 'Galpones', 'Control operativo y ambiental de cada galpón de producción.'],
  ['/lotes', 'lotes', 'Lotes de gallinas', 'Trazabilidad de lotes, edad, raza, mortalidad, postura y rentabilidad.'],
  ['/produccion', 'produccion', 'Producción diaria', 'Registro y análisis diario de postura, merma y huevos comercializables.'],
  ['/recoleccion', 'recoleccion', 'Recolección', 'Recorridos, responsables, tiempos y rendimiento por sector.'],
  ['/clasificacion', 'clasificacion', 'Clasificación', 'Clasificación por tamaño, calidad y condición comercial.'],
  ['/empaque', 'empaque', 'Empaque', 'Control de bandejas, cajas, etiquetas, materiales y productividad.'],
  ['/inventario-huevos', 'inventario_huevos', 'Inventario de huevos', 'Existencias por lote, fecha, clasificación, presentación y método FEFO.'],
  ['/inventario-alimentos', 'inventario_alimentos', 'Inventario de alimentos', 'Entradas, salidas, costos, proveedores y días disponibles.'],
  ['/consumo', 'consumo', 'Consumo de alimento', 'Consumo por ave, lote y galpón con análisis de costo y desviaciones.'],
  ['/sanidad', 'sanidad', 'Sanidad', 'Vacunas, tratamientos, medicamentos, veterinarios y calendario sanitario.'],
  ['/mortalidad', 'mortalidad', 'Mortalidad', 'Registro de bajas, causas, evidencia, indicadores y mapa de calor.'],
  ['/calidad', 'calidad', 'Calidad', 'Control de fisuras, deformaciones, rechazos, causas y tendencias.'],
  ['/compras', 'compras', 'Compras', 'Órdenes, facturas, alimentos, medicamentos, equipos y repuestos.'],
  ['/proveedores', 'proveedores', 'Proveedores', 'Historial comercial, pagos, balance, evaluación y cumplimiento.'],
  ['/clientes', 'clientes', 'Clientes', 'Crédito, pedidos, ventas, historial, saldo y comportamiento comercial.'],
  ['/ventas', 'ventas', 'Ventas', 'Pedidos, facturación, métodos de pago, clientes y análisis comercial.'],
  ['/cuentas-cobrar', 'cuentas_cobrar', 'Cuentas por cobrar', 'Facturas pendientes, vencimientos, cobros y recordatorios.'],
  ['/cuentas-pagar', 'cuentas_pagar', 'Cuentas por pagar', 'Compromisos con proveedores, pagos y vencimientos.'],
  ['/gastos', 'gastos', 'Gastos', 'Electricidad, agua, nómina, combustible, mantenimiento y otros costos.'],
  ['/rentabilidad', 'rentabilidad', 'Rentabilidad', 'Costo por huevo, lote y galpón, utilidad, margen y retorno.'],
  ['/reportes', 'reportes', 'Centro de inteligencia', 'Reportes operativos, financieros y sanitarios para toma de decisiones.'],
  ['/configuracion', 'configuracion', 'Configuración', 'Usuarios, roles, permisos, empresas, sucursales e integraciones.'],
] as const

function Protegido({ modulo, children }: { modulo: string; children: ReactElement }) {
  const { puede, permisos } = useAuth()
  if (puede(modulo)) return children
  const primero = MODULOS.find((m) => permisos.includes(m.key))
  if (primero && primero.key !== modulo) return <Navigate to={primero.path} replace />
  return <div className="card text-center text-slate-500">No tienes acceso a este módulo. Contacta al administrador.</div>
}

export default function App() {
  const { session, loading, perfil } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!searchOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    requestAnimationFrame(() => searchInputRef.current?.focus())
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [searchOpen])

  if (loading) return <div className="flex h-full items-center justify-center"><Cargando texto="Cargando AVÍCOLA ERP…" /></div>
  if (!session) return <Login />

  return (
    <div className="flex h-full bg-[#F6F7F9]">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
          <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Abrir menú"><Menu size={21} /></button>
          <button onClick={() => setSearchOpen(true)} className="hidden min-w-[280px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition hover:border-emerald-300 hover:bg-white md:flex" aria-haspopup="dialog">
            <Search size={17} /><span className="flex-1 text-left">Buscar en AVÍCOLA ERP</span><kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px]">⌘ K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:flex">Granja Principal <ChevronDown size={15} /></button>
            <button className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" aria-label="Configuración rápida"><Settings2 size={19} /></button>
            <button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" aria-label="Notificaciones"><Bell size={19} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" /></button>
            <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-sm font-bold text-white">AE</div>
              <div className="hidden leading-tight lg:block"><p className="text-sm font-semibold text-slate-900">{perfil?.nombre || perfil?.username || 'Administrador'}</p><p className="text-xs text-slate-500">{perfil?.rol_nombre || 'Usuario'}</p></div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="contenido-principal mx-auto max-w-[1720px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <Routes>
              <Route path="/" element={<Protegido modulo="panel"><Dashboard /></Protegido>} />
              {modulos.map(([path, permiso, titulo, descripcion]) => <Route key={path} path={path} element={<Protegido modulo={permiso}><ModuloAvicola titulo={titulo} descripcion={descripcion} /></Protegido>} />)}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/35 p-4 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="buscador-global-titulo" className="mx-auto mt-[10vh] max-w-2xl rounded-2xl bg-white p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="buscador-global-titulo" className="sr-only">Buscador global</h2>
            <div className="flex items-center gap-3 border-b border-slate-100 px-3 pb-3">
              <Search size={20} className="text-emerald-700" />
              <input ref={searchInputRef} className="w-full bg-transparent py-2 text-base outline-none" placeholder="Buscar granjas, lotes, clientes, facturas…" aria-label="Buscar en AVÍCOLA ERP" />
              <button onClick={() => setSearchOpen(false)} className="rounded-lg border border-slate-200 p-1.5 text-slate-500" aria-label="Cerrar buscador"><X size={16} /></button>
            </div>
            <p className="px-3 py-8 text-center text-sm text-slate-500">El buscador global se conectará a los módulos y datos de Supabase durante esta fase.</p>
          </div>
        </div>
      )}
    </div>
  )
}
