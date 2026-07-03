import { useEffect, useState } from 'react'
import { Save, ClipboardList, Check, Activity, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Cliente, ValoracionGeriatrica as Valoracion } from '../types'
import { hoyISO } from '../lib/format'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import SelectorPaciente from '../components/SelectorPaciente'

// Plantilla de examen físico normal (base editable, según el formato del Dr.).
const EXAMEN_NORMAL = `PIEL: Sin lesiones dérmicas, turgencia adecuada a la edad.
CABEZA: Normocefálico, pelo de adecuada implantación, sin masas ni hundimientos óseos palpables.
OJOS: Simétricos, escleras anictéricas, conjuntivas normocoloreadas, pupilas 3 mm reactivas a la luz.
NARIZ: Narinas permeables, sin pólipos visibles ni secreciones.
BOCA: Mucosa oral húmeda, lengua normoglosa, amígdalas eutróficas.
CUELLO: Cilíndrico, simétrico, móvil, sin ingurgitación venosa yugular, pulsos carotídeos presentes.
TÓRAX: Simétrico, normoexpansivo, sin retracciones intercostales ni subcostales.
CORAZÓN: Ruidos cardíacos regulares, de adecuado tono e intensidad.
PULMONES: Murmullo vesicular adecuado, sin estertores audibles.
ABDOMEN: Depresible, no doloroso a la palpación, peristalsis presente, sin visceromegalias palpables.
EXTREMIDADES SUPERIORES: Simétricas, pulsos periféricos presentes, sin cianosis ni edema.
EXTREMIDADES INFERIORES: Simétricas, pulsos periféricos presentes, sin cianosis ni edema.
NEUROLÓGICO: Alerta, orientado en las tres esferas, lenguaje adecuado, sin signos meníngeos, pares craneales conservados, fuerza y sensibilidad adecuadas, coordinación y marcha adecuadas.`

const vacio = {
  fecha_valoracion: hoyISO(),
  // escalas
  barthel: '', valoracion_social: '', cruz_roja_mental: '', cruz_roja_fisica: '',
  minimental: '', tinetti: '', up_and_go: '', velocidad_marcha: '', sit_to_stand: '',
  // secciones
  informante: '', motivo_consulta: '', enfermedad_actual: '', habitos_toxicos: '',
  antecedentes_personales: '', antecedentes_familiares: '', genitourinario: '',
  habito_intestinal_sueno: '', nutricion: '', valoracion_funcional: '', valoracion_mental: '',
  condicion_social: '', examen_fisico: '', ekg: '', comentario: '', nota: '', observaciones: '',
}

function numOrNull(s: string): number | null {
  const t = s.trim(); if (t === '') return null
  const n = Number(t); return isNaN(n) ? null : n
}

