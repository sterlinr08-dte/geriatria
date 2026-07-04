// Índice de fragilidad ORIENTATIVO para el adulto mayor.
// No es el eFI validado (36 déficits); es un semáforo práctico que cuenta señales
// de fragilidad ya presentes en el expediente. Ayuda de apoyo, no sustituye el juicio clínico.

export type NivelFragilidad = 'robusto' | 'leve' | 'moderada' | 'severa'

export interface SenalesFragilidad {
  polifarmacia: boolean          // >= 5 medicamentos activos
  multimorbilidad: boolean       // >= 3 problemas crónicos activos
  escalasAlteradas: number       // escalas geriátricas en naranja/rojo
  caidas: boolean                // antecedente / diagnóstico de caídas
  medicacionInapropiada: boolean // algún fármaco potencialmente inapropiado
}

export interface Fragilidad {
  nivel: NivelFragilidad
  label: string
  color: string
  deficits: string[]
}

const DEF: Record<NivelFragilidad, { label: string; color: string }> = {
  robusto: { label: 'Sin fragilidad', color: '#22c55e' },
  leve: { label: 'Fragilidad leve', color: '#eab308' },
  moderada: { label: 'Fragilidad moderada', color: '#f59e0b' },
  severa: { label: 'Fragilidad severa', color: '#ef4444' },
}

export function calcularFragilidad(s: SenalesFragilidad): Fragilidad {
  const deficits: string[] = []
  if (s.multimorbilidad) deficits.push('Múltiples enfermedades crónicas')
  if (s.polifarmacia) deficits.push('Polifarmacia')
  if (s.medicacionInapropiada) deficits.push('Medicación potencialmente inapropiada')
  if (s.caidas) deficits.push('Caídas')
  if (s.escalasAlteradas > 0) deficits.push(`${s.escalasAlteradas} escala(s) alterada(s)`)

  const n = (s.multimorbilidad ? 1 : 0) + (s.polifarmacia ? 1 : 0) + (s.caidas ? 1 : 0) +
    (s.medicacionInapropiada ? 1 : 0) + Math.min(2, s.escalasAlteradas)

  const nivel: NivelFragilidad = n <= 0 ? 'robusto' : n <= 1 ? 'leve' : n <= 3 ? 'moderada' : 'severa'
  return { nivel, label: DEF[nivel].label, color: DEF[nivel].color, deficits }
}

export const DESCARGO_FRAGILIDAD =
  'Estimación orientativa a partir de los datos del expediente; no sustituye la valoración clínica.'
