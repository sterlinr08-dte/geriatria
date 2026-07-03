// Constantes compartidas del sistema

// Login por nombre de usuario: internamente se usa un correo "<usuario>@geriatra.local".
// El portal central (nexusprord.com) compone este mismo correo al enrutar "<usuario>@geriatra".
export const DOMINIO_USUARIO = '@geriatra.local'
export function usuarioAEmail(usuario: string): string {
  const u = usuario.trim().toLowerCase()
  // Tolerante: si la persona ya escribió un correo completo (con "@"),
  // se respeta tal cual; si solo escribió el usuario, se le agrega el dominio.
  if (u.includes('@')) return u
  return u + DOMINIO_USUARIO
}


// Datos del negocio (aparecen en facturas, login y panel). El valor real se lee
// de `ajustes_negocio` en la base; esto son solo valores por defecto.
export const NEGOCIO = {
  nombre: 'Consultorio Dr. Marcos Cepeda',
  direccion: 'Autopista Duarte Km 2.8, 5ta Planta, Suite 514, HOMS, Santiago, R.D.',
  referencia: 'Hospital Metropolitano de Santiago (HOMS)',
  telefono: '829-947-2222 Ext. 60514',
  whatsapp: '829-392-7712',
  instagram: '',
  rnc: '', // Coloca aquí el RNC si aplica (aparece en los tickets)
  logo: 'logo.png',
  ancho_ticket: 58, // mm del papel térmico (58 u 80)
  auto_imprimir: true, // imprimir el recibo automáticamente al cobrar
}


// Prefijos por defecto de las secuencias (editables en Configuración → Prefijos)
export const PREFIJOS_DEFAULT = {
  prefijo_caja: 'CJ',
  prefijo_gasto: 'GA',
  prefijo_pago: 'NM',
  prefijo_cita: 'CI',
  prefijo_compra: 'CM',
  prefijo_cliente: 'PA',
  prefijo_proveedor: 'PR',
  prefijo_articulo: 'AR',
  prefijo_mobiliario: 'MB',
}

// Categorías y estados del mobiliario / equipos del consultorio
export const CATEGORIAS_MOBILIARIO = [
  'Mobiliario',
  'Equipos médicos',
  'Electrónica',
  'Decoración',
  'Instrumental',
  'Otros',
]

export const ESTADOS_MOBILIARIO: { value: 'BUENO' | 'REGULAR' | 'DANADO'; label: string }[] = [
  { value: 'BUENO', label: 'Bueno' },
  { value: 'REGULAR', label: 'Regular' },
  { value: 'DANADO', label: 'Dañado' },
]

export const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia', 'PayPal', 'Otro']

export const ITBIS_RATE = 0.18 // 18% (RD)

export const CATEGORIAS_GASTO = [
  'General',
  'Alquiler',
  'Servicios (luz, agua)',
  'Publicidad',
  'Mantenimiento',
  'Impuestos',
  'Otros',
]

export const CATEGORIAS_COMPRA = [
  'Insumos médicos',
  'Medicamentos',
  'Material de curación',
  'Instrumental',
  'Descartables',
  'Equipos',
  'Limpieza',
  'Otros',
]
