// Carga farmacológica del adulto mayor: escala de Carga Anticolinérgica (ACB) y
// carga sedante (aproximación al Drug Burden Index). Listas CURADAS por principio
// activo, orientadas a la desprescripción. AYUDA ORIENTATIVA, no sustituye el juicio
// clínico ni reemplaza la revisión de dosis (el DBI formal requiere la dosis diaria).

export type NivelACB = 'ninguna' | 'baja' | 'significativa'

export interface DetalleACB {
  nombre: string   // el nombre tal como lo escribió el médico
  grupo: string    // a qué corresponde en la escala
  puntos: 1 | 2 | 3
}

export interface CargaAnticolinergica {
  total: number
  detalle: DetalleACB[]
  nivel: NivelACB
  interpretacion: string
}

export interface CargaSedante {
  total: number
  detalle: { nombre: string; grupo: string }[]
}

export const DESCARGO_CARGA =
  'Carga anticolinérgica (escala ACB) y sedante, orientativas para desprescribir. ' +
  'No consideran la dosis ni sustituyen el juicio clínico.'

// Escala ACB (Anticholinergic Cognitive Burden). Puntos por principio activo:
// 3 = anticolinérgico definido; 2 = moderado; 1 = posible/leve.
interface ReglaACB { terminos: string[]; grupo: string; puntos: 1 | 2 | 3 }

const ACB: ReglaACB[] = [
  // ---- 3 puntos ----
  { terminos: ['amitriptilina', 'imipramina', 'clomipramina', 'nortriptilina', 'doxepina', 'trimipramina', 'desipramina'], grupo: 'Antidepresivo tricíclico', puntos: 3 },
  { terminos: ['difenhidramina', 'clorfeniramina', 'clorfenamina', 'hidroxizina', 'clemastina', 'prometazina', 'meclizina', 'dimenhidrinato'], grupo: 'Antihistamínico de 1.ª generación', puntos: 3 },
  { terminos: ['oxibutinina', 'tolterodina', 'solifenacina', 'fesoterodina', 'darifenacina', 'flavoxato'], grupo: 'Antimuscarínico urinario', puntos: 3 },
  { terminos: ['diciclomina', 'dicicloverina', 'hioscina', 'escopolamina', 'hiosciamina', 'atropina', 'propantelina', 'clidinio'], grupo: 'Antiespasmódico / antimuscarínico', puntos: 3 },
  { terminos: ['clozapina', 'olanzapina', 'quetiapina', 'clorpromazina', 'tioridazina', 'perfenazina', 'trifluoperazina'], grupo: 'Antipsicótico anticolinérgico', puntos: 3 },
  { terminos: ['benztropina', 'trihexifenidilo', 'biperideno'], grupo: 'Antiparkinsoniano anticolinérgico', puntos: 3 },
  { terminos: ['paroxetina'], grupo: 'ISRS con carga anticolinérgica', puntos: 3 },
  // ---- 2 puntos ----
  { terminos: ['carbamazepina', 'oxcarbazepina'], grupo: 'Anticonvulsivante', puntos: 2 },
  { terminos: ['ciclobenzaprina'], grupo: 'Relajante muscular', puntos: 2 },
  { terminos: ['ciproheptadina'], grupo: 'Antihistamínico', puntos: 2 },
  { terminos: ['meperidina', 'petidina'], grupo: 'Opioide', puntos: 2 },
  { terminos: ['amantadina'], grupo: 'Antiviral / antiparkinsoniano', puntos: 2 },
  { terminos: ['pimozida', 'loxapina'], grupo: 'Antipsicótico', puntos: 2 },
  // ---- 1 punto ----
  { terminos: ['alprazolam', 'diazepam', 'clorazepato'], grupo: 'Benzodiazepina', puntos: 1 },
  { terminos: ['risperidona', 'haloperidol', 'aripiprazol'], grupo: 'Antipsicótico', puntos: 1 },
  { terminos: ['trazodona', 'venlafaxina', 'fluvoxamina', 'bupropion'], grupo: 'Antidepresivo', puntos: 1 },
  { terminos: ['cetirizina', 'levocetirizina'], grupo: 'Antihistamínico de 2.ª generación', puntos: 1 },
  { terminos: ['codeina', 'morfina', 'fentanilo', 'tramadol'], grupo: 'Opioide', puntos: 1 },
  { terminos: ['digoxina'], grupo: 'Glucósido cardíaco', puntos: 1 },
  { terminos: ['furosemida'], grupo: 'Diurético de asa', puntos: 1 },
  { terminos: ['nifedipino', 'nifedipina'], grupo: 'Calcioantagonista', puntos: 1 },
  { terminos: ['ranitidina', 'cimetidina'], grupo: 'Anti-H2', puntos: 1 },
  { terminos: ['warfarina'], grupo: 'Anticoagulante', puntos: 1 },
  { terminos: ['atenolol', 'metoprolol'], grupo: 'Betabloqueante', puntos: 1 },
  { terminos: ['prednisona', 'prednisolona', 'hidrocortisona'], grupo: 'Corticoide', puntos: 1 },
  { terminos: ['colchicina'], grupo: 'Antigotoso', puntos: 1 },
  { terminos: ['loperamida'], grupo: 'Antidiarreico', puntos: 1 },
]

