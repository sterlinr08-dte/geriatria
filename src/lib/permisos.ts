import { AVICOLA_MODULES, AVICOLA_MODULE_KEYS } from '../core/modules'

export interface Modulo {
  key: string
  label: string
  path: string
}

export const MODULOS: Modulo[] = AVICOLA_MODULES.map(({ key, label, path }) => ({ key, label, path }))
export const TODOS_MODULOS = AVICOLA_MODULE_KEYS

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
