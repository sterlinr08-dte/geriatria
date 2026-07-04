import { useEffect, useState } from 'react'
import { HeartHandshake, Save, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Cliente } from '../types'
import { fechaCorta, hoyISO } from '../lib/format'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import SelectorPaciente from '../components/SelectorPaciente'

interface Plan {
  objetivos: string
  recomendaciones: string
  cuidador: string
  cuidador_telefono: string
  rcp: string
  nivel_intervencion: string
  nutricion_artificial: string
  representante: string
  representante_telefono: string
  lugar_preferido: string
  valores: string
  notas: string
  fecha_revision: string
}

const vacio: Plan = {
  objetivos: '', recomendaciones: '', cuidador: '', cuidador_telefono: '',
  rcp: '', nivel_intervencion: '', nutricion_artificial: '', representante: '',
  representante_telefono: '', lugar_preferido: '', valores: '', notas: '', fecha_revision: '',
}

const OPC_RCP = [
  { v: '', t: 'No definido' },
  { v: 'si', t: 'Sí — reanimar (RCP)' },
  { v: 'no', t: 'No reanimar (ONR)' },
]
const OPC_NIVEL = [
  { v: '', t: 'No definido' },
  { v: 'completo', t: 'Tratamiento completo (incl. UCI)' },
  { v: 'hospitalario', t: 'Hospitalario limitado (sin UCI/ventilación)' },
  { v: 'confort', t: 'Solo medidas de confort' },
]
const OPC_NUTRI = [
  { v: '', t: 'No definido' },
  { v: 'si', t: 'Aceptar nutrición/hidratación artificial' },
  { v: 'ensayo', t: 'Ensayo por tiempo limitado' },
  { v: 'no', t: 'No desea nutrición artificial' },
]

const label = (opc: { v: string; t: string }[], v: string) => opc.find((o) => o.v === v)?.t ?? '—'

