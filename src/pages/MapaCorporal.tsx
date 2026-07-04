import { Suspense, lazy, useEffect, useState } from 'react'
import { PersonStanding } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Cliente } from '../types'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import SelectorPaciente from '../components/SelectorPaciente'

// El motor 3D (three.js) se carga SOLO al abrir esta pestaña, para no pesar el resto de la app.
const MapaCorporal3D = lazy(() => import('./MapaCorporal3D'))

export default function MapaCorporal({ pacienteFijo }: { pacienteFijo?: string } = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pacienteId, setPacienteId] = useState<string>(pacienteFijo ?? '')

  useEffect(() => {
    if (pacienteFijo != null) return
    supabase.from('clientes').select('*').order('nombre').then(({ data }) => setClientes(data ?? []))
  }, [pacienteFijo])
  useEffect(() => { if (pacienteFijo != null) setPacienteId(pacienteFijo) }, [pacienteFijo])

  return (
    <div>
      {!pacienteFijo && (
        <>
          <PageHeader title="Mapa corporal" subtitle="Vista 3D de las condiciones del paciente por zona" />
          <div className="card mb-6 max-w-md">
            <label className="label">Paciente</label>
            <SelectorPaciente clientes={clientes} value={pacienteId} onChange={setPacienteId} />
          </div>
        </>
      )}

      {!pacienteId ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <PersonStanding className="text-brand-300" size={40} />
          <p className="text-slate-500">Selecciona un paciente para ver su mapa corporal.</p>
        </div>
      ) : (
        <Suspense fallback={<div className="flex items-center justify-center py-16"><Cargando /></div>}>
          <MapaCorporal3D />
        </Suspense>
      )}
    </div>
  )
}
