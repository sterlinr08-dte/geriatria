// Mapa del cuerpo humano — Evaluación Geriátrica Integral.
// El médico coloca marcadores (pines) LIBRES donde quiera sobre la figura del paciente,
// los mueve, y en cada uno redacta el hallazgo y su nivel de alerta.
// Herramienta de apoyo; no sustituye el criterio clínico profesional.

export type NivelKey = 'leve' | 'moderado' | 'severo'

export interface NivelDef {
  key: NivelKey
  label: string
  color: string
  descripcion: string
}

export const NIVELES: NivelDef[] = [
  { key: 'leve', label: 'Leve', color: '#eab308', descripcion: 'Síntomas leves, requiere monitoreo.' },
  { key: 'moderado', label: 'Moderado', color: '#f59e0b', descripcion: 'Síntomas presentes, evaluación médica recomendada.' },
  { key: 'severo', label: 'Severo', color: '#ef4444', descripcion: 'Síntomas graves, atención médica inmediata.' },
]

export const nivelDef = (k?: string | null): NivelDef => NIVELES.find((n) => n.key === k) ?? NIVELES[1]

// Vista del cuerpo: frontal (delante) o posterior (espalda).
export type Vista = 'frontal' | 'posterior'
export type SexoKey = 'hombre' | 'mujer'

// Femenino -> mujer; todo lo demas (Masculino, sin especificar) -> hombre.
export function sexoKey(sexo?: string | null): SexoKey {
  const s = (sexo ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
  const femenino = s === 'f' || s.startsWith('fem') || s.includes('muj')
  return femenino ? 'mujer' : 'hombre'
}

const FIGURAS: Record<SexoKey, Record<Vista, string>> = {
  hombre: { frontal: '/cuerpo-hombre.png', posterior: '/cuerpo-hombre-espalda.png' },
  mujer: { frontal: '/cuerpo-mujer.png', posterior: '/cuerpo-mujer-espalda.png' },
}

// Ambos sexos tienen imagen de espalda (frontal y posterior).
export const TIENE_ESPALDA: Record<SexoKey, boolean> = { hombre: true, mujer: true }

export function figura(sexo?: string | null, vista: Vista = 'frontal'): string {
  const k = sexoKey(sexo)
  const v = vista === 'posterior' && !TIENE_ESPALDA[k] ? 'frontal' : vista
  return FIGURAS[k][v]
}

export const DESCARGO_MAPA =
  'Esta herramienta es de apoyo para la Evaluación Geriátrica Integral y no sustituye el criterio clínico profesional.'