// Fármacos con carga sedante (aproximación al componente sedante del Drug Burden Index).
const SEDANTES: { terminos: string[]; grupo: string }[] = [
  { terminos: ['diazepam', 'lorazepam', 'alprazolam', 'clonazepam', 'bromazepam', 'midazolam', 'clordiazepox', 'clorazepato'], grupo: 'Benzodiazepina' },
  { terminos: ['zolpidem', 'zopiclona', 'eszopiclona', 'zaleplon'], grupo: 'Hipnótico “Z”' },
  { terminos: ['fenobarbital', 'barbital'], grupo: 'Barbitúrico' },
  { terminos: ['codeina', 'morfina', 'fentanilo', 'tramadol', 'oxicodona', 'meperidina', 'petidina', 'hidrocodona', 'metadona'], grupo: 'Opioide' },
  { terminos: ['haloperidol', 'risperidona', 'quetiapina', 'olanzapina', 'clozapina', 'clorpromazina', 'aripiprazol'], grupo: 'Antipsicótico' },
  { terminos: ['amitriptilina', 'imipramina', 'clomipramina', 'nortriptilina', 'doxepina', 'trimipramina'], grupo: 'Antidepresivo tricíclico' },
  { terminos: ['mirtazapina', 'trazodona'], grupo: 'Antidepresivo sedante' },
  { terminos: ['difenhidramina', 'clorfeniramina', 'clorfenamina', 'hidroxizina', 'prometazina', 'dimenhidrinato'], grupo: 'Antihistamínico sedante' },
  { terminos: ['gabapentina', 'pregabalina'], grupo: 'Gabapentinoide' },
  { terminos: ['ciclobenzaprina', 'carisoprodol', 'metocarbamol', 'clorzoxazona', 'baclofeno', 'tizanidina'], grupo: 'Relajante muscular' },
]

function normaliza(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Puntaje de carga anticolinérgica (ACB) del conjunto de medicamentos activos.
export function cargaAnticolinergica(nombres: string[]): CargaAnticolinergica {
  const detalle: DetalleACB[] = []
  for (const nombre of nombres) {
    const n = normaliza(nombre)
    if (!n.trim()) continue
    // Un fármaco puntúa por la regla de MAYOR puntaje que coincida.
    let mejor: ReglaACB | null = null
    for (const r of ACB) {
      if (r.terminos.some((t) => n.includes(normaliza(t)))) {
        if (!mejor || r.puntos > mejor.puntos) mejor = r
      }
    }
    if (mejor) detalle.push({ nombre, grupo: mejor.grupo, puntos: mejor.puntos })
  }
  const total = detalle.reduce((s, d) => s + d.puntos, 0)
  const nivel: NivelACB = total >= 3 ? 'significativa' : total >= 1 ? 'baja' : 'ninguna'
  const interpretacion =
    nivel === 'significativa'
      ? 'Carga anticolinérgica clínicamente significativa (≥ 3): mayor riesgo de deterioro cognitivo, caídas y mortalidad. Valorar desprescribir.'
      : nivel === 'baja'
        ? 'Carga anticolinérgica baja (1–2): vigilar y evitar sumar más fármacos anticolinérgicos.'
        : 'Sin carga anticolinérgica relevante.'
  return { total, detalle, nivel, interpretacion }
}

// Conteo de fármacos con carga sedante (componente sedante del DBI).
export function cargaSedante(nombres: string[]): CargaSedante {
  const detalle: { nombre: string; grupo: string }[] = []
  for (const nombre of nombres) {
    const n = normaliza(nombre)
    if (!n.trim()) continue
    const hit = SEDANTES.find((r) => r.terminos.some((t) => n.includes(normaliza(t))))
    if (hit) detalle.push({ nombre, grupo: hit.grupo })
  }
  return { total: detalle.length, detalle }
}
