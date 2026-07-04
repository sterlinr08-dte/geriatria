// Revisión de medicación potencialmente inapropiada en el adulto mayor.
// Lista curada y PRÁCTICA basada en los criterios de Beers (AGS) y STOPP.
// Es una AYUDA ORIENTATIVA, no sustituye el juicio clínico del médico.

export type Gravedad = 'alto' | 'moderado'

export interface AlertaMedicamento {
  grupo: string
  riesgo: string
  recomendacion: string
  gravedad: Gravedad
}

interface ReglaMedicamento extends AlertaMedicamento {
  terminos: string[] // subcadenas (sin acentos, minúsculas) del principio activo
}

// Número de medicamentos activos a partir del cual se considera polifarmacia.
export const UMBRAL_POLIFARMACIA = 5

export const DESCARGO = 'Ayuda orientativa basada en criterios Beers/STOPP. No sustituye el juicio clínico.'

const REGLAS: ReglaMedicamento[] = [
  {
    terminos: ['diazepam', 'lorazepam', 'alprazolam', 'clonazepam', 'bromazepam', 'midazolam', 'clordiazepox'],
    grupo: 'Benzodiazepinas',
    riesgo: 'Mayor riesgo de caídas, fracturas, sedación y deterioro cognitivo.',
    recomendacion: 'Evitar; si se usa, dosis mínima y retiro gradual. Preferir alternativas no farmacológicas.',
    gravedad: 'alto',
  },
  {
    terminos: ['zolpidem', 'zopiclona', 'eszopiclona', 'zaleplon'],
    grupo: 'Hipnóticos “Z”',
    riesgo: 'Caídas, fracturas y confusión, similar a las benzodiazepinas.',
    recomendacion: 'Evitar el uso crónico para el insomnio.',
    gravedad: 'alto',
  },
  {
    terminos: ['difenhidramina', 'clorfeniramina', 'clorfenamina', 'hidroxizina', 'dimenhidrinato', 'ciproheptadina'],
    grupo: 'Antihistamínicos de 1.ª generación',
    riesgo: 'Efecto anticolinérgico: confusión, sequedad, retención urinaria, caídas.',
    recomendacion: 'Evitar; preferir antihistamínicos de 2.ª generación.',
    gravedad: 'alto',
  },
  {
    terminos: ['amitriptilina', 'imipramina', 'clomipramina', 'nortriptilina', 'doxepina'],
    grupo: 'Antidepresivos tricíclicos',
    riesgo: 'Fuerte efecto anticolinérgico e hipotensión ortostática.',
    recomendacion: 'Evitar; preferir ISRS u otros de menor carga anticolinérgica.',
    gravedad: 'alto',
  },
  {
    terminos: ['ibuprofeno', 'naproxeno', 'diclofenac', 'ketorolaco', 'indometacina', 'piroxicam', 'meloxicam', 'ketoprofeno'],
    grupo: 'AINEs (uso crónico)',
    riesgo: 'Sangrado digestivo, daño renal, retención de líquidos y descontrol de la presión.',
    recomendacion: 'Evitar uso crónico; si es imprescindible, gastroprotección y vigilar función renal.',
    gravedad: 'alto',
  },
  {
    terminos: ['glibenclamida', 'gliburida', 'glimepirida', 'clorpropamida'],
    grupo: 'Sulfonilureas de acción prolongada',
    riesgo: 'Hipoglucemias prolongadas y graves.',
    recomendacion: 'Preferir alternativas de menor riesgo (p. ej. gliclazida o metformina si procede).',
    gravedad: 'alto',
  },
  {
    terminos: ['ciclobenzaprina', 'carisoprodol', 'metocarbamol', 'clorzoxazona'],
    grupo: 'Relajantes musculares',
    riesgo: 'Sedación, efecto anticolinérgico y caídas; mal tolerados en el anciano.',
    recomendacion: 'Evitar.',
    gravedad: 'moderado',
  },
  {
    terminos: ['oxibutinina', 'tolterodina', 'solifenacina', 'flavoxato'],
    grupo: 'Anticolinérgicos urinarios',
    riesgo: 'Confusión, estreñimiento, retención urinaria, boca seca.',
    recomendacion: 'Usar con precaución; valorar medidas conductuales.',
    gravedad: 'moderado',
  },
  {
    terminos: ['haloperidol', 'risperidona', 'quetiapina', 'olanzapina', 'clozapina'],
    grupo: 'Antipsicóticos',
    riesgo: 'En demencia aumentan el riesgo de ictus y mortalidad; caídas y sedación.',
    recomendacion: 'Evitar para síntomas conductuales de demencia salvo peligro; a la dosis mínima y el menor tiempo.',
    gravedad: 'alto',
  },
  {
    terminos: ['omeprazol', 'esomeprazol', 'lansoprazol', 'pantoprazol', 'rabeprazol'],
    grupo: 'Inhibidores de bomba de protones (uso prolongado)',
    riesgo: 'Uso > 8 semanas: fracturas, infección por C. difficile, déficit de B12 y magnesio.',
    recomendacion: 'Revisar la indicación y desprescribir si ya no es necesario.',
    gravedad: 'moderado',
  },
  {
    terminos: ['metoclopramida'],
    grupo: 'Metoclopramida',
    riesgo: 'Efectos extrapiramidales y discinesia tardía.',
    recomendacion: 'Evitar uso prolongado (> 12 semanas).',
    gravedad: 'moderado',
  },
  {
    terminos: ['digoxina'],
    grupo: 'Digoxina',
    riesgo: 'Dosis > 0.125 mg/día aumentan la toxicidad sin mayor beneficio.',
    recomendacion: 'No superar 0.125 mg/día y vigilar función renal y niveles.',
    gravedad: 'moderado',
  },
  {
    terminos: ['doxazosina', 'prazosina', 'terazosina'],
    grupo: 'Alfabloqueantes (como antihipertensivo)',
    riesgo: 'Hipotensión ortostática y caídas.',
    recomendacion: 'Evitar como antihipertensivo de rutina.',
    gravedad: 'moderado',
  },
  {
    terminos: ['meperidina', 'petidina'],
    grupo: 'Meperidina',
    riesgo: 'Neurotoxicidad y confusión; analgesia poco eficaz por vía oral.',
    recomendacion: 'Evitar; preferir otros analgésicos.',
    gravedad: 'alto',
  },
  {
    terminos: ['amiodarona'],
    grupo: 'Amiodarona',
    riesgo: 'Toxicidad tiroidea, pulmonar y hepática.',
    recomendacion: 'No usar como primera línea en fibrilación auricular salvo indicación específica.',
    gravedad: 'moderado',
  },
  {
    terminos: ['metildopa'],
    grupo: 'Metildopa',
    riesgo: 'Bradicardia, hipotensión y depresión / sedación en el SNC.',
    recomendacion: 'Evitar como antihipertensivo de rutina.',
    gravedad: 'moderado',
  },
  {
    terminos: ['nifedipino de accion rapida', 'nifedipina de accion rapida', 'nifedipino sublingual'],
    grupo: 'Nifedipino de acción rápida',
    riesgo: 'Hipotensión brusca e isquemia.',
    recomendacion: 'Evitar; usar formulaciones de liberación prolongada.',
    gravedad: 'alto',
  },
]

function normaliza(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Devuelve las alertas que aplican a un medicamento por su nombre/principio activo.
export function revisarMedicamento(nombre: string): AlertaMedicamento[] {
  const n = normaliza(nombre)
  if (!n.trim()) return []
  const out: AlertaMedicamento[] = []
  for (const r of REGLAS) {
    if (r.terminos.some((t) => n.includes(normaliza(t)))) {
      out.push({ grupo: r.grupo, riesgo: r.riesgo, recomendacion: r.recomendacion, gravedad: r.gravedad })
    }
  }
  return out
}
