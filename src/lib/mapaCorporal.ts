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

// Figura del cuerpo según el sexo del paciente.
// Femenino → mujer; todo lo demás (Masculino, Otro, sin especificar) → hombre.
export function figuraPorSexo(sexo?: string | null): string {
  const s = (sexo ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
  const femenino = s === 'f' || s.startsWith('fem') || s.includes('muj')
  return femenino ? '/cuerpo-mujer.png' : '/cuerpo-hombre.png'
}

export const DESCARGO_MAPA =
  'Esta herramienta es de apoyo para la Evaluación Geriátrica Integral y no sustituye el criterio clínico profesional.'
