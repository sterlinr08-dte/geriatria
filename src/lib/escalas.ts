// Catálogo de escalas de la Valoración Geriátrica Integral con cálculo automático.
// Cada escala se responde ítem por ítem; el puntaje se suma solo y se interpreta.

export type Tono = 'emerald' | 'yellow' | 'orange' | 'rose' | 'slate'

export interface OpcionEscala { label: string; puntos: number }
export interface ItemEscala { texto: string; opciones: OpcionEscala[] }
export interface DefEscala {
  key: string
  nombre: string
  sigla?: string
  dominio: string           // qué mide (funcional, cognitivo, ánimo, etc.)
  descripcion: string
  items: ItemEscala[]
  interpretar: (total: number) => { texto: string; tono: Tono }
  nota?: string
}

const SI_NO = (puntoSi: number, puntoNo: number): OpcionEscala[] => [
  { label: 'Sí', puntos: puntoSi },
  { label: 'No', puntos: puntoNo },
]
const INDEP = (): OpcionEscala[] => [
  { label: 'Independiente', puntos: 1 },
  { label: 'Dependiente', puntos: 0 },
]
const CORRECTO = (): OpcionEscala[] => [
  { label: 'Correcto', puntos: 0 },
  { label: 'Error', puntos: 1 },
]

