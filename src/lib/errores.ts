export function mensajeErrorSupabase(error: unknown): string {
  const mensaje = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message || '')
      : String(error || '')

  const normalizado = mensaje.toLowerCase()

  if (normalizado.includes('duplicate key') || normalizado.includes('unique constraint')) {
    return 'Ya existe un registro con ese código o nombre.'
  }
  if (normalizado.includes('row-level security') || normalizado.includes('permission denied')) {
    return 'No tienes permiso para realizar esta acción.'
  }
  if (normalizado.includes('foreign key')) {
    return 'No se pudo completar la operación porque existen datos relacionados.'
  }
  if (normalizado.includes('network') || normalizado.includes('fetch')) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.'
  }
  if (normalizado.includes('not null')) {
    return 'Completa todos los campos obligatorios.'
  }

  return 'No se pudo completar la operación. Inténtalo nuevamente.'
}
