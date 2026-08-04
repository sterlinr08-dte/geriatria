// Catálogo único de módulos de AVÍCOLA ERP.
export interface Modulo {
  key: string
  label: string
  path: string
}

export const MODULOS: Modulo[] = [
  { key: 'panel', label: 'Dashboard', path: '/' },
  { key: 'granjas', label: 'Granjas', path: '/granjas' },
  { key: 'galpones', label: 'Galpones', path: '/galpones' },
  { key: 'lotes', label: 'Lotes de gallinas', path: '/lotes' },
  { key: 'produccion', label: 'Producción diaria', path: '/produccion' },
  { key: 'recoleccion', label: 'Recolección', path: '/recoleccion' },
  { key: 'clasificacion', label: 'Clasificación', path: '/clasificacion' },
  { key: 'empaque', label: 'Empaque', path: '/empaque' },
  { key: 'inventario_huevos', label: 'Inventario de huevos', path: '/inventario-huevos' },
  { key: 'inventario_alimentos', label: 'Inventario de alimentos', path: '/inventario-alimentos' },
  { key: 'consumo', label: 'Consumo de alimento', path: '/consumo' },
  { key: 'sanidad', label: 'Sanidad', path: '/sanidad' },
  { key: 'mortalidad', label: 'Mortalidad', path: '/mortalidad' },
  { key: 'calidad', label: 'Calidad', path: '/calidad' },
  { key: 'compras', label: 'Compras', path: '/compras' },
  { key: 'proveedores', label: 'Proveedores', path: '/proveedores' },
  { key: 'clientes', label: 'Clientes', path: '/clientes' },
  { key: 'ventas', label: 'Ventas', path: '/ventas' },
  { key: 'cuentas_cobrar', label: 'Cuentas por cobrar', path: '/cuentas-cobrar' },
  { key: 'cuentas_pagar', label: 'Cuentas por pagar', path: '/cuentas-pagar' },
  { key: 'gastos', label: 'Gastos', path: '/gastos' },
  { key: 'rentabilidad', label: 'Rentabilidad', path: '/rentabilidad' },
  { key: 'reportes', label: 'Centro de inteligencia', path: '/reportes' },
  { key: 'configuracion', label: 'Configuración', path: '/configuracion' },
]

export const TODOS_MODULOS = MODULOS.map((m) => m.key)

export interface Accion {
  key: string
  label: string
  modulo: string
}

export const ACCIONES: Accion[] = [
  { key: 'produccion.crear', label: 'Registrar producción diaria', modulo: 'produccion' },
  { key: 'produccion.editar', label: 'Editar registros de producción', modulo: 'produccion' },
  { key: 'mortalidad.crear', label: 'Registrar mortalidad', modulo: 'mortalidad' },
  { key: 'inventario.ajustar', label: 'Realizar ajustes de inventario', modulo: 'inventario_huevos' },
  { key: 'ventas.cobrar', label: 'Registrar cobros de ventas', modulo: 'ventas' },
  { key: 'compras.aprobar', label: 'Aprobar órdenes de compra', modulo: 'compras' },
  { key: 'configuracion.usuarios', label: 'Administrar usuarios y permisos', modulo: 'configuracion' },
]

export function etiquetaPermiso(key: string): string {
  return MODULOS.find((m) => m.key === key)?.label ?? ACCIONES.find((a) => a.key === key)?.label ?? key
}

export interface Rol {
  key: string
  nombre: string
  permisos: string[]
  es_admin: boolean
  protegido: boolean
}

export interface Perfil {
  id: string
  nombre: string | null
  username: string | null
  email: string | null
  rol_key: string | null
  activo: boolean
  rol_nombre?: string | null
  permisos: string[]
  es_admin: boolean
}
