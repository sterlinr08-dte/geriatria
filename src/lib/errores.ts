function extraerMensaje(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message?: unknown }).message || '')
  }
  return String(error || '')
}

export function traducirError(error: unknown): string {
  const mensaje = extraerMensaje(error)
  const normalizado = mensaje.toLowerCase()

  if (normalizado.includes('capacidad del galpón') || normalizado.includes('capacidad del galpon')) {
    return mensaje
  }
  if (normalizado.includes('galpón no disponible') || normalizado.includes('galpon no disponible')) {
    return 'El galpón seleccionado no está disponible para recibir este lote.'
  }
  if (normalizado.includes('duplicate key') || normalizado.includes('unique constraint')) {
    return 'Ya existe un registro con ese código o nombre.'
  }
  if (normalizado.includes('row-level security') || normalizado.includes('permission denied')) {
    return 'No tienes permiso para realizar esta acción.'
  }
  if (normalizado.includes('foreign key')) {
    return 'No se pudo completar la operación porque existen datos relacionados o una selección no es válida.'
  }
  if (normalizado.includes('network') || normalizado.includes('fetch')) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.'
  }
  if (normalizado.includes('not null')) {
    return 'Completa todos los campos obligatorios.'
  }
  if (normalizado.includes('check constraint') || normalizado.includes('23514')) {
    return 'Los datos no cumplen las reglas operativas definidas para este registro.'
  }

  return 'No se pudo completar la operación. Inténtalo nuevamente.'
}

/**
 * Compatibilidad temporal con módulos creados antes de la unificación.
 * Los módulos nuevos deben importar únicamente `traducirError`.
 */
export const mensajeErrorSupabase = traducirError
export const traducirErrorSupabase = traducirError