type Interp = { texto: string; tono: 'emerald' | 'yellow' | 'orange' | 'rose' | 'slate' } | null

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

  const set = (patch: Partial<typeof vacio>) => setForm((f) => ({ ...f, ...patch }))

  useEffect(() => {
    supabase.from('clientes').select('*').order('nombre').then(({ data }) => setClientes(data ?? []))
  }, [])
  useEffect(() => { if (pacienteFijo != null) setPacienteId(pacienteFijo) }, [pacienteFijo])

  async function cargar(pid: string) {
    setCargando(true)
    const { data } = await supabase.from('valoracion_geriatrica').select('*').eq('cliente_id', pid).maybeSingle()
    if (data) {
      const v = data as Valoracion
      const n = (x: number | null) => (x != null ? String(x) : '')
      const t = (x: string | null) => x ?? ''
      setForm({
        fecha_valoracion: v.fecha_valoracion ?? hoyISO(),
        barthel: n(v.barthel), valoracion_social: n(v.valoracion_social),
        cruz_roja_mental: n(v.cruz_roja_mental), cruz_roja_fisica: n(v.cruz_roja_fisica),
        minimental: n(v.minimental), tinetti: n(v.tinetti), up_and_go: n(v.up_and_go),
        velocidad_marcha: n(v.velocidad_marcha), sit_to_stand: n(v.sit_to_stand),
        informante: t(v.informante), motivo_consulta: t(v.motivo_consulta),
        enfermedad_actual: t(v.enfermedad_actual), habitos_toxicos: t(v.habitos_toxicos),
        antecedentes_personales: t(v.antecedentes_personales), antecedentes_familiares: t(v.antecedentes_familiares),
        genitourinario: t(v.genitourinario), habito_intestinal_sueno: t(v.habito_intestinal_sueno),
        nutricion: t(v.nutricion), valoracion_funcional: t(v.valoracion_funcional),
        valoracion_mental: t(v.valoracion_mental), condicion_social: t(v.condicion_social),
        examen_fisico: t(v.examen_fisico), ekg: t(v.ekg), comentario: t(v.comentario),
        nota: t(v.nota), observaciones: t(v.observaciones),
      })
    } else {
      setForm({ ...vacio, fecha_valoracion: hoyISO() })
    }
    setCargando(false)
  }
  useEffect(() => {
    if (!pacienteId) { setForm(vacio); return }
    setGuardado(false); cargar(pacienteId)
  }, [pacienteId])

  async function guardar() {
    if (!pacienteId) return
    setGuardando(true)
    const payload = {
      cliente_id: pacienteId,
      fecha_valoracion: form.fecha_valoracion || null,
      barthel: numOrNull(form.barthel), valoracion_social: numOrNull(form.valoracion_social),
      cruz_roja_mental: numOrNull(form.cruz_roja_mental), cruz_roja_fisica: numOrNull(form.cruz_roja_fisica),
      minimental: numOrNull(form.minimental), tinetti: numOrNull(form.tinetti),
      up_and_go: numOrNull(form.up_and_go), velocidad_marcha: numOrNull(form.velocidad_marcha),
      sit_to_stand: numOrNull(form.sit_to_stand),
      informante: form.informante || null, motivo_consulta: form.motivo_consulta || null,
      enfermedad_actual: form.enfermedad_actual || null, habitos_toxicos: form.habitos_toxicos || null,
      antecedentes_personales: form.antecedentes_personales || null,
      antecedentes_familiares: form.antecedentes_familiares || null,
      genitourinario: form.genitourinario || null, habito_intestinal_sueno: form.habito_intestinal_sueno || null,
      nutricion: form.nutricion || null, valoracion_funcional: form.valoracion_funcional || null,
      valoracion_mental: form.valoracion_mental || null, condicion_social: form.condicion_social || null,
      examen_fisico: form.examen_fisico || null, ekg: form.ekg || null,
      comentario: form.comentario || null, nota: form.nota || null, observaciones: form.observaciones || null,
    }
    const { error } = await supabase.from('valoracion_geriatrica').upsert(payload, { onConflict: 'cliente_id' })
    setGuardando(false)
    if (error) return alert('Error al guardar la valoración: ' + error.message)
    setGuardado(true); setTimeout(() => setGuardado(false), 2500)
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
          <PageHeader title="Valoración geriátrica" subtitle="Valoración geriátrica integral (VGI)" />
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
        <div className="space-y-5">
          {/* Barra superior */}
          <div className="card flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="text-brand-500" size={20} />
              <h2 className="font-display text-lg font-bold uppercase text-slate-800">Valoración geriátrica integral</h2>
            </div>
            <div className="flex items-center gap-3">
              {guardado && <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600"><Check size={16} /> Guardado</span>}
              <button className="btn-primary" onClick={guardar} disabled={guardando}>
                <Save size={16} /> {guardando ? 'Guardando…' : 'Guardar valoración'}
              </button>
            </div>
          </div>

          {/* Datos de la valoración */}
          <div className="card space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Fecha de valoración</label>
                <input type="date" className="input" value={form.fecha_valoracion} onChange={(e) => set({ fecha_valoracion: e.target.value })} />
              </div>
              <div>
                <label className="label">Informante</label>
                <input className="input" placeholder="Ej. paciente e hija" value={form.informante} onChange={(e) => set({ informante: e.target.value })} />
              </div>
            </div>
            <Texto label="Motivo de consulta" value={form.motivo_consulta} onChange={(v) => set({ motivo_consulta: v })} />
            <Texto label="Historia de la enfermedad actual" rows={4} value={form.enfermedad_actual} onChange={(v) => set({ enfermedad_actual: v })} />
          </div>

          {/* Escalas */}
          <div className="card space-y-4">
            <Seccion>Escalas geriátricas</Seccion>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Escala label="Barthel (AVD)" sufijo="/ 100" value={form.barthel} onChange={(v) => set({ barthel: v })} interp={iBarthel(form.barthel)} placeholder="0–100" />
              <Escala label="Minimental (MMSE)" sufijo="/ 30" value={form.minimental} onChange={(v) => set({ minimental: v })} interp={iMinimental(form.minimental)} placeholder="0–30" />
              <Escala label="Cruz Roja mental" sufijo="/ 5" value={form.cruz_roja_mental} onChange={(v) => set({ cruz_roja_mental: v })} interp={iCruzRoja(form.cruz_roja_mental)} placeholder="0–5" />
              <Escala label="Cruz Roja física" sufijo="/ 5" value={form.cruz_roja_fisica} onChange={(v) => set({ cruz_roja_fisica: v })} interp={iCruzRoja(form.cruz_roja_fisica)} placeholder="0–5" />
              <Escala label="Tinetti (marcha + equilibrio)" sufijo="/ 28" value={form.tinetti} onChange={(v) => set({ tinetti: v })} interp={iTinetti(form.tinetti)} placeholder="0–28" />
              <Escala label="Valoración social" sufijo="pts" value={form.valoracion_social} onChange={(v) => set({ valoracion_social: v })} interp={null} placeholder="Puntaje" />
              <Escala label="Velocidad de la marcha" sufijo="m/s" value={form.velocidad_marcha} onChange={(v) => set({ velocidad_marcha: v })} interp={iVelocidad(form.velocidad_marcha)} placeholder="Ej. 0.8" />
              <Escala label="Sit to stand (5 rep.)" sufijo="seg" value={form.sit_to_stand} onChange={(v) => set({ sit_to_stand: v })} interp={iSitToStand(form.sit_to_stand)} placeholder="Segundos" />
            </div>
            <div>
              <label className="label">Test “Up &amp; Go”</label>
              <select className="input" value={form.up_and_go} onChange={(e) => set({ up_and_go: e.target.value })}>
                <option value="">—</option>
                {UP_AND_GO.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
              {upgInterp && <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONOS[upgInterp.tono]}`}>{upgInterp.texto}</span>}
            </div>
          </div>

          {/* Hábitos y antecedentes */}
          <div className="card space-y-4">
            <Seccion>Hábitos y antecedentes</Seccion>
            <Texto label="Hábitos tóxicos" rows={2} placeholder="Café, alcohol, tizanas, drogas, tabaco…" value={form.habitos_toxicos} onChange={(v) => set({ habitos_toxicos: v })} />
            <Texto label="Antecedentes personales (mórbidos, quirúrgicos, traumáticos, transfusionales)" rows={3} value={form.antecedentes_personales} onChange={(v) => set({ antecedentes_personales: v })} />
            <Texto label="Antecedentes heredo-familiares" rows={2} placeholder="Madre, padre, hermanos…" value={form.antecedentes_familiares} onChange={(v) => set({ antecedentes_familiares: v })} />
          </div>

          {/* Sistemas y hábitos */}
          <div className="card space-y-4">
            <Seccion>Continencia, nutrición y sueño</Seccion>
            <Texto label="Genitourinario / continencia" rows={2} placeholder="Incontinencia urinaria/fecal, relaciones, enfermedades venéreas…" value={form.genitourinario} onChange={(v) => set({ genitourinario: v })} />
            <Texto label="Hábito intestinal y sueño" rows={2} value={form.habito_intestinal_sueno} onChange={(v) => set({ habito_intestinal_sueno: v })} />
            <Texto label="Aspectos nutricionales" rows={2} placeholder="Estado nutricional, cambios de peso, IMC, dieta…" value={form.nutricion} onChange={(v) => set({ nutricion: v })} />
          </div>

          {/* Valoraciones */}
          <div className="card space-y-4">
            <Seccion>Valoración funcional, mental y social</Seccion>
            <Texto label="Valoración funcional" rows={2} placeholder="Visión, audición, lenguaje, marcha, caídas…" value={form.valoracion_funcional} onChange={(v) => set({ valoracion_funcional: v })} />
            <Texto label="Valoración mental" rows={2} placeholder="Depresión, ansiedad, demencia…" value={form.valoracion_mental} onChange={(v) => set({ valoracion_mental: v })} />
            <Texto label="Condición social" rows={2} placeholder="Vivienda, servicios, situación económica…" value={form.condicion_social} onChange={(v) => set({ condicion_social: v })} />
          </div>

          {/* Examen físico */}
          <div className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Seccion>Examen físico</Seccion>
              <button
                type="button"
                onClick={() => set({ examen_fisico: form.examen_fisico.trim() ? form.examen_fisico : EXAMEN_NORMAL })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
              >
                <FileText size={14} /> Usar plantilla de examen normal
              </button>
            </div>
            <textarea className="input font-mono text-xs leading-relaxed" rows={12} placeholder="Exploración por sistemas…" value={form.examen_fisico} onChange={(e) => set({ examen_fisico: e.target.value })} />
            <Texto label="EKG" rows={2} value={form.ekg} onChange={(v) => set({ ekg: v })} />
          </div>

          {/* Cierre */}
          <div className="card space-y-4">
            <Seccion>Comentario y nota</Seccion>
            <Texto label="Comentario" rows={2} value={form.comentario} onChange={(v) => set({ comentario: v })} />
            <Texto label="Nota" rows={2} value={form.nota} onChange={(v) => set({ nota: v })} />
            <Texto label="Observaciones" rows={2} value={form.observaciones} onChange={(v) => set({ observaciones: v })} />
          </div>

          {/* Guardar (pie) */}
          <div className="flex justify-end">
            <button className="btn-primary" onClick={guardar} disabled={guardando}>
              <Save size={16} /> {guardando ? 'Guardando…' : 'Guardar valoración'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Seccion({ children }: { children: React.ReactNode }) {
  return <h3 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wide text-brand-700">{children}</h3>
}

function Texto({ label, value, onChange, rows = 2, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input" rows={rows} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
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
