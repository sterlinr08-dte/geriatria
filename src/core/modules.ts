import type { LucideIcon } from 'lucide-react'
import {
  BarChart3, Bird, Boxes, Building2, ClipboardList, Egg, FileBarChart, HeartPulse,
  Home, Package, Receipt, Settings, ShoppingCart, Store, ThermometerSun, TrendingUp,
  Truck, Users, WalletCards, Wheat, ShieldCheck,
} from 'lucide-react'

export type ModuleGroup = 'Operación' | 'Inventario y sanidad' | 'Comercial y finanzas' | 'Administración'

export interface AvicolaModule {
  key: string
  path: string
  label: string
  description: string
  group: ModuleGroup
  icon: LucideIcon
  end?: boolean
}

export const AVICOLA_MODULES: AvicolaModule[] = [
  { key: 'panel', path: '/', label: 'Dashboard', description: 'Resumen ejecutivo de producción, sanidad, inventario y rentabilidad.', group: 'Operación', icon: Home, end: true },
  { key: 'granjas', path: '/granjas', label: 'Granjas', description: 'Administración de granjas, ubicaciones, capacidad, responsables y rendimiento.', group: 'Operación', icon: Building2 },
  { key: 'galpones', path: '/galpones', label: 'Galpones', description: 'Control operativo y ambiental de cada galpón de producción.', group: 'Operación', icon: Store },
  { key: 'lotes', path: '/lotes', label: 'Lotes de gallinas', description: 'Trazabilidad de lotes, edad, raza, mortalidad, postura y rentabilidad.', group: 'Operación', icon: Bird },
  { key: 'produccion', path: '/produccion', label: 'Producción diaria', description: 'Registro y análisis diario de postura, merma y huevos comercializables.', group: 'Operación', icon: Egg },
  { key: 'recoleccion', path: '/recoleccion', label: 'Recolección', description: 'Recorridos, responsables, tiempos y rendimiento por sector.', group: 'Operación', icon: ClipboardList },
  { key: 'clasificacion', path: '/clasificacion', label: 'Clasificación', description: 'Clasificación por tamaño, calidad y condición comercial.', group: 'Operación', icon: Boxes },
  { key: 'empaque', path: '/empaque', label: 'Empaque', description: 'Control de bandejas, cajas, etiquetas, materiales y productividad.', group: 'Operación', icon: Package },
  { key: 'inventario_huevos', path: '/inventario-huevos', label: 'Inventario de huevos', description: 'Existencias por lote, fecha, clasificación, presentación y método FEFO.', group: 'Inventario y sanidad', icon: Egg },
  { key: 'inventario_alimentos', path: '/inventario-alimentos', label: 'Inventario de alimentos', description: 'Entradas, salidas, costos, proveedores y días disponibles.', group: 'Inventario y sanidad', icon: Wheat },
  { key: 'consumo', path: '/consumo', label: 'Consumo de alimento', description: 'Consumo por ave, lote y galpón con análisis de costo y desviaciones.', group: 'Inventario y sanidad', icon: BarChart3 },
  { key: 'sanidad', path: '/sanidad', label: 'Sanidad', description: 'Vacunas, tratamientos, medicamentos, veterinarios y calendario sanitario.', group: 'Inventario y sanidad', icon: ShieldCheck },
  { key: 'mortalidad', path: '/mortalidad', label: 'Mortalidad', description: 'Registro de bajas, causas, evidencia, indicadores y mapa de calor.', group: 'Inventario y sanidad', icon: HeartPulse },
  { key: 'calidad', path: '/calidad', label: 'Calidad', description: 'Control de fisuras, deformaciones, rechazos, causas y tendencias.', group: 'Inventario y sanidad', icon: ThermometerSun },
  { key: 'compras', path: '/compras', label: 'Compras', description: 'Órdenes, facturas, alimentos, medicamentos, equipos y repuestos.', group: 'Comercial y finanzas', icon: ShoppingCart },
  { key: 'proveedores', path: '/proveedores', label: 'Proveedores', description: 'Historial comercial, pagos, balance, evaluación y cumplimiento.', group: 'Comercial y finanzas', icon: Truck },
  { key: 'clientes', path: '/clientes', label: 'Clientes', description: 'Crédito, pedidos, ventas, historial, saldo y comportamiento comercial.', group: 'Comercial y finanzas', icon: Users },
  { key: 'ventas', path: '/ventas', label: 'Ventas', description: 'Pedidos, facturación, métodos de pago, clientes y análisis comercial.', group: 'Comercial y finanzas', icon: Receipt },
  { key: 'cuentas_cobrar', path: '/cuentas-cobrar', label: 'Cuentas por cobrar', description: 'Facturas pendientes, vencimientos, cobros y recordatorios.', group: 'Comercial y finanzas', icon: WalletCards },
  { key: 'cuentas_pagar', path: '/cuentas-pagar', label: 'Cuentas por pagar', description: 'Compromisos con proveedores, pagos y vencimientos.', group: 'Comercial y finanzas', icon: WalletCards },
  { key: 'gastos', path: '/gastos', label: 'Gastos', description: 'Electricidad, agua, nómina, combustible, mantenimiento y otros costos.', group: 'Comercial y finanzas', icon: WalletCards },
  { key: 'rentabilidad', path: '/rentabilidad', label: 'Rentabilidad', description: 'Costo por huevo, lote y galpón, utilidad, margen y retorno.', group: 'Comercial y finanzas', icon: TrendingUp },
  { key: 'reportes', path: '/reportes', label: 'Centro de inteligencia', description: 'Reportes operativos, financieros y sanitarios para toma de decisiones.', group: 'Administración', icon: FileBarChart },
  { key: 'configuracion', path: '/configuracion', label: 'Configuración', description: 'Usuarios, roles, permisos, empresas, sucursales e integraciones.', group: 'Administración', icon: Settings },
]

export const AVICOLA_GROUPS: ModuleGroup[] = ['Operación', 'Inventario y sanidad', 'Comercial y finanzas', 'Administración']
export const AVICOLA_MODULE_KEYS = AVICOLA_MODULES.map((module) => module.key)
