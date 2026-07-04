import { useEffect, useState } from 'react'
import { Pill, Plus, Pencil, Trash2, Save, AlertTriangle, Power, ShieldAlert } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Cliente } from '../types'
import { fechaCorta, hoyISO } from '../lib/format'
import { revisarMedicamento, UMBRAL_POLIFARMACIA, DESCARGO } from '../lib/medicamentos'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import Modal from '../components/Modal'
import SelectorPaciente from '../components/SelectorPaciente'

interface Medicamento {
  id: string
  cliente_id: string
  nombre: string
  dosis: string | null
  frecuencia: string | null
  via: string | null
  indicacion: string | null
  fecha_inicio: string | null
  activo: boolean
  notas: string | null
}

const vacio = { nombre: '', dosis: '', frecuencia: '', via: '', indicacion: '', fecha_inicio: hoyISO(), notas: '' }

const VIAS = ['Oral', 'Sublingual', 'Intramuscular', 'Intravenosa', 'Subcutánea', 'Tópica', 'Inhalada', 'Oftálmica', 'Ótica', 'Rectal']

export default function MedicacionPaciente({ pacienteFijo }: { pacienteFijo?: string } = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pacienteId, setPacienteId] = useState<string>(pacienteFijo ?? '')
  const [meds, setMeds] = useState<Medicamento[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(vacio)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('clientes').select('*').order('nombre').then(({ data }) => setClientes(data ?? []))
  }, [])
  useEffect(() => { if (pacienteFijo != null) setPacienteId(pacienteFijo) }, [pacienteFijo])

  async function cargar(pid: string) {
    setLoading(true)
    const { data } = await supabase.from('medicamentos_paciente').select('*')
      .eq('cliente_id', pid).order('activo', { ascending: false }).order('nombre')
    setMeds((data as Medicamento[]) ?? [])
    setLoading(false)
  }
  useEffect(() => {
    if (!pacienteId) { setMeds([]); return }
    cargar(pacienteId)
  }, [pacienteId])

  function nuevo() { setEditId(null); setForm({ ...vacio, fecha_inicio: hoyISO() }); setOpen(true) }
  function editar(m: Medicamento) {
    setEditId(m.id)
    setForm({ nombre: m.nombre, dosis: m.dosis ?? '', frecuencia: m.frecuencia ?? '', via: m.via ?? '', indicacion: m.indicacion ?? '', fecha_inicio: m.fecha_inicio ?? hoyISO(), notas: m.notas ?? '' })
    setOpen(true)
  }
  async function guardar() {
    if (!form.nombre.trim()) return alert('Escribe el nombre del medicamento.')
    setSaving(true)
    const payload = {
      cliente_id: pacienteId,
      nombre: form.nombre.trim(), dosis: form.dosis || null, frecuencia: form.frecuencia || null,
      via: form.via || null, indicacion: form.indicacion || null,
      fecha_inicio: form.fecha_inicio || null, notas: form.notas || null,
    }
    const { error } = editId
      ? await supabase.from('medicamentos_paciente').update(payload).eq('id', editId)
      : await supabase.from('medicamentos_paciente').insert(payload)
    setSaving(false)
    if (error) return alert('Error al guardar: ' + error.message)
    setOpen(false); cargar(pacienteId)
  }
  async function alternar(m: Medicamento) {
    await supabase.from('medicamentos_paciente').update({ activo: !m.activo }).eq('id', m.id)
    cargar(pacienteId)
  }
  async function eliminar(m: Medicamento) {
    if (!confirm(`¿Eliminar "${m.nombre}" del listado?`)) return
    await supabase.from('medicamentos_paciente').delete().eq('id', m.id)
    cargar(pacienteId)
  }

  const activos = meds.filter((m) => m.activo)
  const inactivos = meds.filter((m) => !m.activo)
  const polifarmacia = activos.length >= UMBRAL_POLIFARMACIA
  // Alertas de medicación inapropiada sobre los activos
  const conAlertas = activos.map((m) => ({ m, alertas: revisarMedicamento(m.nombre) })).filter((x) => x.alertas.length > 0)
  const nAlto = conAlertas.reduce((s, x) => s + x.alertas.filter((a) => a.gravedad === 'alto').length, 0)

  // Alertas del formulario en vivo
  const alertasForm = revisarMedicamento(form.nombre)

  return (
    <div>
      {!pacienteFijo && (
        <>
          <PageHeader title="Medicación" subtitle="Lista de medicación activa y revisión de polifarmacia" />
          <div className="card mb-6 max-w-md">
            <label className="label">Paciente</label>
            <SelectorPaciente clientes={clientes} value={pacienteId} onChange={setPacienteId} />
          </div>
        </>
      )}

      {!pacienteId ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <Pill className="text-brand-300" size={40} />
          <p className="text-slate-500">Selecciona un paciente para ver su medicación.</p>
        </div>
      ) : loading ? (
        <Cargando />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge bg-brand-50 text-brand-700">{activos.length} activo(s)</span>
              {polifarmacia && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  <AlertTriangle size={13} /> Polifarmacia ({activos.length} ≥ {UMBRAL_POLIFARMACIA})
                </span>
              )}
              {conAlertas.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                  <ShieldAlert size={13} /> {conAlertas.length} con alerta{nAlto ? ` · ${nAlto} de riesgo alto` : ''}
                </span>
              )}
            </div>
            <button className="btn-primary" onClick={nuevo}><Plus size={16} /> Agregar medicamento</button>
          </div>

          {/* Panel de alertas de medicación inapropiada */}
          {conAlertas.length > 0 && (
            <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/50 p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-rose-700">
                <ShieldAlert size={15} /> Medicación potencialmente inapropiada en el adulto mayor
              </h3>
              <ul className="space-y-2">
                {conAlertas.map(({ m, alertas }) =>
                  alertas.map((a, i) => (
                    <li key={m.id + i} className="rounded-xl bg-white p-3 text-sm ring-1 ring-rose-100">
                      <p className="font-semibold text-slate-800">{m.nombre} <span className="text-xs font-normal text-slate-500">— {a.grupo}</span>
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${a.gravedad === 'alto' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'}`}>{a.gravedad === 'alto' ? 'Riesgo alto' : 'Precaución'}</span>
                      </p>
                      <p className="mt-1 text-slate-600">{a.riesgo}</p>
                      <p className="mt-0.5 text-brand-700"><b>Sugerencia:</b> {a.recomendacion}</p>
                    </li>
                  )),
                )}
              </ul>
              <p className="mt-2 text-[11px] text-slate-500">{DESCARGO}</p>
            </div>
          )}

          {/* Lista de medicamentos activos */}
          {activos.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-10 text-center">
              <Pill className="text-brand-300" size={36} />
              <p className="text-slate-500">Sin medicación activa registrada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activos.map((m) => {
                const al = revisarMedicamento(m.nombre)
                return (
                  <div key={m.id} className={`card ${al.length ? 'ring-1 ring-rose-200' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">{m.nombre}
                          {al.length > 0 && <AlertTriangle size={14} className="ml-1 inline text-rose-500" />}
                        </p>
                        <p className="text-sm text-slate-600">
                          {[m.dosis, m.frecuencia, m.via].filter(Boolean).join(' · ') || 'Sin detalles'}
                        </p>
                        {m.indicacion && <p className="text-xs text-slate-500">Para: {m.indicacion}</p>}
                        {m.fecha_inicio && <p className="text-xs text-slate-400">Desde {fechaCorta(m.fecha_inicio)}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button onClick={() => alternar(m)} title="Suspender" className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"><Power size={15} /></button>
                        <button onClick={() => editar(m)} title="Editar" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"><Pencil size={15} /></button>
                        <button onClick={() => eliminar(m)} title="Eliminar" className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Suspendidos */}
          {inactivos.length > 0 && (
            <div>
              <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Suspendidos ({inactivos.length})</h3>
              <div className="space-y-2">
                {inactivos.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2">
                    <span className="text-sm text-slate-500 line-through">{m.nombre}</span>
                    <div className="flex gap-1">
                      <button onClick={() => alternar(m)} title="Reactivar" className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"><Power size={15} /></button>
                      <button onClick={() => eliminar(m)} title="Eliminar" className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal alta / edición */}
      <Modal
        open={open}
        title={editId ? 'Editar medicamento' : 'Agregar medicamento'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={guardar} disabled={saving}><Save size={16} /> {saving ? 'Guardando…' : 'Guardar'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Medicamento (principio activo)</label>
            <input className="input" placeholder="Ej. Amlodipino, Metformina, Diazepam…" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            {alertasForm.length > 0 && (
              <div className="mt-2 space-y-1">
                {alertasForm.map((a, i) => (
                  <div key={i} className={`flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${a.gravedad === 'alto' ? 'bg-rose-50 text-rose-700' : 'bg-orange-50 text-orange-700'}`}>
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span><b>{a.grupo}:</b> {a.riesgo} <i>{a.recomendacion}</i></span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Dosis</label>
              <input className="input" placeholder="Ej. 5 mg" value={form.dosis} onChange={(e) => setForm({ ...form, dosis: e.target.value })} />
            </div>
            <div>
              <label className="label">Frecuencia</label>
              <input className="input" placeholder="Ej. cada 12 horas" value={form.frecuencia} onChange={(e) => setForm({ ...form, frecuencia: e.target.value })} />
            </div>
            <div>
              <label className="label">Vía</label>
              <select className="input" value={form.via} onChange={(e) => setForm({ ...form, via: e.target.value })}>
                <option value="">—</option>
                {VIAS.map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Desde</label>
              <input type="date" className="input" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Indicación (para qué)</label>
            <input className="input" placeholder="Ej. hipertensión" value={form.indicacion} onChange={(e) => setForm({ ...form, indicacion: e.target.value })} />
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
