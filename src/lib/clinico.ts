// Constantes clínicas de uso general (independientes de odontología).
// Se separaron del antiguo `dental.ts` del molde al quitar los módulos dentales.

// Grupos sanguíneos (ABO / Rh) para la ficha clínica del paciente.
export const GRUPOS_SANGUINEOS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

// Estados de un plan / presupuesto de atención.
export const ESTADOS_PRESUPUESTO: { value: string; label: string; color: string }[] = [
  { value: 'BORRADOR', label: 'Borrador', color: 'bg-slate-100 text-slate-600' },
  { value: 'PRESENTADO', label: 'Presentado', color: 'bg-blue-100 text-blue-700' },
  { value: 'APROBADO', label: 'Aprobado', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'RECHAZADO', label: 'Rechazado', color: 'bg-rose-100 text-rose-700' },
  { value: 'FACTURADO', label: 'Facturado', color: 'bg-brand-100 text-brand-700' },
]
export function estadoPresupuestoDef(v: string) {
  return ESTADOS_PRESUPUESTO.find((e) => e.value === v) ?? ESTADOS_PRESUPUESTO[0]
}
