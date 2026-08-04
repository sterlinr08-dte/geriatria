import { Construction, ArrowRight } from 'lucide-react'

interface Props {
  titulo: string
  descripcion: string
  etapa?: string
}

export default function ModuloAvicola({ titulo, descripcion, etapa = 'Fase 1' }: Props) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">{etapa}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">{titulo}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">{descripcion}</p>
        </div>
        <span className="badge bg-amber-50 text-amber-700 ring-amber-200">En construcción</span>
      </div>

      <div className="card flex min-h-[360px] flex-col items-center justify-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Construction size={28} />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-slate-900">Módulo preparado para desarrollo</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          La ruta, navegación y estructura visual ya forman parte del nuevo núcleo de AVÍCOLA ERP.
          Los formularios, tablas, indicadores y conexión con Supabase se incorporarán en el sprint correspondiente.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
          Arquitectura modular activa <ArrowRight size={16} />
        </div>
      </div>
    </section>
  )
}
