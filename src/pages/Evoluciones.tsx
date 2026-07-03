import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Save, Stethoscope, Activity } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Cliente, Empleado, HistoriaEvolucion } from '../types'
import { fechaCorta, hoyISO } from '../lib/format'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import Modal from '../components/Modal'
import SelectorPaciente from '../components/SelectorPaciente'

const vacio = {
  fecha: hoyISO(), empleado_id: '', motivo: '', diagnostico: '', procedimiento: '', indicaciones: '', notas: '',
  ta_sistolica: '', ta_diastolica: '', fc: '', fr: '', sat: '', temp: '', peso: '', talla: '', glucosa: '',
}

// Convierte el texto de un input numérico a número o null (vacío = null).
function numOrNull(s: string): number | null {
  const t = s.trim()
  if (t === '') return null
  const n = Number(t)
  return isNaN(n) ? null : n
}

// IMC a partir de peso en LIBRAS y talla en CM (kg / m²).
function calcImc(pesoLb: string, tallaCm: string): number | null {
  const lb = numOrNull(pesoLb), cm = numOrNull(tallaCm)
  if (!lb || !cm) return null
  const kg = lb * 0.453592
  const m = cm / 100
  if (m <= 0) return null
  return Math.round((kg / (m * m)) * 10) / 10
}

// ¿La evolución tiene algún signo vital registrado?
function tieneVitales(e: HistoriaEvolucion): boolean {
  return [e.ta_sistolica, e.fc, e.fr, e.sat, e.temp, e.peso, e.talla, e.imc, e.glucosa].some((v) => v != null)
}

