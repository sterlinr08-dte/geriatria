// Vacunas recomendadas en el adulto mayor. Lista de trabajo (orientativa) basada en
// las recomendaciones habituales de inmunización del adulto mayor. Sirve para registrar
// aplicaciones y para señalar qué vacunas del esquema aún no tiene el paciente.
// El médico decide según cada caso; el registro también admite vacunas libres.

export interface VacunaDef {
  key: string
  nombre: string
  descripcion: string
  // refuerzo/periodicidad orientativa en meses (null = dosis única o según esquema)
  refuerzoMeses: number | null
  esquema: string
}

export const VACUNAS: VacunaDef[] = [
  {
    key: 'influenza',
    nombre: 'Influenza (gripe)',
    descripcion: 'Recomendada de forma anual en el adulto mayor.',
    refuerzoMeses: 12,
    esquema: 'Anual, antes de la temporada.',
  },
  {
    key: 'neumococo_conjugada',
    nombre: 'Neumococo conjugada (PCV13/15/20)',
    descripcion: 'Protege frente a enfermedad neumocócica invasora.',
    refuerzoMeses: null,
    esquema: 'Dosis única; puede seguirse de PPSV23 según esquema.',
  },
  {
    key: 'neumococo_polisacarida',
    nombre: 'Neumococo polisacárida (PPSV23)',
    descripcion: 'Complementa a la conjugada en el esquema del adulto mayor.',
    refuerzoMeses: null,
    esquema: 'Habitualmente 6–12 meses después de la conjugada.',
  },
  {
    key: 'herpes_zoster',
    nombre: 'Herpes zóster (culebrilla)',
    descripcion: 'Recomendada desde los 50 años; reduce el zóster y la neuralgia posherpética.',
    refuerzoMeses: null,
    esquema: 'Recombinante: 2 dosis separadas 2–6 meses.',
  },
  {
    key: 'tdap',
    nombre: 'Tétanos–difteria (Td/Tdap)',
    descripcion: 'Protección frente a tétanos y difteria; una dosis con componente de tos ferina (Tdap).',
    refuerzoMeses: 120,
    esquema: 'Refuerzo cada 10 años.',
  },
  {
    key: 'covid19',
    nombre: 'COVID-19',
    descripcion: 'Vacunación y refuerzos según recomendaciones vigentes.',
    refuerzoMeses: 12,
    esquema: 'Refuerzo según esquema vigente.',
  },
  {
    key: 'hepatitis_b',
    nombre: 'Hepatitis B',
    descripcion: 'Según factores de riesgo (diabetes, hemodiálisis, exposición).',
    refuerzoMeses: null,
    esquema: '3 dosis (0, 1 y 6 meses).',
  },
]

export const vacunaPorKey = (key: string) => VACUNAS.find((v) => v.key === key)

function normaliza(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Empareja un registro (por nombre libre) con una vacuna del esquema, si coincide.
export function detectarVacuna(nombre: string): VacunaDef | undefined {
  const n = normaliza(nombre)
  if (!n.trim()) return undefined
  return VACUNAS.find((v) => {
    const claves = normaliza(v.nombre + ' ' + v.key.replace(/_/g, ' '))
    return claves.split(/[\s/()–-]+/).some((p) => p.length >= 4 && n.includes(p))
  })
}
