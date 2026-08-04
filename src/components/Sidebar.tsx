import { NavLink } from 'react-router-dom'
import {
  BarChart3, Bird, Boxes, Building2, ClipboardList, Egg, FileBarChart, HeartPulse,
  Home, Package, Receipt, Settings, ShoppingCart, Store, ThermometerSun, TrendingUp,
  Truck, Users, WalletCards, Wheat, X, LogOut, ShieldCheck
} from 'lucide-react'
import { useAuth } from '../lib/auth'

type LinkItem = readonly [to: string, label: string, icon: typeof Home, modulo: string]

type Grupo = {
  titulo: string
  links: readonly LinkItem[]
}

const grupos: readonly Grupo[] = [
  {
    titulo: 'Operación',
    links: [
      ['/', 'Dashboard', Home, 'panel'],
      ['/granjas', 'Granjas', Building2, 'granjas'],
      ['/galpones', 'Galpones', Store, 'galpones'],
      ['/lotes', 'Lotes de gallinas', Bird, 'lotes'],
      ['/produccion', 'Producción diaria', Egg, 'produccion'],
      ['/recoleccion', 'Recolección', ClipboardList, 'recoleccion'],
      ['/clasificacion', 'Clasificación', Boxes, 'clasificacion'],
      ['/empaque', 'Empaque', Package, 'empaque'],
    ],
  },
  {
    titulo: 'Inventario y sanidad',
    links: [
      ['/inventario-huevos', 'Inventario de huevos', Egg, 'inventario_huevos'],
      ['/inventario-alimentos', 'Inventario de alimentos', Wheat, 'inventario_alimentos'],
      ['/consumo', 'Consumo de alimento', BarChart3, 'consumo'],
      ['/sanidad', 'Sanidad', ShieldCheck, 'sanidad'],
      ['/mortalidad', 'Mortalidad', HeartPulse, 'mortalidad'],
      ['/calidad', 'Calidad', ThermometerSun, 'calidad'],
    ],
  },
  {
    titulo: 'Comercial y finanzas',
    links: [
      ['/compras', 'Compras', ShoppingCart, 'compras'],
      ['/proveedores', 'Proveedores', Truck, 'proveedores'],
      ['/clientes', 'Clientes', Users, 'clientes'],
      ['/ventas', 'Ventas', Receipt, 'ventas'],
      ['/cuentas-cobrar', 'Cuentas por cobrar', WalletCards, 'cuentas_cobrar'],
      ['/cuentas-pagar', 'Cuentas por pagar', WalletCards, 'cuentas_pagar'],
      ['/gastos', 'Gastos', WalletCards, 'gastos'],
      ['/rentabilidad', 'Rentabilidad', TrendingUp, 'rentabilidad'],
    ],
  },
  {
    titulo: 'Administración',
    links: [
      ['/reportes', 'Centro de inteligencia', FileBarChart, 'reportes'],
      ['/configuracion', 'Configuración', Settings, 'configuracion'],
    ],
  },
]

interface Props { open: boolean; onClose: () => void }

export default function Sidebar({ open, onClose }: Props) {
  const { perfil, signOut, puede } = useAuth()
  const gruposVisibles = grupos
    .map((grupo) => ({ ...grupo, links: grupo.links.filter(([, , , modulo]) => puede(modulo)) }))
    .filter((grupo) => grupo.links.length > 0)

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[270px] transform flex-col bg-[#123A25] text-white shadow-2xl transition-transform duration-200 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2E7D32] shadow-sm"><Egg size={23} /></div>
          <div>
            <p className="text-[17px] font-bold tracking-tight">AVÍCOLA ERP</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-200">Enterprise 2026</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden" aria-label="Cerrar menú"><X size={20} /></button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Navegación principal">
          {gruposVisibles.map((grupo) => (
            <section key={grupo.titulo}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">{grupo.titulo}</p>
              <div className="space-y-1">
                {grupo.links.map(([to, label, Icon]) => (
                  <NavLink key={to} to={to} end={to === '/'} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${isActive ? 'bg-white text-[#1F6A34] shadow-sm' : 'text-emerald-50/85 hover:bg-white/10 hover:text-white'}`}>
                    <Icon size={18} /><span className="flex-1">{label}</span>
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 rounded-xl bg-white/7 px-3 py-2.5">
            <p className="truncate text-xs font-semibold">{perfil?.nombre || perfil?.username || 'Administrador'}</p>
            <p className="mt-0.5 text-[11px] text-emerald-200/70">{perfil?.rol_nombre || 'Granja Principal'}</p>
          </div>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-emerald-100 transition hover:bg-white/10 hover:text-white"><LogOut size={17} /> Cerrar sesión</button>
        </div>
      </aside>
    </>
  )
}