export default function Evoluciones({ pacienteFijo }: { pacienteFijo?: string } = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [pacienteId, setPacienteId] = useState<string>(pacienteFijo ?? '')
  const [items, setItems] = useState<HistoriaEvolucion[]>([])
  const [cargando, setCargando] = useState(false)

  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(vacio)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('clientes').select('*').order('nombre'),
      supabase.from('empleados').select('*').eq('activo', true).order('nombre'),
    ]).then(([cl, em]) => { setClientes(cl.data ?? []); setEmpleados(em.data ?? []) })
  }, [])
  useEffect(() => { if (pacienteFijo != null) setPacienteId(pacienteFijo) }, [pacienteFijo])

  async function cargar(pid: string) {
    setCargando(true)
    const { data } = await supabase.from('historia_evoluciones').select('*').eq('cliente_id', pid).order('fecha', { ascending: false }).order('created_at', { ascending: false })
    setItems((data as HistoriaEvolucion[]) ?? [])
    setCargando(false)
  }
  useEffect(() => {
    if (!pacienteId) { setItems([]); return }
    cargar(pacienteId)
  }, [pacienteId])

  function nombreEmpleado(id: string | null): string {
    return empleados.find((e) => e.id === id)?.nombre ?? 'Sin asignar'
  }

  function nuevo() {
    setEditId(null)
    setForm({ ...vacio, fecha: hoyISO() })
    setOpen(true)
  }
  function editar(e: HistoriaEvolucion) {
    setEditId(e.id)
    setForm({
      fecha: e.fecha, empleado_id: e.empleado_id ?? '', motivo: e.motivo ?? '',
      diagnostico: e.diagnostico ?? '', procedimiento: e.procedimiento ?? '',
      indicaciones: e.indicaciones ?? '', notas: e.notas ?? '',
      ta_sistolica: e.ta_sistolica != null ? String(e.ta_sistolica) : '',
      ta_diastolica: e.ta_diastolica != null ? String(e.ta_diastolica) : '',
      fc: e.fc != null ? String(e.fc) : '',
      fr: e.fr != null ? String(e.fr) : '',
      sat: e.sat != null ? String(e.sat) : '',
      temp: e.temp != null ? String(e.temp) : '',
      peso: e.peso != null ? String(e.peso) : '',
      talla: e.talla != null ? String(e.talla) : '',
      glucosa: e.glucosa != null ? String(e.glucosa) : '',
    })
    setOpen(true)
  }
  async function guardar() {
    const hayVitales = [form.ta_sistolica, form.ta_diastolica, form.fc, form.fr, form.sat, form.temp, form.peso, form.talla, form.glucosa].some((v) => v.trim() !== '')
    if (!form.motivo.trim() && !form.procedimiento.trim() && !form.notas.trim() && !hayVitales) {
      return alert('Escribe al menos el motivo, el procedimiento, una nota o algún signo vital.')
    }
    setSaving(true)
    const payload = {
      cliente_id: pacienteId,
      empleado_id: form.empleado_id || null,
      fecha: form.fecha,
      motivo: form.motivo || null,
      diagnostico: form.diagnostico || null,
      procedimiento: form.procedimiento || null,
      indicaciones: form.indicaciones || null,
      notas: form.notas || null,
      ta_sistolica: numOrNull(form.ta_sistolica),
      ta_diastolica: numOrNull(form.ta_diastolica),
      fc: numOrNull(form.fc),
      fr: numOrNull(form.fr),
      sat: numOrNull(form.sat),
      temp: numOrNull(form.temp),
      peso: numOrNull(form.peso),
      talla: numOrNull(form.talla),
      imc: calcImc(form.peso, form.talla),
      glucosa: numOrNull(form.glucosa),
    }
    const { error } = editId
      ? await supabase.from('historia_evoluciones').update(payload).eq('id', editId)
      : await supabase.from('historia_evoluciones').insert(payload)
    setSaving(false)
    if (error) return alert('Error al guardar: ' + error.message)
    setOpen(false)
    cargar(pacienteId)
  }
  async function eliminar(e: HistoriaEvolucion) {
    if (!confirm('¿Eliminar esta evolución?')) return
    await supabase.from('historia_evoluciones').delete().eq('id', e.id)
    cargar(pacienteId)
  }

  return (
    <div>
      {!pacienteFijo && (
        <>
          <PageHeader title="Evoluciones clínicas" subtitle="Qué se hizo en cada visita" />
          <div className="card mb-6 max-w-md">
            <label className="label">Paciente</label>
            <SelectorPaciente clientes={clientes} value={pacienteId} onChange={setPacienteId} />
          </div>
        </>
      )}

      {!pacienteId ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <Stethoscope className="text-brand-300" size={40} />
          <p className="text-slate-500">Selecciona un paciente para ver sus evoluciones.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">{items.length} evolución(es)</h3>
            <button className="btn-primary" onClick={nuevo}><Plus size={16} /> Nueva evolución</button>
          </div>

          {cargando ? (
            <Cargando />
          ) : items.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-12 text-center">
              <Stethoscope className="text-brand-300" size={40} />
              <p className="text-slate-500">Aún no hay evoluciones. Registra la primera visita.</p>
            </div>
          ) : (
            <div className="relative space-y-4 before:absolute before:left-[7px] before:top-1 before:h-full before:w-0.5 before:bg-amber-100">
              {items.map((e) => (
                <div key={e.id} className="relative pl-7">
                  <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-500 shadow" />
                  <div className="card">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{fechaCorta(e.fecha)}</span>
                        <span className="badge bg-brand-50 text-brand-700">{nombreEmpleado(e.empleado_id)}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => editar(e)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"><Pencil size={15} /></button>
                        <button onClick={() => eliminar(e)} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    {tieneVitales(e) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {e.ta_sistolica != null && e.ta_diastolica != null && <VitalChip label="TA" val={`${e.ta_sistolica}/${e.ta_diastolica}`} />}
                        {e.fc != null && <VitalChip label="FC" val={String(e.fc)} />}
                        {e.fr != null && <VitalChip label="FR" val={String(e.fr)} />}
                        {e.sat != null && <VitalChip label="SAT" val={`${e.sat}%`} />}
                        {e.temp != null && <VitalChip label="T°" val={`${e.temp}°C`} />}
                        {e.peso != null && <VitalChip label="Peso" val={`${e.peso} lb`} />}
                        {e.imc != null && <VitalChip label="IMC" val={String(e.imc)} />}
                        {e.glucosa != null && <VitalChip label="Gluc" val={String(e.glucosa)} />}
                      </div>
                    )}
                    {e.motivo && <p className="mt-1.5 text-sm text-slate-700"><b>Motivo:</b> {e.motivo}</p>}
                    {e.diagnostico && <p className="mt-1 text-sm text-slate-700"><b>Diagnóstico:</b> {e.diagnostico}</p>}
                    {e.procedimiento && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700"><b>Procedimiento:</b> {e.procedimiento}</p>}
                    {e.notas && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{e.notas}</p>}
                    {e.indicaciones && (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"><b>Indicaciones:</b> {e.indicaciones}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        open={open}
        title={editId ? 'Editar evolución' : 'Nueva evolución'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={guardar} disabled={saving}><Save size={16} /> {saving ? 'Guardando…' : 'Guardar'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha</label>
              <input type="date" className="input" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div>
              <label className="label">Profesional</label>
              <select className="input" value={form.empleado_id} onChange={(e) => setForm({ ...form, empleado_id: e.target.value })}>
                <option value="">— Sin asignar —</option>
                {empleados.map((em) => <option key={em.id} value={em.id}>{em.nombre}</option>)}
              </select>
            </div>
          </div>
          {/* Signos vitales de la visita */}
          <div className="rounded-xl border-2 border-brand-100 bg-brand-50/40 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">
              <Activity size={14} /> Signos vitales
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <span className="text-[11px] font-medium text-slate-500">TA (mmHg)</span>
                <div className="flex items-center gap-1">
                  <input inputMode="numeric" className="input" placeholder="120" value={form.ta_sistolica} onChange={(e) => setForm({ ...form, ta_sistolica: e.target.value })} />
                  <span className="text-slate-400">/</span>
                  <input inputMode="numeric" className="input" placeholder="80" value={form.ta_diastolica} onChange={(e) => setForm({ ...form, ta_diastolica: e.target.value })} />
                </div>
              </div>
              <VitalInput label="FC (L/M)" value={form.fc} onChange={(v) => setForm({ ...form, fc: v })} placeholder="80" />
              <VitalInput label="FR (R/M)" value={form.fr} onChange={(v) => setForm({ ...form, fr: v })} placeholder="16" />
              <VitalInput label="SAT (%)" value={form.sat} onChange={(v) => setForm({ ...form, sat: v })} placeholder="98" />
              <VitalInput label="Temp (°C)" value={form.temp} onChange={(v) => setForm({ ...form, temp: v })} placeholder="37.0" />
              <VitalInput label="Peso (lb)" value={form.peso} onChange={(v) => setForm({ ...form, peso: v })} placeholder="150" />
              <VitalInput label="Talla (cm)" value={form.talla} onChange={(v) => setForm({ ...form, talla: v })} placeholder="165" />
              <VitalInput label="Glucosa (mg/dL)" value={form.glucosa} onChange={(v) => setForm({ ...form, glucosa: v })} placeholder="100" />
            </div>
            {calcImc(form.peso, form.talla) != null && (
              <p className="mt-2 text-xs font-semibold text-brand-700">IMC calculado: {calcImc(form.peso, form.talla)}</p>
            )}
          </div>

          <div>
            <label className="label">Motivo de la visita</label>
            <input className="input" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ej. control de hipertensión, mareos, seguimiento" />
          </div>
          <div>
            <label className="label">Diagnóstico</label>
            <textarea className="input" rows={2} value={form.diagnostico} onChange={(e) => setForm({ ...form, diagnostico: e.target.value })} />
          </div>
          <div>
            <label className="label">Procedimiento realizado</label>
            <textarea className="input" rows={3} value={form.procedimiento} onChange={(e) => setForm({ ...form, procedimiento: e.target.value })} placeholder="Qué se hizo en la visita" />
          </div>
          <div>
            <label className="label">Indicaciones</label>
            <input className="input" value={form.indicaciones} onChange={(e) => setForm({ ...form, indicaciones: e.target.value })} placeholder="Ej. control en 1 semana, analgésico si duele" />
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="input" rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Input numérico compacto para un signo vital.
function VitalInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      <input inputMode="decimal" className="input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

// Distintivo para mostrar un signo vital en la línea de tiempo.
function VitalChip({ label, val }: { label: string; val: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
      <span className="text-brand-400">{label}</span>{val}
    </span>
  )
}