export const ESCALAS: DefEscala[] = [
  // ---------------- BARTHEL (funcional básico) ----------------
  {
    key: 'barthel',
    nombre: 'Índice de Barthel',
    sigla: 'Barthel',
    dominio: 'Funcional — actividades básicas (AVD)',
    descripcion: 'Grado de independencia en las actividades básicas de la vida diaria.',
    items: [
      { texto: 'Comer', opciones: [{ label: 'Independiente', puntos: 10 }, { label: 'Necesita ayuda', puntos: 5 }, { label: 'Dependiente', puntos: 0 }] },
      { texto: 'Trasladarse (cama ↔ sillón)', opciones: [{ label: 'Independiente', puntos: 15 }, { label: 'Mínima ayuda', puntos: 10 }, { label: 'Gran ayuda', puntos: 5 }, { label: 'Dependiente', puntos: 0 }] },
      { texto: 'Aseo personal', opciones: [{ label: 'Independiente', puntos: 5 }, { label: 'Dependiente', puntos: 0 }] },
      { texto: 'Uso del retrete', opciones: [{ label: 'Independiente', puntos: 10 }, { label: 'Necesita ayuda', puntos: 5 }, { label: 'Dependiente', puntos: 0 }] },
      { texto: 'Bañarse / ducharse', opciones: [{ label: 'Independiente', puntos: 5 }, { label: 'Dependiente', puntos: 0 }] },
      { texto: 'Desplazarse / caminar', opciones: [{ label: 'Independiente', puntos: 15 }, { label: 'Con ayuda física', puntos: 10 }, { label: 'Independiente en silla de ruedas', puntos: 5 }, { label: 'Dependiente', puntos: 0 }] },
      { texto: 'Subir / bajar escaleras', opciones: [{ label: 'Independiente', puntos: 10 }, { label: 'Necesita ayuda', puntos: 5 }, { label: 'Dependiente', puntos: 0 }] },
      { texto: 'Vestirse', opciones: [{ label: 'Independiente', puntos: 10 }, { label: 'Necesita ayuda', puntos: 5 }, { label: 'Dependiente', puntos: 0 }] },
      { texto: 'Control de heces', opciones: [{ label: 'Continente', puntos: 10 }, { label: 'Ocasional', puntos: 5 }, { label: 'Incontinente', puntos: 0 }] },
      { texto: 'Control de orina', opciones: [{ label: 'Continente', puntos: 10 }, { label: 'Ocasional', puntos: 5 }, { label: 'Incontinente', puntos: 0 }] },
    ],
    interpretar: (t) => t >= 100 ? { texto: 'Independiente', tono: 'emerald' }
      : t >= 60 ? { texto: 'Dependencia leve', tono: 'yellow' }
      : t >= 40 ? { texto: 'Dependencia moderada', tono: 'orange' }
      : t >= 20 ? { texto: 'Dependencia severa', tono: 'rose' }
      : { texto: 'Dependencia total', tono: 'rose' },
    nota: 'Puntaje 0–100. A mayor puntaje, mayor independencia.',
  },

  // ---------------- LAWTON-BRODY (funcional instrumental) ----------------
  {
    key: 'lawton',
    nombre: 'Escala de Lawton y Brody',
    sigla: 'Lawton',
    dominio: 'Funcional — actividades instrumentales (AIVD)',
    descripcion: 'Independencia en actividades instrumentales de la vida diaria.',
    items: [
      { texto: 'Capacidad para usar el teléfono', opciones: INDEP() },
      { texto: 'Ir de compras', opciones: INDEP() },
      { texto: 'Preparar la comida', opciones: INDEP() },
      { texto: 'Cuidado de la casa', opciones: INDEP() },
      { texto: 'Lavado de la ropa', opciones: INDEP() },
      { texto: 'Uso de medios de transporte', opciones: INDEP() },
      { texto: 'Responsable de su medicación', opciones: INDEP() },
      { texto: 'Manejo de asuntos económicos', opciones: INDEP() },
    ],
    interpretar: (t) => t >= 8 ? { texto: 'Autónomo', tono: 'emerald' }
      : t >= 6 ? { texto: 'Dependencia leve', tono: 'yellow' }
      : t >= 4 ? { texto: 'Dependencia moderada', tono: 'orange' }
      : { texto: 'Dependencia severa', tono: 'rose' },
    nota: 'Puntaje 0–8. A mayor puntaje, mayor independencia.',
  },

  // ---------------- YESAVAGE GDS-15 (ánimo/depresión) ----------------
  {
    key: 'gds15',
    nombre: 'Escala de depresión geriátrica de Yesavage (GDS-15)',
    sigla: 'GDS-15',
    dominio: 'Estado de ánimo — depresión',
    descripcion: 'Cribado de depresión en el adulto mayor (15 preguntas).',
    items: [
      { texto: '¿Está satisfecho con su vida?', opciones: SI_NO(0, 1) },
      { texto: '¿Ha abandonado muchas de sus actividades e intereses?', opciones: SI_NO(1, 0) },
      { texto: '¿Siente que su vida está vacía?', opciones: SI_NO(1, 0) },
      { texto: '¿Se aburre a menudo?', opciones: SI_NO(1, 0) },
      { texto: '¿Está de buen ánimo la mayor parte del tiempo?', opciones: SI_NO(0, 1) },
      { texto: '¿Teme que algo malo le vaya a pasar?', opciones: SI_NO(1, 0) },
      { texto: '¿Se siente feliz la mayor parte del tiempo?', opciones: SI_NO(0, 1) },
      { texto: '¿Se siente a menudo desamparado o indefenso?', opciones: SI_NO(1, 0) },
      { texto: '¿Prefiere quedarse en casa en vez de salir?', opciones: SI_NO(1, 0) },
      { texto: '¿Siente que tiene más problemas de memoria que los demás?', opciones: SI_NO(1, 0) },
      { texto: '¿Piensa que es maravilloso estar vivo?', opciones: SI_NO(0, 1) },
      { texto: '¿Se siente inútil o despreciable?', opciones: SI_NO(1, 0) },
      { texto: '¿Se siente lleno de energía?', opciones: SI_NO(0, 1) },
      { texto: '¿Siente que su situación es desesperada?', opciones: SI_NO(1, 0) },
      { texto: '¿Cree que la mayoría de la gente está mejor que usted?', opciones: SI_NO(1, 0) },
    ],
    interpretar: (t) => t <= 4 ? { texto: 'Normal (sin depresión)', tono: 'emerald' }
      : t <= 9 ? { texto: 'Depresión leve / probable', tono: 'orange' }
      : { texto: 'Depresión establecida', tono: 'rose' },
    nota: 'Puntaje 0–15. A mayor puntaje, mayor sospecha de depresión (≥5 sugiere depresión).',
  },

  // ---------------- PFEIFFER SPMSQ (cognitivo) ----------------
  {
    key: 'pfeiffer',
    nombre: 'Cuestionario de Pfeiffer (SPMSQ)',
    sigla: 'Pfeiffer',
    dominio: 'Cognitivo — deterioro',
    descripcion: 'Cribado de deterioro cognitivo. Se cuentan los errores.',
    items: [
      { texto: '¿Qué día es hoy? (día, mes, año)', opciones: CORRECTO() },
      { texto: '¿Qué día de la semana es?', opciones: CORRECTO() },
      { texto: '¿Cómo se llama este lugar?', opciones: CORRECTO() },
      { texto: '¿Cuál es su número de teléfono (o dirección)?', opciones: CORRECTO() },
      { texto: '¿Cuántos años tiene?', opciones: CORRECTO() },
      { texto: '¿Cuál es su fecha de nacimiento?', opciones: CORRECTO() },
      { texto: '¿Quién es el presidente actual del país?', opciones: CORRECTO() },
      { texto: '¿Quién fue el presidente anterior?', opciones: CORRECTO() },
      { texto: 'Primer apellido de su madre', opciones: CORRECTO() },
      { texto: 'Reste de 3 en 3 desde 20', opciones: CORRECTO() },
    ],
    interpretar: (t) => t <= 2 ? { texto: 'Normal', tono: 'emerald' }
      : t <= 4 ? { texto: 'Deterioro cognitivo leve', tono: 'yellow' }
      : t <= 7 ? { texto: 'Deterioro moderado', tono: 'orange' }
      : { texto: 'Deterioro severo', tono: 'rose' },
    nota: 'Cuenta errores (0–10). A más errores, mayor deterioro. Se permite 1 error extra si baja escolaridad.',
  },

  // ---------------- MNA-SF (nutricional) ----------------
  {
    key: 'mna',
    nombre: 'Mini Nutritional Assessment (forma corta)',
    sigla: 'MNA-SF',
    dominio: 'Nutricional',
    descripcion: 'Cribado del estado nutricional del adulto mayor.',
    items: [
      { texto: '¿Ha comido menos por falta de apetito, problemas digestivos, o dificultad para masticar/tragar en los últimos 3 meses?', opciones: [{ label: 'Anorexia grave', puntos: 0 }, { label: 'Anorexia moderada', puntos: 1 }, { label: 'Sin problemas', puntos: 2 }] },
      { texto: 'Pérdida de peso en los últimos 3 meses', opciones: [{ label: 'Mayor a 3 kg', puntos: 0 }, { label: 'No lo sabe', puntos: 1 }, { label: 'Entre 1 y 3 kg', puntos: 2 }, { label: 'Sin pérdida', puntos: 3 }] },
      { texto: 'Movilidad', opciones: [{ label: 'En cama o sillón', puntos: 0 }, { label: 'Se levanta pero no sale', puntos: 1 }, { label: 'Sale del domicilio', puntos: 2 }] },
      { texto: '¿Enfermedad aguda o estrés psicológico en los últimos 3 meses?', opciones: SI_NO(0, 2) },
      { texto: 'Problemas neuropsicológicos', opciones: [{ label: 'Demencia o depresión grave', puntos: 0 }, { label: 'Demencia leve', puntos: 1 }, { label: 'Sin problemas', puntos: 2 }] },
      { texto: 'Índice de masa corporal (IMC)', opciones: [{ label: 'Menor a 19', puntos: 0 }, { label: '19 a menos de 21', puntos: 1 }, { label: '21 a menos de 23', puntos: 2 }, { label: '23 o mayor', puntos: 3 }] },
    ],
    interpretar: (t) => t >= 12 ? { texto: 'Estado nutricional normal', tono: 'emerald' }
      : t >= 8 ? { texto: 'Riesgo de desnutrición', tono: 'orange' }
      : { texto: 'Desnutrición', tono: 'rose' },
    nota: 'Puntaje 0–14. A menor puntaje, peor estado nutricional.',
  },

  // ---------------- DOWNTON (riesgo de caídas) ----------------
  {
    key: 'downton',
    nombre: 'Índice de Downton',
    sigla: 'Downton',
    dominio: 'Riesgo de caídas',
    descripcion: 'Estima el riesgo de caídas del paciente.',
    items: [
      { texto: 'Caídas previas', opciones: SI_NO(1, 0) },
      { texto: 'Toma tranquilizantes o sedantes', opciones: SI_NO(1, 0) },
      { texto: 'Toma diuréticos', opciones: SI_NO(1, 0) },
      { texto: 'Toma antihipertensivos', opciones: SI_NO(1, 0) },
      { texto: 'Toma antiparkinsonianos o antidepresivos', opciones: SI_NO(1, 0) },
      { texto: 'Déficit visual', opciones: SI_NO(1, 0) },
      { texto: 'Déficit auditivo', opciones: SI_NO(1, 0) },
      { texto: 'Déficit en extremidades (paresia, amputación…)', opciones: SI_NO(1, 0) },
      { texto: 'Estado mental confuso / desorientado', opciones: SI_NO(1, 0) },
      { texto: 'Deambulación insegura o imposible', opciones: SI_NO(1, 0) },
    ],
    interpretar: (t) => t >= 3 ? { texto: 'Alto riesgo de caídas', tono: 'rose' }
      : { texto: 'Bajo riesgo de caídas', tono: 'emerald' },
    nota: 'A mayor puntaje, mayor riesgo. Un puntaje ≥ 3 indica alto riesgo de caídas.',
  },

  // ---------------- GIJÓN (socio-familiar) ----------------
  {
    key: 'gijon',
    nombre: 'Escala socio-familiar de Gijón',
    sigla: 'Gijón',
    dominio: 'Social — riesgo socio-familiar',
    descripcion: 'Valora la situación social y familiar del paciente.',
    items: [
      { texto: 'Situación familiar', opciones: [
        { label: 'Vive con familia, sin dependencia', puntos: 1 },
        { label: 'Vive con cónyuge de similar edad', puntos: 2 },
        { label: 'Vive con familia y presenta algún grado de dependencia', puntos: 3 },
        { label: 'Vive solo y tiene hijos cerca', puntos: 4 },
        { label: 'Vive solo y carece de familia cercana', puntos: 5 },
      ] },
      { texto: 'Situación económica', opciones: [
        { label: 'Más de 1.5 veces el salario mínimo', puntos: 1 },
        { label: 'Entre 1 y 1.5 el salario mínimo', puntos: 2 },
        { label: 'Un salario mínimo', puntos: 3 },
        { label: 'Pensión no contributiva / ingreso escaso', puntos: 4 },
        { label: 'Sin ingresos o muy insuficientes', puntos: 5 },
      ] },
      { texto: 'Vivienda', opciones: [
        { label: 'Adecuada a las necesidades', puntos: 1 },
        { label: 'Barreras arquitectónicas (escaleras, baño…)', puntos: 2 },
        { label: 'Humedad, mala higiene, equipamiento inadecuado', puntos: 3 },
        { label: 'Ausencia de ascensor, teléfono', puntos: 4 },
        { label: 'Vivienda inadecuada o ausente', puntos: 5 },
      ] },
      { texto: 'Relaciones sociales', opciones: [
        { label: 'Mantiene relaciones sociales fuera del domicilio', puntos: 1 },
        { label: 'Solo se relaciona con la familia / vecinos', puntos: 2 },
        { label: 'Solo se relaciona con la familia', puntos: 3 },
        { label: 'No sale del domicilio, recibe visitas', puntos: 4 },
        { label: 'No sale y no recibe visitas', puntos: 5 },
      ] },
      { texto: 'Apoyo de la red social', opciones: [
        { label: 'Con apoyo familiar o vecinal suficiente', puntos: 1 },
        { label: 'Apoyo social solo de vecinos', puntos: 2 },
        { label: 'Apoyo social escaso o inestable', puntos: 3 },
        { label: 'No tiene apoyo, pendiente de ingreso a residencia', puntos: 4 },
        { label: 'No tiene apoyo y necesita cuidados permanentes', puntos: 5 },
      ] },
    ],
    interpretar: (t) => t <= 9 ? { texto: 'Situación social buena / normal', tono: 'emerald' }
      : t <= 14 ? { texto: 'Riesgo social', tono: 'orange' }
      : { texto: 'Problema social establecido', tono: 'rose' },
    nota: 'Puntaje 5–25. A mayor puntaje, peor situación socio-familiar.',
  },
]

export function escalaPorKey(key: string): DefEscala | undefined {
  return ESCALAS.find((e) => e.key === key)
}

export const TONOS_ESCALA: Record<Tono, string> = {
  emerald: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  orange: 'bg-orange-100 text-orange-700',
  rose: 'bg-rose-100 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
}
