// Mapa del cuerpo humano — Evaluación Geriátrica Integral.
// 11 zonas (revisión por sistemas) con su checklist de síntomas frecuentes y un
// nivel de alerta por zona. Calcado del formato del Dr. (mapa corporal geriátrico).
// Herramienta de apoyo; no sustituye el criterio clínico profesional.

export type NivelKey = 'sin' | 'leve' | 'moderado' | 'severo'

export interface NivelDef {
  key: NivelKey
  label: string
  color: string   // color del nivel (heatmap / badge)
  descripcion: string
  glow: boolean    // si enciende la zona en el cuerpo 3D
}

export const NIVELES: NivelDef[] = [
  { key: 'sin', label: 'Sin alteraciones', color: '#22c55e', descripcion: 'Sin signos o síntomas anormales.', glow: false },
  { key: 'leve', label: 'Leve', color: '#eab308', descripcion: 'Síntomas leves, requiere monitoreo.', glow: true },
  { key: 'moderado', label: 'Moderado', color: '#f59e0b', descripcion: 'Síntomas presentes, evaluación médica recomendada.', glow: true },
  { key: 'severo', label: 'Severo', color: '#ef4444', descripcion: 'Síntomas graves, atención médica inmediata.', glow: true },
]

export const nivelDef = (k?: string | null): NivelDef => NIVELES.find((n) => n.key === k) ?? NIVELES[0]

export interface ZonaDef {
  key: string
  num: number
  nombre: string
  color: string                 // color de identidad de la zona (punto/etiqueta)
  anchor: [number, number, number] // posición en el cuerpo 3D (modelo ~1.7 alto, centrado, frente +z)
  sintomas: string[]
}

// Colores de identidad tomados del mockup del Dr.
export const ZONAS: ZonaDef[] = [
  {
    key: 'cabeza', num: 1, nombre: 'Cabeza y sistema nervioso', color: '#2563eb', anchor: [0, 0.78, 0.04],
    sintomas: ['Dolor de cabeza', 'Mareos / Vértigo', 'Alteraciones cognitivas', 'Trastornos del sueño', 'Caídas', 'Cambios de ánimo'],
  },
  {
    key: 'ojos', num: 2, nombre: 'Ojos', color: '#16a34a', anchor: [0.05, 0.72, 0.12],
    sintomas: ['Disminución de agudeza visual', 'Visión borrosa', 'Cataratas / Glaucoma', 'Sequedad o irritación'],
  },
  {
    key: 'oidos', num: 3, nombre: 'Oídos', color: '#d97706', anchor: [0.13, 0.73, 0.02],
    sintomas: ['Disminución auditiva', 'Zumbidos', 'Vértigo', 'Infecciones'],
  },
  {
    key: 'boca', num: 4, nombre: 'Boca y garganta', color: '#7c3aed', anchor: [0, 0.6, 0.09],
    sintomas: ['Dificultad para masticar', 'Sequedad bucal', 'Problemas para tragar (disfagia)', 'Úlceras o lesiones', 'Pérdida de dientes'],
  },
  {
    key: 'corazon', num: 5, nombre: 'Corazón y circulación', color: '#dc2626', anchor: [0.06, 0.28, 0.13],
    sintomas: ['Dolor en el pecho', 'Palpitaciones', 'Hipertensión / Hipotensión', 'Edema (hinchazón)', 'Problemas de circulación'],
  },
  {
    key: 'pulmones', num: 6, nombre: 'Pulmones y vías respiratorias', color: '#ea580c', anchor: [-0.1, 0.3, 0.12],
    sintomas: ['Dificultad para respirar', 'Tos persistente', 'Expectoración', 'Sibilancias', 'Infecciones respiratorias'],
  },
  {
    key: 'digestivo', num: 7, nombre: 'Sistema digestivo', color: '#0d9488', anchor: [0, 0.12, 0.14],
    sintomas: ['Pérdida de apetito', 'Náuseas / Vómitos', 'Estreñimiento / Diarrea', 'Dolor abdominal', 'Dificultad para deglutir'],
  },
  {
    key: 'urinario', num: 8, nombre: 'Sistema urinario', color: '#65a30d', anchor: [0, -0.05, 0.13],
    sintomas: ['Incontinencia urinaria', 'Dificultad para orinar', 'Aumento de frecuencia', 'Dolor o ardor al orinar', 'Infecciones urinarias'],
  },
  {
    key: 'musculo', num: 9, nombre: 'Sistema músculoesquelético', color: '#db2777', anchor: [0.14, -0.2, 0.1],
    sintomas: ['Dolor articular o muscular', 'Rigidez', 'Debilidad', 'Limitación de movilidad', 'Osteoporosis / Fracturas'],
  },
  {
    key: 'piel', num: 10, nombre: 'Piel y tejidos', color: '#0284c7', anchor: [-0.16, -0.42, 0.08],
    sintomas: ['Úlceras por presión', 'Sequedad', 'Lesiones / Heridas', 'Moretones', 'Cambios en coloración'],
  },
  {
    key: 'pies', num: 11, nombre: 'Pies', color: '#9333ea', anchor: [0.1, -0.92, 0.06],
    sintomas: ['Dolor', 'Úlceras / Heridas', 'Hongos', 'Mala circulación', 'Entumecimiento'],
  },
]

export const zonaPorKey = (k: string) => ZONAS.find((z) => z.key === k)

export const DESCARGO_MAPA =
  'Esta herramienta es de apoyo para la Evaluación Geriátrica Integral y no sustituye el criterio clínico profesional.'
