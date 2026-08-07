import { ReactElement, useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Bell, ChevronDown, Menu, Search, Settings2, X } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Cargando from './components/Cargando'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Granjas from './pages/Granjas'
import Galpones from './pages/Galpones'
import Lotes from './pages/Lotes'
import ProduccionDiaria from './pages/ProduccionDiaria'
import Recoleccion from './pages/Recoleccion'
import Clasificacion from './pages/Clasificacion'
import Empaque from './pages/Empaque'
import InventarioHuevos from './pages/InventarioHuevos'
import Ventas from './pages/Ventas'
import CuentasPorCobrar from './pages/CuentasPorCobrar'
import Proveedores from './pages/Proveedores'
import DesignSystemPreview from './pages/DesignSystemPreview'
import ModuloAvicola from './pages/ModuloAvicola'
import { useAuth } from './lib/auth'
import { useEmpresa } from './lib/empresa'
import { MODULOS } from './lib/permisos'
import { AVICOLA_MODULES } from './core/modules'

function Protegido({ modulo, children }: { modulo: string; children: ReactElement }) {
  const { puede, permisos } = useAuth()
  if (puede(modulo)) return children
  const primero = MODULOS.find((m) => permisos.includes(m.key))
  if (primero && primero.key !== modulo) return <Navigate to={primero.path} replace />
  return <div className="card text-center text-slate-500">No tienes acceso a este módulo. Contacta al administrador.</div>
}

export default function App() {
  const { session, loading, perfil } = useAuth()
  const { empresas, empresaActiva, setEmpresaActivaId, loading: empresasLoading, error: empresaError } = useEmpresa()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!searchOpen) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setSearchOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    requestAnimationFrame(() => searchInputRef.current?.focus())
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [searchOpen])

  if (loading || (session && empresasLoading)) return <div className="flex h-full items-center justify-center"><Cargando texto="Cargando AVÍCOLA ERP…" /></div>
  if (!session) return <Login />

  const dashboard = AVICOLA_MODULES.find((module) => module.key === 'panel')
  const moduleRoutes = AVICOLA_MODULES.filter((module) => !['panel', 'granjas', 'galpones', 'lotes', 'produccion', 'recoleccion', 'clasificacion', 'empaque', 'inventario_huevos', 'ventas', 'cuentas_cobrar', 'proveedores'].includes(module.key))

  return <div className="flex h-full bg-[#F6F7F9]">
    <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
        <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Abrir menú"><Menu size={21} /></button>
        <button onClick={() => setSearchOpen(true)} className="hidden min-w-[280px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition hover:border-emerald-300 hover:bg-white md:flex" aria-haspopup="dialog"><Search size={17} /><span className="flex-1 text-left">Buscar en AVÍCOLA ERP</span><kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px]">⌘ K</kbd></button>
        <div className="ml-auto flex items-center gap-2">
          <label className="relative hidden sm:block"><span className="sr-only">Empresa activa</span><select className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-700 hover:bg-slate-50" value={empresaActiva?.id || ''} onChange={(event) => setEmpresaActivaId(event.target.value)} disabled={empresas.length === 0}>{empresas.length === 0 && <option value="">Sin empresa</option>}{empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /></label>
          <button className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" aria-label="Configuración rápida"><Settings2 size={19} /></button>
          <button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" aria-label="Notificaciones"><Bell size={19} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" /></button>
          <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-sm font-bold text-white">AE</div><div className="hidden leading-tight lg:block"><p className="text-sm font-semibold text-slate-900">{perfil?.nombre || perfil?.username || 'Administrador'}</p><p className="text-xs text-slate-500">{empresaActiva?.rol || perfil?.rol_nombre || 'Usuario'}</p></div></div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto"><div className="contenido-principal mx-auto max-w-[1720px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {empresaError && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">No fue posible cargar las empresas: {empresaError}</div>}
        <Routes>
          {dashboard && <Route path={dashboard.path} element={<Protegido modulo={dashboard.key}><Dashboard /></Protegido>} />}
          <Route path="/granjas" element={<Protegido modulo="granjas"><Granjas /></Protegido>} />
          <Route path="/galpones" element={<Protegido modulo="galpones"><Galpones /></Protegido>} />
          <Route path="/lotes" element={<Protegido modulo="lotes"><Lotes /></Protegido>} />
          <Route path="/produccion" element={<Protegido modulo="produccion"><ProduccionDiaria /></Protegido>} />
          <Route path="/recoleccion" element={<Protegido modulo="recoleccion"><Recoleccion /></Protegido>} />
          <Route path="/clasificacion" element={<Protegido modulo="clasificacion"><Clasificacion /></Protegido>} />
          <Route path="/empaque" element={<Protegido modulo="empaque"><Empaque /></Protegido>} />
          <Route path="/inventario-huevos" element={<Protegido modulo="inventario_huevos"><InventarioHuevos /></Protegido>} />
          <Route path="/ventas" element={<Protegido modulo="ventas"><Ventas /></Protegido>} />
          <Route path="/cuentas-cobrar" element={<Protegido modulo="cuentas_cobrar"><CuentasPorCobrar /></Protegido>} />
          <Route path="/proveedores" element={<Protegido modulo="proveedores"><Proveedores /></Protegido>} />
          <Route path="/design-system" element={<Protegido modulo="configuracion"><DesignSystemPreview /></Protegido>} />
          {moduleRoutes.map((module) => <Route key={module.path} path={module.path} element={<Protegido modulo={module.key}><ModuloAvicola titulo={module.label} descripcion={module.description} /></Protegido>} />)}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div></main>
    </div>
    {searchOpen && <div className="fixed inset-0 z-50 bg-slate-950/35 p-4 backdrop-blur-sm" onClick={() => setSearchOpen(false)}><div role="dialog" aria-modal="true" aria-labelledby="buscador-global-titulo" className="mx-auto mt-[10vh] max-w-2xl rounded-2xl bg-white p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}><h2 id="buscador-global-titulo" className="sr-only">Buscador global</h2><div className="flex items-center gap-3 border-b border-slate-100 px-3 pb-3"><Search size={20} className="text-emerald-700" /><input ref={searchInputRef} className="w-full bg-transparent py-2 text-base outline-none" placeholder="Buscar granjas, lotes, clientes, facturas…" aria-label="Buscar en AVÍCOLA ERP" /><button onClick={() => setSearchOpen(false)} className="rounded-lg border border-slate-200 p-1.5 text-slate-500" aria-label="Cerrar buscador"><X size={16} /></button></div><p className="px-3 py-8 text-center text-sm text-slate-500">El buscador global se conectará progresivamente a los módulos operativos.</p></div></div>}
  </div>
}
