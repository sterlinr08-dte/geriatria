// Catálogo CIE-10 curado y PRÁCTICO para consulta geriátrica.
// No es la CIE-10 completa (decenas de miles de códigos): es una lista de trabajo
// con los diagnósticos más frecuentes en el adulto mayor, agrupados por sistema,
// para escoger rápido. El médico también puede escribir un código/diagnóstico libre.

export interface CodigoCIE10 {
  codigo: string
  descripcion: string
  grupo: string
}

export const CIE10: CodigoCIE10[] = [
  // Cardiovascular
  { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)', grupo: 'Cardiovascular' },
  { codigo: 'I25.9', descripcion: 'Enfermedad cardíaca isquémica crónica', grupo: 'Cardiovascular' },
  { codigo: 'I48', descripcion: 'Fibrilación y aleteo auricular', grupo: 'Cardiovascular' },
  { codigo: 'I50.9', descripcion: 'Insuficiencia cardíaca, no especificada', grupo: 'Cardiovascular' },
  { codigo: 'I63.9', descripcion: 'Infarto cerebral (ACV isquémico)', grupo: 'Cardiovascular' },
  { codigo: 'I69.4', descripcion: 'Secuelas de enfermedad cerebrovascular', grupo: 'Cardiovascular' },
  { codigo: 'I73.9', descripcion: 'Enfermedad vascular periférica', grupo: 'Cardiovascular' },
  { codigo: 'I83.9', descripcion: 'Várices de miembros inferiores', grupo: 'Cardiovascular' },
  { codigo: 'I95.1', descripcion: 'Hipotensión ortostática', grupo: 'Cardiovascular' },

  // Endocrino / metabólico
  { codigo: 'E11.9', descripcion: 'Diabetes mellitus tipo 2, sin complicaciones', grupo: 'Endocrino / metabólico' },
  { codigo: 'E11.5', descripcion: 'Diabetes mellitus tipo 2 con complicaciones circulatorias', grupo: 'Endocrino / metabólico' },
  { codigo: 'E03.9', descripcion: 'Hipotiroidismo, no especificado', grupo: 'Endocrino / metabólico' },
  { codigo: 'E05.9', descripcion: 'Hipertiroidismo (tirotoxicosis)', grupo: 'Endocrino / metabólico' },
  { codigo: 'E78.5', descripcion: 'Hiperlipidemia (dislipidemia), no especificada', grupo: 'Endocrino / metabólico' },
  { codigo: 'E66.9', descripcion: 'Obesidad, no especificada', grupo: 'Endocrino / metabólico' },
  { codigo: 'E86', descripcion: 'Depleción de volumen (deshidratación)', grupo: 'Endocrino / metabólico' },
  { codigo: 'E87.6', descripcion: 'Hipopotasemia', grupo: 'Endocrino / metabólico' },
  { codigo: 'E87.1', descripcion: 'Hiponatremia', grupo: 'Endocrino / metabólico' },

  // Neurológico / psiquiátrico
  { codigo: 'G30.9', descripcion: 'Enfermedad de Alzheimer, no especificada', grupo: 'Neurológico / mental' },
  { codigo: 'F03', descripcion: 'Demencia, no especificada', grupo: 'Neurológico / mental' },
  { codigo: 'F01.9', descripcion: 'Demencia vascular', grupo: 'Neurológico / mental' },
  { codigo: 'G20', descripcion: 'Enfermedad de Parkinson', grupo: 'Neurológico / mental' },
  { codigo: 'F05', descripcion: 'Delirium (síndrome confusional agudo)', grupo: 'Neurológico / mental' },
  { codigo: 'F32.9', descripcion: 'Episodio depresivo, no especificado', grupo: 'Neurológico / mental' },
  { codigo: 'F41.9', descripcion: 'Trastorno de ansiedad, no especificado', grupo: 'Neurológico / mental' },
  { codigo: 'G47.0', descripcion: 'Insomnio', grupo: 'Neurológico / mental' },
  { codigo: 'G40.9', descripcion: 'Epilepsia, no especificada', grupo: 'Neurológico / mental' },
  { codigo: 'G62.9', descripcion: 'Polineuropatía, no especificada', grupo: 'Neurológico / mental' },
  { codigo: 'R42', descripcion: 'Mareo y vértigo', grupo: 'Neurológico / mental' },

  // Musculoesquelético / caídas
  { codigo: 'M19.9', descripcion: 'Artrosis (osteoartritis), no especificada', grupo: 'Musculoesquelético' },
  { codigo: 'M81.0', descripcion: 'Osteoporosis sin fractura patológica', grupo: 'Musculoesquelético' },
  { codigo: 'M80.9', descripcion: 'Osteoporosis con fractura patológica', grupo: 'Musculoesquelético' },
  { codigo: 'M54.5', descripcion: 'Lumbalgia (dolor lumbar bajo)', grupo: 'Musculoesquelético' },
  { codigo: 'M62.84', descripcion: 'Sarcopenia', grupo: 'Musculoesquelético' },
  { codigo: 'S72.0', descripcion: 'Fractura del cuello de fémur (cadera)', grupo: 'Musculoesquelético' },
  { codigo: 'R29.6', descripcion: 'Tendencia a caídas (caídas recurrentes)', grupo: 'Musculoesquelético' },

  // Respiratorio
  { codigo: 'J44.9', descripcion: 'EPOC, no especificada', grupo: 'Respiratorio' },
  { codigo: 'J45.9', descripcion: 'Asma, no especificada', grupo: 'Respiratorio' },
  { codigo: 'J18.9', descripcion: 'Neumonía, microorganismo no especificado', grupo: 'Respiratorio' },
  { codigo: 'J96.9', descripcion: 'Insuficiencia respiratoria, no especificada', grupo: 'Respiratorio' },

  // Genitourinario / renal
  { codigo: 'N18.9', descripcion: 'Enfermedad renal crónica, no especificada', grupo: 'Genitourinario / renal' },
  { codigo: 'N39.0', descripcion: 'Infección de vías urinarias, sitio no especificado', grupo: 'Genitourinario / renal' },
  { codigo: 'N40', descripcion: 'Hiperplasia prostática benigna', grupo: 'Genitourinario / renal' },
  { codigo: 'R32', descripcion: 'Incontinencia urinaria, no especificada', grupo: 'Genitourinario / renal' },
  { codigo: 'R33', descripcion: 'Retención urinaria', grupo: 'Genitourinario / renal' },

  // Digestivo
  { codigo: 'K21.9', descripcion: 'Enfermedad por reflujo gastroesofágico', grupo: 'Digestivo' },
  { codigo: 'K59.0', descripcion: 'Estreñimiento', grupo: 'Digestivo' },
  { codigo: 'K25.9', descripcion: 'Úlcera gástrica', grupo: 'Digestivo' },
  { codigo: 'K92.2', descripcion: 'Hemorragia gastrointestinal, no especificada', grupo: 'Digestivo' },

  // Síndromes geriátricos / general
  { codigo: 'R54', descripcion: 'Senilidad / fragilidad del anciano', grupo: 'Síndromes geriátricos' },
  { codigo: 'R41.3', descripcion: 'Deterioro cognitivo leve (otro amnésico)', grupo: 'Síndromes geriátricos' },
  { codigo: 'R26.2', descripcion: 'Dificultad para caminar (trastorno de la marcha)', grupo: 'Síndromes geriátricos' },
  { codigo: 'R63.4', descripcion: 'Pérdida de peso anormal', grupo: 'Síndromes geriátricos' },
  { codigo: 'R63.3', descripcion: 'Dificultades para la alimentación', grupo: 'Síndromes geriátricos' },
  { codigo: 'L89.9', descripcion: 'Úlcera por presión (escara)', grupo: 'Síndromes geriátricos' },
  { codigo: 'Z74.3', descripcion: 'Necesidad de supervisión continua (dependencia)', grupo: 'Síndromes geriátricos' },
  { codigo: 'Z91.81', descripcion: 'Antecedente de caídas', grupo: 'Síndromes geriátricos' },
  { codigo: 'D64.9', descripcion: 'Anemia, no especificada', grupo: 'Hematológico' },
  { codigo: 'E53.8', descripcion: 'Deficiencia de vitaminas del grupo B', grupo: 'Hematológico' },

  // Sensorial
  { codigo: 'H25.9', descripcion: 'Catarata senil, no especificada', grupo: 'Sensorial' },
  { codigo: 'H40.9', descripcion: 'Glaucoma, no especificado', grupo: 'Sensorial' },
  { codigo: 'H91.9', descripcion: 'Hipoacusia (pérdida auditiva), no especificada', grupo: 'Sensorial' },
]

function normaliza(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Busca por código o por descripción (sin acentos). Devuelve hasta `limite` resultados.
export function buscarCIE10(q: string, limite = 12): CodigoCIE10[] {
  const n = normaliza(q).trim()
  if (!n) return []
  const partes = n.split(/\s+/)
  return CIE10.filter((c) => {
    const heno = normaliza(c.codigo + ' ' + c.descripcion)
    return partes.every((p) => heno.includes(p))
  }).slice(0, limite)
}
