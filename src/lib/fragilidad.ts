// Índice de fragilidad por ACUMULACIÓN DE DÉFICITS para el adulto mayor.
// Sigue el modelo de Rockwood (Frailty Index = déficits presentes / déficits
// evaluados), calculado con los datos que ya viven en el expediente. NO es el eFI
// validado de 36 ítems: es una estimación práctica y orientativa; no sustituye el
// juicio clínico.

export type NivelFragilidad = 'robusto' | 'leve' | 'moderada' | 'severa'

export interface SenalesFragilidad {
  multimorbilidad: boolean          // >= 3 problemas crónicos activos
  polifarmacia: boolean             // >= 5 medicamentos activos
  medicacionInapropiada: boolean    // algún fármaco potencialmente inapropiado (Beers/STOPP)
  cargaAnticolinergica: boolean     // carga anticolinérgica significativa (ACB >= 3)
  caidas: boolean                   // antecedente / diagnóstico de caídas
  escalasAlteradas: number          // escalas geriátricas en naranja/rojo (cada una = 1 déficit)
  escalasEvaluadas: number          // escalas geriátricas con al menos un resultado registrado
}

export interface Fragilidad {
  nivel: NivelFragilidad
  label: string
  color: string
  indice: number          // fracción 0–1 (déficits presentes / evaluados)
  presentes: number
  evaluados: number
  deficits: string[]       // etiquetas de los déficits presentes
}

const DEF: Record<NivelFragilidad, { label: string; color: string }> = {
  robusto: { label: 'Sin fragilidad', color: '#22c55e' },
  leve: { label: 'Fragilidad leve', color: '#eab308' },
  moderada: { label: 'Fragilidad moderada', color: '#f59e0b' },
  severa: { label: 'Fragilidad severa', color: '#ef4444' },
}

// Los 5 dominios clínicos siempre se consideran evaluados (salen de datos que
// siempre están: problemas, medicación y antecedentes). Las escalas suman al
// denominador solo cuando se han aplicado.
const DEFICITS_CLINICOS_BASE = 5

export function calcularFragilidad(s: SenalesFragilidad): Fragilidad {
  const deficits: string[] = []
  if (s.multimorbilidad) deficits.push('Múltiples enfermedades crónicas')
  if (s.polifarmacia) deficits.push('Polifarmacia')
  if (s.medicacionInapropiada) deficits.push('Medicación potencialmente inapropiada')
  if (s.cargaAnticolinergica) deficits.push('Carga anticolinérgica alta')
  if (s.caidas) deficits.push('Caídas')
  if (s.escalasAlteradas > 0) deficits.push(`${s.escalasAlteradas} escala(s) alterada(s)`)

  const escalasAlteradas = Math.max(0, s.escalasAlteradas)
  const escalasEvaluadas = Math.max(escalasAlteradas, s.escalasEvaluadas)

  const presentes =
    (s.multimorbilidad ? 1 : 0) + (s.polifarmacia ? 1 : 0) + (s.medicacionInapropiada ? 1 : 0) +
    (s.cargaAnticolinergica ? 1 : 0) + (s.caidas ? 1 : 0) + escalasAlteradas
  const evaluados = DEFICITS_CLINICOS_BASE + escalasEvaluadas
  const indice = evaluados > 0 ? presentes / evaluados : 0

  // Puntos de corte tipo Rockwood: <=0.12 robusto, <=0.25 leve (prefrágil),
  // <=0.40 moderada, >0.40 severa.
  const nivel: NivelFragilidad =
    indice <= 0.12 ? 'robusto' : indice <= 0.25 ? 'leve' : indice <= 0.4 ? 'moderada' : 'severa'

  return { nivel, label: DEF[nivel].label, color: DEF[nivel].color, indice, presentes, evaluados, deficits }
}

export const DESCARGO_FRAGILIDAD =
  'Índice de fragilidad por acumulación de déficits (orientativo, no es el eFI validado); ' +
  'estimado con los datos del expediente. No sustituye la valoración clínica.'