export default function PlanCuidados({ pacienteFijo }: { pacienteFijo?: string } = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pacienteId, setPacienteId] = useState<string>(pacienteFijo ?? '')
  const [form, setForm] = useState<Plan>(vacio)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    supabase.from('clientes').select('*').order('nombre').then(({ data }) => setClientes(data ?? []))
  }, [])
  useEffect(() => { if (pacienteFijo != null) setPacienteId(pacienteFijo) }, [pacienteFijo])

  async function cargar(pid: string) {
    setLoading(true)
    const { data } = await supabase.from('plan_cuidados').select('*').eq('cliente_id', pid).maybeSingle()
    if (data) {
      setForm({
        objetivos: data.objetivos ?? '', recomendaciones: data.recomendaciones ?? '',
        cuidador: data.cuidador ?? '', cuidador_telefono: data.cuidador_telefono ?? '',
        rcp: data.rcp ?? '', nivel_intervencion: data.nivel_intervencion ?? '',
        nutricion_artificial: data.nutricion_artificial ?? '', representante: data.representante ?? '',
        representante_telefono: data.representante_telefono ?? '', lugar_preferido: data.lugar_preferido ?? '',
        valores: data.valores ?? '', notas: data.notas ?? '', fecha_revision: data.fecha_revision ?? '',
      })
    } else setForm(vacio)
    setLoading(false)
  }
  useEffect(() => {
    if (!pacienteId) { setForm(vacio); return }
    cargar(pacienteId)
  }, [pacienteId])

  function set<K extends keyof Plan>(k: K, v: Plan[K]) { setForm((f) => ({ ...f, [k]: v })); setGuardado(false) }

  async function guardar() {
    if (!pacienteId) return
    setSaving(true)
    const payload = {
      cliente_id: pacienteId,
      objetivos: form.objetivos || null, recomendaciones: form.recomendaciones || null,
      cuidador: form.cuidador || null, cuidador_telefono: form.cuidador_telefono || null,
      rcp: form.rcp || null, nivel_intervencion: form.nivel_intervencion || null,
      nutricion_artificial: form.nutricion_artificial || null, representante: form.representante || null,
      representante_telefono: form.representante_telefono || null, lugar_preferido: form.lugar_preferido || null,
      valores: form.valores || null, notas: form.notas || null, fecha_revision: form.fecha_revision || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('plan_cuidados').upsert(payload, { onConflict: 'cliente_id' })
    setSaving(false)
    if (error) return alert('Error al guardar: ' + error.message)
    setGuardado(true)
  }

  const paciente = clientes.find((c) => c.id === pacienteId)

  function imprimir() {
    const w = window.open('', '_blank')
    if (!w) return
    const fila = (etq: string, val: string) => val ? `<tr><th>${etq}</th><td>${val.replace(/\n/g, '<br>')}</td></tr>` : ''
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
      <title>Plan de cuidados y directivas anticipadas</title>
      <style>
        body{font-family:system-ui,-apple-system,Arial,sans-serif;color:#1e293b;margin:32px;line-height:1.45}
        h1{font-size:18px;margin:0 0 2px;color:#3a5c82}
        h2{font-size:13px;margin:20px 0 6px;color:#456f9c;text-transform:uppercase;letter-spacing:.04em}
        .sub{color:#64748b;font-size:13px;margin-bottom:6px}
        table{width:100%;border-collapse:collapse;font-size:13px;margin-top:4px}
        th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;vertical-align:top}
        th{background:#eef4fa;color:#3a5c82;width:34%;font-weight:600}
        .firma{margin-top:44px;display:flex;justify-content:space-between;gap:40px}
        .firma div{flex:1;border-top:1px solid #94a3b8;padding-top:4px;text-align:center;color:#64748b;font-size:12px}
        .pie{margin-top:24px;color:#94a3b8;font-size:11px}
      </style></head><body>
      <h1>Plan de cuidados y directivas anticipadas</h1>
      <div class="sub">${paciente?.nombre ?? ''}${paciente?.cedula ? ' · Céd. ' + paciente.cedula : ''}</div>
      <h2>Objetivos del cuidado</h2>
      <table>
        ${fila('Objetivos', form.objetivos)}
        ${fila('Recomendaciones', form.recomendaciones)}
        ${fila('Cuidador principal', [form.cuidador, form.cuidador_telefono].filter(Boolean).join(' · '))}
      </table>
      <h2>Directivas anticipadas</h2>
      <table>
        ${fila('Reanimación (RCP)', label(OPC_RCP, form.rcp))}
        ${fila('Nivel de intervención', label(OPC_NIVEL, form.nivel_intervencion))}
        ${fila('Nutrición/hidratación artificial', label(OPC_NUTRI, form.nutricion_artificial))}
        ${fila('Lugar preferido de cuidado', form.lugar_preferido)}
        ${fila('Representante / decisor sustituto', [form.representante, form.representante_telefono].filter(Boolean).join(' · '))}
        ${fila('Valores y deseos del paciente', form.valores)}
        ${fila('Observaciones', form.notas)}
      </table>
      <div class="firma"><div>Firma del paciente / representante</div><div>Firma del médico</div></div>
      <div class="pie">Documento orientativo de planificación de cuidados. Impreso el ${fechaCorta(hoyISO())}${form.fecha_revision ? ` · Revisión: ${fechaCorta(form.fecha_revision)}` : ''}.</div>
      </body></html>`)
    w.document.close(); w.focus(); w.print()
  }

  return (
    <div>
      {!pacienteFijo && (
        <>
          <PageHeader title="Plan de cuidados" subtitle="Objetivos del cuidado y directivas anticipadas" />
          <div className="card mb-6 max-w-md">
            <label className="label">Paciente</label>
            <SelectorPaciente clientes={clientes} value={pacienteId} onChange={setPacienteId} />
          </div>
        </>
      )}

      {!pacienteId ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <HeartHandshake className="text-brand-300" size={40} />
          <p className="text-slate-500">Selecciona un paciente para su plan de cuidados.</p>
        </div>
      ) : loading ? (
        <Cargando />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <button className="btn-ghost" onClick={imprimir}><Printer size={16} /> Imprimir</button>
            <button className="btn-primary" onClick={guardar} disabled={saving}>
              <Save size={16} /> {saving ? 'Guardando…' : guardado ? 'Guardado' : 'Guardar plan'}
            </button>
          </div>

          {/* Objetivos del cuidado */}
          <div className="card space-y-4">
            <h3 className="font-display font-bold text-slate-800">Objetivos del cuidado</h3>
            <div>
              <label className="label">Objetivos / metas del cuidado</label>
              <textarea className="input" rows={3} placeholder="Ej. mantener funcionalidad y calidad de vida, controlar el dolor…" value={form.objetivos} onChange={(e) => set('objetivos', e.target.value)} />
            </div>
            <div>
              <label className="label">Recomendaciones no farmacológicas / plan</label>
              <textarea className="input" rows={3} placeholder="Ej. ejercicio, dieta, prevención de caídas, terapia…" value={form.recomendaciones} onChange={(e) => set('recomendaciones', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Cuidador principal</label>
                <input className="input" value={form.cuidador} onChange={(e) => set('cuidador', e.target.value)} />
              </div>
              <div>
                <label className="label">Teléfono del cuidador</label>
                <input className="input" value={form.cuidador_telefono} onChange={(e) => set('cuidador_telefono', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Directivas anticipadas */}
          <div className="card space-y-4">
            <h3 className="font-display font-bold text-slate-800">Directivas anticipadas</h3>
            <p className="-mt-2 text-xs text-slate-500">Preferencias del paciente sobre intervenciones al final de la vida. Se registran de forma conjunta con el paciente y/o su representante.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Reanimación cardiopulmonar (RCP)</label>
                <select className="input" value={form.rcp} onChange={(e) => set('rcp', e.target.value)}>
                  {OPC_RCP.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Nivel de intervención</label>
                <select className="input" value={form.nivel_intervencion} onChange={(e) => set('nivel_intervencion', e.target.value)}>
                  {OPC_NIVEL.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Nutrición / hidratación artificial</label>
                <select className="input" value={form.nutricion_artificial} onChange={(e) => set('nutricion_artificial', e.target.value)}>
                  {OPC_NUTRI.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Lugar preferido de cuidado</label>
                <input className="input" placeholder="Ej. domicilio, hospital…" value={form.lugar_preferido} onChange={(e) => set('lugar_preferido', e.target.value)} />
              </div>
              <div>
                <label className="label">Representante / decisor sustituto</label>
                <input className="input" value={form.representante} onChange={(e) => set('representante', e.target.value)} />
              </div>
              <div>
                <label className="label">Teléfono del representante</label>
                <input className="input" value={form.representante_telefono} onChange={(e) => set('representante_telefono', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Valores y deseos del paciente</label>
              <textarea className="input" rows={3} placeholder="Qué es importante para el paciente, miedos, preferencias…" value={form.valores} onChange={(e) => set('valores', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Observaciones</label>
                <textarea className="input" rows={2} value={form.notas} onChange={(e) => set('notas', e.target.value)} />
              </div>
              <div>
                <label className="label">Fecha de revisión</label>
                <input type="date" className="input" value={form.fecha_revision} onChange={(e) => set('fecha_revision', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
