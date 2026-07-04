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
  color: string              // color de identidad de la zona (punto/etiqueta)
  pos: [number, number]      // posición en la figura 2D, en % (x, y) sobre la imagen del cuerpo
  sintomas: string[]
}

// Colores de identidad y posiciones tomados del mockup del Dr. (figura del adulto mayor).
export const ZONAS: ZonaDef[] = [
  {
    key: 'cabeza', num: 1, nombre: 'Cabeza y sistema nervioso', color: '#2563eb', pos: [47, 5.3],
    sintomas: ['Dolor de cabeza', 'Mareos / Vértigo', 'Alteraciones cognitivas', 'Trastornos del sueño', 'Caídas', 'Cambios de ánimo'],
  },
  {
    key: 'ojos', num: 2, nombre: 'Ojos', color: '#16a34a', pos: [56.5, 7],
    sintomas: ['Disminución de agudeza visual', 'Visión borrosa', 'Cataratas / Glaucoma', 'Sequedad o irritación'],
  },
  {
    key: 'oidos', num: 3, nombre: 'Oídos', color: '#d97706', pos: [63, 11.5],
    sintomas: ['Disminución auditiva', 'Zumbidos', 'Vértigo', 'Infecciones'],
  },
  {
    key: 'boca', num: 4, nombre: 'Boca y garganta', color: '#7c3aed', pos: [46.5, 13],
    sintomas: ['Dificultad para masticar', 'Sequedad bucal', 'Problemas para tragar (disfagia)', 'Úlceras o lesiones', 'Pérdida de dientes'],
  },
  {
    key: 'corazon', num: 5, nombre: 'Corazón y circulación', color: '#dc2626', pos: [64, 25],
    sintomas: ['Dolor en el pecho', 'Palpitaciones', 'Hipertensión / Hipotensión', 'Edema (hinchazón)', 'Problemas de circulación'],
  },
  {
    key: 'pulmones', num: 6, nombre: 'Pulmones y vías respiratorias', color: '#ea580c', pos: [20.7, 33],
    sintomas: ['Dificultad para respirar', 'Tos persistente', 'Expectoración', 'Sibilancias', 'Infecciones respiratorias'],
  },
  {
    key: 'digestivo', num: 7, nombre: 'Sistema digestivo', color: '#0d9488', pos: [46.5, 39],
    sintomas: ['Pérdida de apetito', 'Náuseas / Vómitos', 'Estreñimiento / Diarrea', 'Dolor abdominal', 'Dificultad para deglutir'],
  },
  {
    key: 'urinario', num: 8, nombre: 'Sistema urinario', color: '#65a30d', pos: [46.5, 49],
    sintomas: ['Incontinencia urinaria', 'Dificultad para orinar', 'Aumento de frecuencia', 'Dolor o ardor al orinar', 'Infecciones urinarias'],
  },
  {
    key: 'musculo', num: 9, nombre: 'Sistema músculoesquelético', color: '#db2777', pos: [69, 70],
    sintomas: ['Dolor articular o muscular', 'Rigidez', 'Debilidad', 'Limitación de movilidad', 'Osteoporosis / Fracturas'],
  },
  {
    key: 'piel', num: 10, nombre: 'Piel y tejidos', color: '#0284c7', pos: [17.7, 78.7],
    sintomas: ['Úlceras por presión', 'Sequedad', 'Lesiones / Heridas', 'Moretones', 'Cambios en coloración'],
  },
  {
    key: 'pies', num: 11, nombre: 'Pies', color: '#9333ea', pos: [70, 92],
    sintomas: ['Dolor', 'Úlceras / Heridas', 'Hongos', 'Mala circulación', 'Entumecimiento'],
  },
]

export const zonaPorKey = (k: string) => ZONAS.find((z) => z.key === k)

export const DESCARGO_MAPA =
  'Esta herramienta es de apoyo para la Evaluación Geriátrica Integral y no sustituye el criterio clínico profesional.'
