import { useEffect, useState } from 'react'
import { Save, ClipboardList, Check, Activity, FileText, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Cliente, ValoracionGeriatrica as Valoracion, HistoriaEvolucion } from '../types'
import { hoyISO, fechaCorta } from '../lib/format'
import { useNegocio } from '../lib/negocio'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import SelectorPaciente from '../components/SelectorPaciente'

const ESPECIALIDAD = 'Geriatría · Enfermedades Neurodegenerativas'

// Edad en años a partir de la fecha de nacimiento.
function edadDe(fecha: string | null | undefined): number | null {
  if (!fecha) return null
  const n = new Date(fecha)
  if (isNaN(n.getTime())) return null
  const hoy = new Date()
  let e = hoy.getFullYear() - n.getFullYear()
  const m = hoy.getMonth() - n.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) e--
  return e >= 0 && e < 130 ? e : null
}

// Escapa texto para el HTML de impresión.
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Examen físico por aparatos/sistemas. Cada sistema tiene su etiqueta fija y un
// hallazgo "normal" por defecto (según el formato del Dr.); el médico solo escribe
// lo positivo que encuentra en cada uno. Se guarda en la columna `examen_fisico`
// como líneas "SISTEMA: hallazgo" (mismo formato de siempre → imprime igual).
interface SistemaEF { label: string; normal: string }
const SISTEMAS_EF: SistemaEF[] = [
  { label: 'PIEL', normal: 'Sin lesiones dérmicas, turgencia adecuada a la edad.' },
  { label: 'CABEZA', normal: 'Normocefálico, pelo de adecuada implantación, sin masas ni hundimientos óseos palpables.' },
  { label: 'OJOS', normal: 'Simétricos, escleras anictéricas, conjuntivas normocoloreadas, pupilas 3 mm reactivas a la luz.' },
  { label: 'NARIZ', normal: 'Narinas permeables, sin pólipos visibles ni secreciones.' },
  { label: 'BOCA', normal: 'Mucosa oral húmeda, lengua normoglosa, amígdalas eutróficas.' },
  { label: 'CUELLO', normal: 'Cilíndrico, simétrico, móvil, sin ingurgitación venosa yugular, pulsos carotídeos presentes.' },
  { label: 'TÓRAX', normal: 'Simétrico, normoexpansivo, sin retracciones intercostales ni subcostales.' },
  { label: 'CORAZÓN', normal: 'Ruidos cardíacos regulares, de adecuado tono e intensidad.' },
  { label: 'PULMONES', normal: 'Murmullo vesicular adecuado, sin estertores audibles.' },
  { label: 'ABDOMEN', normal: 'Depresible, no doloroso a la palpación, peristalsis presente, sin visceromegalias palpables.' },
  { label: 'EXTREMIDADES SUPERIORES', normal: 'Simétricas, pulsos periféricos presentes, sin cianosis ni edema.' },
  { label: 'EXTREMIDADES INFERIORES', normal: 'Simétricas, pulsos periféricos presentes, sin cianosis ni edema.' },
  { label: 'NEUROLÓGICO', normal: 'Alerta, orientado en las tres esferas, lenguaje adecuado, sin signos meníngeos, pares craneales conservados, fuerza y sensibilidad adecuadas, coordinación y marcha adecuadas.' },
]

const normLabel = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Texto (columna examen_fisico) → { hallazgos por sistema, otros no reconocidos }.
function parseEF(texto: string): { ef: Record<string, string>; otros: string } {
  const ef: Record<string, string> = {}
  const otros: string[] = []
  for (const linea of (texto || '').split('\n')) {
    const m = linea.match(/^([^:]+):\s*(.*)$/)
    const sys = m && SISTEMAS_EF.find((s) => normLabel(s.label) === normLabel(m[1]))
    if (sys) ef[sys.label] = m[2].trim()
    else if (linea.trim()) otros.push(linea)
  }
  return { ef, otros: otros.join('\n') }
}

