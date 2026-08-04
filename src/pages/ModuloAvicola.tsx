import { ArrowRight, Construction } from 'lucide-react'
import EmptyState from '../design-system/EmptyState'
import PageHeader from '../design-system/PageHeader'

interface Props {
  titulo: string
  descripcion: string
  etapa?: string
}

export default function ModuloAvicola({ titulo, descripcion, etapa = 'Fase 2' }: Props) {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={etapa}
        title={titulo}
        description={descripcion}
        actions={<span className="badge bg-amber-50 text-amber-700 ring-amber-200">En construcción</span>}
      />

      <EmptyState
        icon={Construction}
        title="Módulo preparado para desarrollo"
        description="La ruta, los permisos y la navegación ya dependen de una arquitectura centralizada. Los formularios, tablas, indicadores y conexión con Supabase se incorporarán en el sprint funcional correspondiente."
        footer={(
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            Arquitectura modular activa <ArrowRight size={16} aria-hidden="true" />
          </div>
        )}
      />
    </section>
  )
}
