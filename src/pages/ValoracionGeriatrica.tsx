import { useEffect, useState } from 'react'
import { Save, ClipboardList, Check, Activity } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Cliente, ValoracionGeriatrica as Valoracion } from '../types'
import { hoyISO } from '../lib/format'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import SelectorPaciente from '../components/SelectorPaciente'

const vacio = {
  fecha_valoracion: hoyISO(),
  barthel: '', valoracion_social: '', cruz_roja_mental: '', cruz_roja_fisica: '',
  minimental: '', tinetti: '', up_and_go: '', velocidad_marcha: '', sit_to_stand: '',
  observaciones: '',
}

function numOrNull(s: string): number | null {
  const t = s.trim()
  if (t === '') return null
  const n = Number(t)
  return isNaN(n) ? null : n
}

type Interp = { texto: string; tono: 'emerald' | 'yellow' | 'orange' | 'rose' | 'slate' } | null

// ── Interpretaciones de cada escala ──
function iBarthel(v: string): Interp {
  const n = numOrNull(v); if (n == null) return null
  if (n >= 100) return { texto: 'Independiente', tono: 'emerald' }
  if (n >= 60) return { texto: 'Dependencia leve', tono: 'yellow' }
  if (n >= 40) return { texto: 'Dependencia moderada', tono: 'orange' }
  if (n >= 20) return { texto: 'Dependencia severa', tono: 'rose' }
  return { texto: 'Dependencia total', tono: 'rose' }
}
function iCruzRoja(v: string): Interp {
  const n = numOrNull(v); if (n == null) return null
  if (n <= 0) return { texto: 'Normal', tono: 'emerald' }
  if (n <= 2) return { texto: 'Incapacidad leve', tono: 'yellow' }
  if (n === 3) return { texto: 'Incapacidad moderada', tono: 'orange' }
  return { texto: 'Incapacidad severa', tono: 'rose' }
}
function iMinimental(v: string): Interp {
  const n = numOrNull(v); if (n == null) return null
  if (n >= 27) return { texto: 'Normal', tono: 'emerald' }
  if (n >= 24) return { texto: 'Deterioro leve / dudoso', tono: 'yellow' }
  if (n >= 18) return { texto: 'Deterioro moderado', tono: 'orange' }
  return { texto: 'Deterioro severo', tono: 'rose' }
}
function iTinetti(v: string): Interp {
  const n = numOrNull(v); if (n == null) return null
  if (n >= 25) return { texto: 'Bajo riesgo de caídas', tono: 'emerald' }
  if (n >= 19) return { texto: 'Riesgo moderado', tono: 'yellow' }
  return { texto: 'Alto riesgo de caídas', tono: 'rose' }
}
function iVelocidad(v: string): Interp {
  const n = numOrNull(v); if (n == null) return null
  if (n < 0.8) return { texto: 'Alta probabilidad de fragilidad', tono: 'rose' }
  return { texto: 'Normal', tono: 'emerald' }
}
function iSitToStand(v: string): Interp {
  const n = numOrNull(v); if (n == null) return null
  if (n < 10) return { texto: 'Buena capacidad física', tono: 'emerald' }
  if (n <= 20) return { texto: 'Puede mejorar', tono: 'yellow' }
  return { texto: 'Movilidad limitada', tono: 'rose' }
}

const TONOS: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  orange: 'bg-orange-100 text-orange-700',
  rose: 'bg-rose-100 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
}

const UP_AND_GO = [
  { v: '1', label: 'Independiente' },
  { v: '2', label: 'Independiente con ayudas (bastón, andador)' },
  { v: '3', label: 'Requiere supervisión / asistencia' },
  { v: '4', label: 'No camina' },
]

