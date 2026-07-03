// Plantillas de consentimiento informado para el Consultorio Geriátrico.
// El texto es editable antes de firmar; estas son solo bases frecuentes.

export interface PlantillaConsentimiento {
  tipo: string
  titulo: string
  texto: string
}

export const CONSENTIMIENTOS_PLANTILLAS: PlantillaConsentimiento[] = [
  {
    tipo: 'general',
    titulo: 'Consentimiento informado — Atención médica',
    texto:
      'Declaro que he sido informado(a) de forma clara y comprensible sobre mi diagnóstico ' +
      'y el plan de atención propuesto, así como de sus objetivos, beneficios, riesgos, ' +
      'posibles complicaciones y alternativas.\n\n' +
      'Entiendo que la medicina no es una ciencia exacta y que no se me han garantizado ' +
      'resultados. He tenido la oportunidad de hacer preguntas y todas han sido respondidas ' +
      'satisfactoriamente.\n\n' +
      'Autorizo al médico y a su equipo a brindarme la atención acordada, así como los ' +
      'procedimientos complementarios que resulten necesarios durante su ejecución. ' +
      'Me comprometo a seguir las indicaciones y a asistir a los controles programados.',
  },
  {
    tipo: 'procedimiento',
    titulo: 'Consentimiento informado — Procedimiento / curación',
    texto:
      'Se me ha explicado la necesidad de realizar un procedimiento (curación, infiltración, ' +
      'retiro de puntos u otro) como parte de mi atención. Comprendo los riesgos asociados, ' +
      'que pueden incluir dolor, inflamación, sangrado o infección.\n\n' +
      'He recibido las indicaciones posteriores y me comprometo a cumplirlas. Autorizo la ' +
      'realización del procedimiento y, de ser necesaria, la administración de anestesia local.',
  },
  {
    tipo: 'medicacion',
    titulo: 'Consentimiento informado — Plan de medicación',
    texto:
      'Se me ha informado sobre los medicamentos indicados, su dosis, horario y duración, ' +
      'así como sobre sus posibles efectos secundarios e interacciones con otros ' +
      'medicamentos que ya tomo.\n\n' +
      'Me comprometo a informar cualquier alergia o reacción adversa y a no modificar ni ' +
      'suspender el tratamiento sin consultar al médico. Autorizo el plan de medicación indicado.',
  },
  {
    tipo: 'datos',
    titulo: 'Consentimiento — Manejo de datos personales',
    texto:
      'Autorizo al consultorio a recopilar y tratar mis datos personales y clínicos con la ' +
      'finalidad de brindarme atención médica, dar seguimiento a mi tratamiento y gestionar ' +
      'citas, facturación y recordatorios.\n\n' +
      'Entiendo que mi información será tratada de forma confidencial y no será compartida con ' +
      'terceros salvo obligación legal o autorización expresa de mi parte o de mi familiar responsable.',
  },
]