// { hallazgos por sistema, otros } → texto de la columna examen_fisico.
function composeEF(ef: Record<string, string>, otros: string): string {
  const lineas = SISTEMAS_EF.filter((s) => (ef[s.label] || '').trim()).map((s) => `${s.label}: ${ef[s.label].trim()}`)
  if (otros.trim()) lineas.push(otros.trim())
  return lineas.join('\n')
}

// Editor del examen físico por sistemas. Controlado sobre el string examen_fisico.
function ExamenFisicoEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { ef, otros } = parseEF(value)
  const setSistema = (label: string, texto: string) => onChange(composeEF({ ...ef, [label]: texto }, otros))
  const llenarNormales = () => {
    const nuevo = { ...ef }
    for (const s of SISTEMAS_EF) if (!(nuevo[s.label] || '').trim()) nuevo[s.label] = s.normal
    onChange(composeEF(nuevo, otros))
  }
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={llenarNormales}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
        >
          <FileText size={14} /> Llenar normales
        </button>
      </div>
      {SISTEMAS_EF.map((s) => (
        <div key={s.label} className="flex items-start gap-2">
          <span className="w-24 shrink-0 pt-2 text-[11px] font-semibold leading-tight text-slate-500 sm:w-40">{s.label}</span>
          <input
            className="input flex-1 text-sm"
            placeholder="hallazgo…"
            value={ef[s.label] ?? ''}
            onChange={(e) => setSistema(s.label, e.target.value)}
          />
          <button
            type="button"
            title="Marcar normal"
            onClick={() => setSistema(s.label, s.normal)}
            className="mt-0.5 shrink-0 rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
          >
            <Check size={15} />
          </button>
        </div>
      ))}
      <div className="pt-1">
        <label className="label">Otros hallazgos</label>
        <textarea className="input text-sm" rows={2} placeholder="Cualquier hallazgo fuera de los sistemas anteriores…"
          value={otros} onChange={(e) => onChange(composeEF(ef, e.target.value))} />
      </div>
    </div>
  )
}

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
  const { negocio } = useNegocio()

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

  async function imprimir() {
    const cli = clientes.find((c) => c.id === pacienteId) || null
    // Últimos signos vitales: evolución más reciente que tenga alguno.
    const { data: evos } = await supabase
      .from('historia_evoluciones').select('*').eq('cliente_id', pacienteId)
      .order('fecha', { ascending: false }).order('created_at', { ascending: false }).limit(30)
    const vit = ((evos as HistoriaEvolucion[]) || []).find((e) =>
      [e.ta_sistolica, e.fc, e.fr, e.sat, e.temp, e.peso, e.imc, e.glucosa].some((x) => x != null)) || null

    const w = window.open('', '_blank', 'width=900,height=1000')
    if (!w) return alert('Permite las ventanas emergentes para imprimir.')

    const edad = cli ? edadDe(cli.fecha_nacimiento) : null
    const logoSrc = `${location.origin}${import.meta.env.BASE_URL}${negocio.logo}`
    const contacto = [negocio.telefono ? `Tel.: ${negocio.telefono}` : '', negocio.whatsapp ? `Cel.: ${negocio.whatsapp}` : ''].filter(Boolean).join(' · ')
    const upg = { '1': 'Independiente', '2': 'Independiente con ayudas', '3': 'Requiere supervisión / asistencia', '4': 'No camina' } as Record<string, string>

    const secText = (t: string, v: string | null | undefined) =>
      v && String(v).trim() ? `<div class="sec"><div class="sec-t">${esc(t)}</div><div class="sec-c">${esc(String(v)).replace(/\n/g, '<br>')}</div></div>` : ''

    const escalas: [string, string, Interp][] = [
      ['Barthel (AVD)', form.barthel ? `${form.barthel} / 100` : '', iBarthel(form.barthel)],
      ['Minimental (MMSE)', form.minimental ? `${form.minimental} / 30` : '', iMinimental(form.minimental)],
      ['Cruz Roja mental', form.cruz_roja_mental ? `${form.cruz_roja_mental} / 5` : '', iCruzRoja(form.cruz_roja_mental)],
      ['Cruz Roja física', form.cruz_roja_fisica ? `${form.cruz_roja_fisica} / 5` : '', iCruzRoja(form.cruz_roja_fisica)],
      ['Tinetti', form.tinetti ? `${form.tinetti} / 28` : '', iTinetti(form.tinetti)],
      ['Valoración social', form.valoracion_social ? `${form.valoracion_social} pts` : '', null],
      ['Velocidad de marcha', form.velocidad_marcha ? `${form.velocidad_marcha} m/s` : '', iVelocidad(form.velocidad_marcha)],
      ['Sit to stand', form.sit_to_stand ? `${form.sit_to_stand} s` : '', iSitToStand(form.sit_to_stand)],
      ['Up & Go', form.up_and_go ? (upg[form.up_and_go] || '') : '', null],
    ]
    const filasEsc = escalas.filter((r) => r[1])
    const escalasHtml = filasEsc.length
      ? `<div class="sec"><div class="sec-t">Escalas geriátricas</div><table class="esc">${filasEsc.map((r) =>
          `<tr><td class="e-l">${esc(r[0])}</td><td class="e-v">${esc(r[1])}</td><td class="e-i">${r[2] ? esc(r[2]!.texto) : ''}</td></tr>`).join('')}</table></div>`
      : ''

    let vitTxt = ''
    if (vit) {
      const p: string[] = []
      if (vit.ta_sistolica != null && vit.ta_diastolica != null) p.push(`TA ${vit.ta_sistolica}/${vit.ta_diastolica} mmHg`)
      if (vit.fc != null) p.push(`FC ${vit.fc} L/m`)
      if (vit.fr != null) p.push(`FR ${vit.fr} R/m`)
      if (vit.sat != null) p.push(`SAT ${vit.sat}%`)
      if (vit.temp != null) p.push(`Temp ${vit.temp} °C`)
      if (vit.peso != null) p.push(`Peso ${vit.peso} lb`)
      if (vit.imc != null) p.push(`IMC ${vit.imc}`)
      if (vit.glucosa != null) p.push(`Glucosa ${vit.glucosa} mg/dL`)
      vitTxt = p.join(' · ') + (vit.fecha ? `  (${fechaCorta(vit.fecha)})` : '')
    }

    const dato = (etq: string, val: string | null | undefined) =>
      val ? `<div class="d"><span class="d-e">${esc(etq)}:</span> ${esc(String(val))}</div>` : ''

    w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Historia clínica — ${esc(cli?.nombre || 'Paciente')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia,'Times New Roman',serif; color:#1f2937; margin:0; padding:34px 42px; line-height:1.5; font-size:13px; }
  .enc { display:flex; align-items:center; gap:16px; border-bottom:2px solid #5484b4; padding-bottom:14px; margin-bottom:14px; }
  .enc img { height:64px; width:auto; object-fit:contain; }
  .cl-n { font-size:20px; font-weight:bold; color:#111827; margin:0; }
  .cl-e { font-size:12px; font-weight:bold; color:#456f9c; margin-top:2px; }
  .cl-d { font-size:11px; color:#4b5563; margin-top:3px; }
  h1 { font-size:16px; text-align:center; letter-spacing:1px; color:#456f9c; margin:6px 0 14px; }
  .meta { display:flex; flex-wrap:wrap; gap:4px 22px; margin-bottom:12px; }
  .d { min-width:44%; font-size:12.5px; }
  .d-e { font-weight:bold; color:#374151; }
  .sec { margin-top:12px; break-inside:avoid; }
  .sec-t { font-weight:bold; color:#456f9c; text-transform:uppercase; font-size:12px; border-bottom:1px solid #e5e7eb; padding-bottom:2px; margin-bottom:5px; }
  .sec-c { white-space:normal; }
  table.esc { width:100%; border-collapse:collapse; }
  table.esc td { padding:3px 6px; border-bottom:1px solid #eef2f7; font-size:12.5px; vertical-align:top; }
  .e-l { color:#374151; width:42%; }
  .e-v { font-weight:bold; width:24%; }
  .e-i { color:#6b7280; font-style:italic; }
  .firma { margin-top:54px; text-align:center; break-inside:avoid; }
  .firma .ln { width:280px; border-top:1px solid #374151; margin:0 auto 6px; }
  .firma .n { font-weight:bold; }
  @page { size: letter; margin: 12mm; }
</style></head><body>
  <div class="enc">
    <img src="${logoSrc}" alt="">
    <div>
      <p class="cl-n">${esc(negocio.nombre)}</p>
      <div class="cl-e">${esc(ESPECIALIDAD)}</div>
      <div class="cl-d">${negocio.direccion ? esc(negocio.direccion) : ''}${contacto ? ' · ' + esc(contacto) : ''}</div>
    </div>
  </div>

  <h1>Historia Clínica — Geriatría</h1>

  <div class="meta">
    ${dato('Paciente', cli?.nombre)}
    ${dato('Edad', edad != null ? `${edad} años` : '')}
    ${dato('Sexo', cli?.sexo)}
    ${dato('Cédula', cli?.cedula)}
    ${dato('Fecha', fechaCorta(form.fecha_valoracion || hoyISO()))}
    ${dato('Seguro / ARS', cli?.seguro_ars)}
    ${dato('Teléfono', cli?.telefono)}
    ${dato('Informante', form.informante)}
  </div>

  ${secText('Motivo de consulta', form.motivo_consulta)}
  ${secText('Historia de la enfermedad actual', form.enfermedad_actual)}
  ${escalasHtml}
  ${secText('Hábitos tóxicos', form.habitos_toxicos)}
  ${secText('Antecedentes personales', form.antecedentes_personales)}
  ${secText('Antecedentes heredo-familiares', form.antecedentes_familiares)}
  ${secText('Genitourinario / continencia', form.genitourinario)}
  ${secText('Hábito intestinal y sueño', form.habito_intestinal_sueno)}
  ${secText('Aspectos nutricionales', form.nutricion)}
  ${secText('Valoración funcional', form.valoracion_funcional)}
  ${secText('Valoración mental', form.valoracion_mental)}
  ${secText('Condición social', form.condicion_social)}
  ${secText('Signos vitales', vitTxt)}
  ${secText('Examen físico', form.examen_fisico)}
  ${secText('EKG', form.ekg)}
  ${secText('Comentario', form.comentario)}
  ${secText('Nota', form.nota)}
  ${secText('Observaciones', form.observaciones)}

  <div class="firma">
    <div class="ln"></div>
    <div class="n">Dr. Marcos Cepeda Espinal</div>
    <div style="font-size:12px;color:#456f9c;font-weight:bold;">${esc(ESPECIALIDAD)}</div>
    <div style="font-size:11px;color:#6b7280;margin-top:3px;">Firma y sello · Exequátur: __________</div>
  </div>
  <script>
    window.onload = function(){
      var imgs = Array.prototype.slice.call(document.images)
      Promise.all(imgs.map(function(img){ return img.complete ? Promise.resolve() : new Promise(function(res){ img.onload=img.onerror=res }) }))
        .then(function(){ setTimeout(function(){ window.focus(); window.print() }, 150) })
    }
  </script>
</body></html>`)
    w.document.close(); w.focus()
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
            <div className="flex flex-wrap items-center gap-3">
              {guardado && <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600"><Check size={16} /> Guardado</span>}
              <button className="btn-ghost" onClick={imprimir}>
                <Printer size={16} /> Imprimir historia clínica
              </button>
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
            <Seccion>Examen físico</Seccion>
            <p className="-mt-1 text-xs text-slate-500">Escribe solo el hallazgo de cada sistema; usa el check para marcarlo normal, o «Llenar normales» para los que falten.</p>
            <ExamenFisicoEditor value={form.examen_fisico} onChange={(v) => set({ examen_fisico: v })} />
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