export default function ValoracionGeriatrica({ pacienteFijo }: { pacienteFijo?: string } = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pacienteId, setPacienteId] = useState<string>(pacienteFijo ?? '')
  const [cargando, setCargando] = useState(false)
  const [form, setForm] = useState(vacio)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    supabase.from('clientes').select('*').order('nombre').then(({ data }) => setClientes(data ?? []))
  }, [])
  useEffect(() => { if (pacienteFijo != null) setPacienteId(pacienteFijo) }, [pacienteFijo])

  async function cargar(pid: string) {
    setCargando(true)
    const { data } = await supabase.from('valoracion_geriatrica').select('*').eq('cliente_id', pid).maybeSingle()
    if (data) {
      const v = data as Valoracion
      const s = (x: number | null) => (x != null ? String(x) : '')
      setForm({
        fecha_valoracion: v.fecha_valoracion ?? hoyISO(),
        barthel: s(v.barthel), valoracion_social: s(v.valoracion_social),
        cruz_roja_mental: s(v.cruz_roja_mental), cruz_roja_fisica: s(v.cruz_roja_fisica),
        minimental: s(v.minimental), tinetti: s(v.tinetti), up_and_go: s(v.up_and_go),
        velocidad_marcha: s(v.velocidad_marcha), sit_to_stand: s(v.sit_to_stand),
        observaciones: v.observaciones ?? '',
      })
    } else {
      setForm({ ...vacio, fecha_valoracion: hoyISO() })
    }
    setCargando(false)
  }
  useEffect(() => {
    if (!pacienteId) { setForm(vacio); return }
    setGuardado(false)
    cargar(pacienteId)
  }, [pacienteId])

  async function guardar() {
    if (!pacienteId) return
    setGuardando(true)
    const payload = {
      cliente_id: pacienteId,
      fecha_valoracion: form.fecha_valoracion || null,
      barthel: numOrNull(form.barthel),
      valoracion_social: numOrNull(form.valoracion_social),
      cruz_roja_mental: numOrNull(form.cruz_roja_mental),
      cruz_roja_fisica: numOrNull(form.cruz_roja_fisica),
      minimental: numOrNull(form.minimental),
      tinetti: numOrNull(form.tinetti),
      up_and_go: numOrNull(form.up_and_go),
      velocidad_marcha: numOrNull(form.velocidad_marcha),
      sit_to_stand: numOrNull(form.sit_to_stand),
      observaciones: form.observaciones || null,
    }
    const { error } = await supabase.from('valoracion_geriatrica').upsert(payload, { onConflict: 'cliente_id' })
    setGuardando(false)
    if (error) return alert('Error al guardar la valoración: ' + error.message)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2500)
  }

  const upgInterp: Interp = form.up_and_go
    ? (() => {
        const n = Number(form.up_and_go)
        if (n === 1) return { texto: 'Independiente', tono: 'emerald' as const }
        if (n === 2) return { texto: 'Con ayudas', tono: 'yellow' as const }
        if (n === 3) return { texto: 'Requiere asistencia', tono: 'orange' as const }
        return { texto: 'No camina', tono: 'rose' as const }
      })()
    : null

  return (
    <div>
      {!pacienteFijo && (
        <>
          <PageHeader title="Valoración geriátrica" subtitle="Escalas de la valoración geriátrica integral" />
          <div className="card mb-6 max-w-md">
            <label className="label">Paciente</label>
            <SelectorPaciente clientes={clientes} value={pacienteId} onChange={setPacienteId} />
          </div>
        </>
      )}

      {!pacienteId ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <ClipboardList className="text-brand-300" size={40} />
          <p className="text-slate-500">Selecciona un paciente para ver o registrar su valoración.</p>
        </div>
      ) : cargando ? (
        <Cargando />
      ) : (
        <div className="card space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="text-brand-500" size={20} />
              <h2 className="font-display text-lg font-bold uppercase text-slate-800">Valoración geriátrica integral</h2>
            </div>
            <div className="flex items-center gap-3">
              {guardado && (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600"><Check size={16} /> Guardado</span>
              )}
              <button className="btn-primary" onClick={guardar} disabled={guardando}>
                <Save size={16} /> {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>

          <div className="max-w-xs">
            <label className="label">Fecha de valoración</label>
            <input type="date" className="input" value={form.fecha_valoracion} onChange={(e) => setForm({ ...form, fecha_valoracion: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Escala label="Barthel (AVD)" sufijo="/ 100" value={form.barthel} onChange={(v) => setForm({ ...form, barthel: v })} interp={iBarthel(form.barthel)} placeholder="0–100" />
            <Escala label="Minimental (MMSE)" sufijo="/ 30" value={form.minimental} onChange={(v) => setForm({ ...form, minimental: v })} interp={iMinimental(form.minimental)} placeholder="0–30" />
            <Escala label="Cruz Roja mental" sufijo="/ 5" value={form.cruz_roja_mental} onChange={(v) => setForm({ ...form, cruz_roja_mental: v })} interp={iCruzRoja(form.cruz_roja_mental)} placeholder="0–5" />
            <Escala label="Cruz Roja física" sufijo="/ 5" value={form.cruz_roja_fisica} onChange={(v) => setForm({ ...form, cruz_roja_fisica: v })} interp={iCruzRoja(form.cruz_roja_fisica)} placeholder="0–5" />
            <Escala label="Tinetti (marcha + equilibrio)" sufijo="/ 28" value={form.tinetti} onChange={(v) => setForm({ ...form, tinetti: v })} interp={iTinetti(form.tinetti)} placeholder="0–28" />
            <Escala label="Valoración social" sufijo="pts" value={form.valoracion_social} onChange={(v) => setForm({ ...form, valoracion_social: v })} interp={null} placeholder="Puntaje" />
            <Escala label="Velocidad de la marcha" sufijo="m/s" value={form.velocidad_marcha} onChange={(v) => setForm({ ...form, velocidad_marcha: v })} interp={iVelocidad(form.velocidad_marcha)} placeholder="Ej. 0.8" />
            <Escala label="Sit to stand (5 rep.)" sufijo="seg" value={form.sit_to_stand} onChange={(v) => setForm({ ...form, sit_to_stand: v })} interp={iSitToStand(form.sit_to_stand)} placeholder="Segundos" />
          </div>

          <div>
            <label className="label">Test “Up &amp; Go”</label>
            <select className="input" value={form.up_and_go} onChange={(e) => setForm({ ...form, up_and_go: e.target.value })}>
              <option value="">—</option>
              {UP_AND_GO.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
            {upgInterp && <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONOS[upgInterp.tono]}`}>{upgInterp.texto}</span>}
          </div>

          <div>
            <label className="label">Observaciones</label>
            <textarea className="input" rows={3} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} placeholder="Comentarios de la valoración" />
          </div>
        </div>
      )}
    </div>
  )
}

function Escala({ label, sufijo, value, onChange, interp, placeholder }: {
  label: string; sufijo?: string; value: string; onChange: (v: string) => void; interp: Interp; placeholder?: string
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input inputMode="decimal" className="input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        {sufijo && <span className="shrink-0 text-xs font-medium text-slate-400">{sufijo}</span>}
      </div>
      {interp && <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONOS[interp.tono]}`}>{interp.texto}</span>}
    </div>
  )
}
