import { useEffect, useMemo, useState } from 'react'
import { Syringe, Plus, Pencil, Trash2, Save, Printer, CalendarClock, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Cliente } from '../types'
import { fechaCorta, hoyISO } from '../lib/format'
import { VACUNAS, VacunaDef, detectarVacuna } from '../lib/vacunas'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import Modal from '../components/Modal'
import SelectorPaciente from '../components/SelectorPaciente'

interface Vacuna {
  id: string
  cliente_id: string
  vacuna: string
  dosis: string | null
  fecha: string | null
  lote: string | null
  proxima: string | null
  notas: string | null
}

const vacio = { vacuna: '', dosis: '', fecha: hoyISO(), lote: '', proxima: '', notas: '' }

// Días entre hoy y una fecha ISO (negativo = ya pasó).
function diasHasta(iso: string | null): number | null {
  if (!iso) return null
  const d = new Date(iso), h = new Date(hoyISO())
  return Math.round((d.getTime() - h.getTime()) / 86400000)
}

export default function VacunasPaciente({ pacienteFijo }: { pacienteFijo?: string } = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pacienteId, setPacienteId] = useState<string>(pacienteFijo ?? '')
  const [items, setItems] = useState<Vacuna[]>([])
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
    const { data } = await supabase.from('vacunas_paciente').select('*')
      .eq('cliente_id', pid).order('fecha', { ascending: false })
    setItems((data as Vacuna[]) ?? [])
    setLoading(false)
  }
  useEffect(() => {
    if (!pacienteId) { setItems([]); return }
    cargar(pacienteId)
  }, [pacienteId])

  function nuevo(pref?: VacunaDef) {
    setEditId(null)
    setForm({ ...vacio, fecha: hoyISO(), vacuna: pref?.nombre ?? '' })
    setOpen(true)
  }
  function editar(v: Vacuna) {
    setEditId(v.id)
    setForm({ vacuna: v.vacuna, dosis: v.dosis ?? '', fecha: v.fecha ?? hoyISO(), lote: v.lote ?? '', proxima: v.proxima ?? '', notas: v.notas ?? '' })
    setOpen(true)
  }
  // Sugiere fecha de próxima dosis a partir del esquema, si aplica.
  function autoProxima() {
    const def = detectarVacuna(form.vacuna)
    if (!def?.refuerzoMeses || !form.fecha) return
    const d = new Date(form.fecha)
    d.setMonth(d.getMonth() + def.refuerzoMeses)
    setForm((f) => ({ ...f, proxima: d.toISOString().slice(0, 10) }))
  }
  async function guardar() {
    if (!form.vacuna.trim()) return alert('Escribe o selecciona la vacuna.')
    setSaving(true)
    const payload = {
      cliente_id: pacienteId,
      vacuna: form.vacuna.trim(), dosis: form.dosis || null, fecha: form.fecha || null,
      lote: form.lote || null, proxima: form.proxima || null, notas: form.notas || null,
    }
    const { error } = editId
      ? await supabase.from('vacunas_paciente').update(payload).eq('id', editId)
      : await supabase.from('vacunas_paciente').insert(payload)
    setSaving(false)
    if (error) return alert('Error al guardar: ' + error.message)
    setOpen(false); cargar(pacienteId)
  }
  async function eliminar(v: Vacuna) {
    if (!confirm(`¿Eliminar el registro de "${v.vacuna}"?`)) return
    await supabase.from('vacunas_paciente').delete().eq('id', v.id)
    cargar(pacienteId)
  }

  const paciente = clientes.find((c) => c.id === pacienteId)

  // Próximas dosis: registros con fecha próxima futura o vencida.
  const proximas = useMemo(() =>
    items.filter((v) => v.proxima).map((v) => ({ v, dias: diasHasta(v.proxima) as number }))
      .sort((a, b) => a.dias - b.dias), [items])

  // Vacunas del esquema recomendado aún no registradas.
  const aplicadasKeys = useMemo(() => {
    const s = new Set<string>()
    items.forEach((v) => { const d = detectarVacuna(v.vacuna); if (d) s.add(d.key) })
    return s
  }, [items])
  const faltantes = VACUNAS.filter((d) => !aplicadasKeys.has(d.key))

  function imprimir() {
    const filas = items.map((v) => `
      <tr>
        <td>${v.vacuna}</td>
        <td>${v.dosis ?? '—'}</td>
        <td style="white-space:nowrap">${v.fecha ? fechaCorta(v.fecha) : '—'}</td>
        <td>${v.lote ?? '—'}</td>
        <td style="white-space:nowrap">${v.proxima ? fechaCorta(v.proxima) : '—'}</td>
      </tr>`).join('')
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
      <title>Carné de vacunación</title>
      <style>
        body{font-family:system-ui,-apple-system,Arial,sans-serif;color:#1e293b;margin:32px}
        h1{font-size:18px;margin:0 0 2px;color:#3a5c82}
        .sub{color:#64748b;font-size:13px;margin-bottom:14px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;vertical-align:top}
        th{background:#eef4fa;color:#3a5c82;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
        .pie{margin-top:24px;color:#94a3b8;font-size:11px}
      </style></head><body>
      <h1>Carné de vacunación</h1>
      <div class="sub">${paciente?.nombre ?? ''}${paciente?.cedula ? ' · Céd. ' + paciente.cedula : ''}</div>
      <table><thead><tr><th>Vacuna</th><th>Dosis</th><th>Fecha</th><th>Lote</th><th>Próxima</th></tr></thead>
      <tbody>${filas || '<tr><td colspan="5" style="color:#94a3b8">Sin vacunas registradas.</td></tr>'}</tbody></table>
      <div class="pie">Impreso el ${fechaCorta(hoyISO())}.</div>
      </body></html>`)
    w.document.close(); w.focus(); w.print()
  }

  return (
    <div>
      {!pacienteFijo && (
        <>
          <PageHeader title="Vacunación" subtitle="Registro y esquema de vacunación del adulto mayor" />
          <div className="card mb-6 max-w-md">
            <label className="label">Paciente</label>
            <SelectorPaciente clientes={clientes} value={pacienteId} onChange={setPacienteId} />
          </div>
        </>
      )}

      {!pacienteId ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <Syringe className="text-brand-300" size={40} />
          <p className="text-slate-500">Selecciona un paciente para ver su vacunación.</p>
        </div>
      ) : loading ? (
        <Cargando />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="badge bg-brand-50 text-brand-700">{items.length} registro(s)</span>
            <div className="flex gap-2">
              {items.length > 0 && <button className="btn-ghost" onClick={imprimir}><Printer size={16} /> Carné</button>}
              <button className="btn-primary" onClick={() => nuevo()}><Plus size={16} /> Registrar vacuna</button>
            </div>
          </div>

          {/* Próximas dosis / vencidas */}
          {proximas.length > 0 && (
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-amber-700">
                <CalendarClock size={15} /> Próximas dosis / refuerzos
              </h3>
              <ul className="space-y-1.5">
                {proximas.map(({ v, dias }) => (
                  <li key={v.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-2.5 text-sm ring-1 ring-amber-100">
                    <span className="font-semibold text-slate-800">{v.vacuna}</span>
                    <span className="text-slate-500">{fechaCorta(v.proxima!)}</span>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${dias < 0 ? 'bg-rose-100 text-rose-700' : dias <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                      {dias < 0 ? `Vencida hace ${-dias} día(s)` : dias === 0 ? 'Hoy' : `En ${dias} día(s)`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vacunas del esquema aún no registradas */}
          {faltantes.length > 0 && (
            <div className="card">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
                <ShieldCheck size={15} className="text-brand-500" /> Del esquema recomendado — pendientes de registrar
              </h3>
              <div className="flex flex-wrap gap-2">
                {faltantes.map((d) => (
                  <button key={d.key} onClick={() => nuevo(d)} title={d.esquema}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">
                    <Plus size={12} /> {d.nombre}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Orientativo; el médico decide el esquema según cada caso.</p>
            </div>
          )}

          {/* Registros */}
          {items.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-10 text-center">
              <Syringe className="text-brand-300" size={36} />
              <p className="text-slate-500">Sin vacunas registradas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((v) => (
                <div key={v.id} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{v.vacuna}
                        {v.dosis && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{v.dosis}</span>}
                      </p>
                      <p className="text-sm text-slate-600">
                        {[v.fecha ? `Aplicada ${fechaCorta(v.fecha)}` : null, v.lote ? `Lote ${v.lote}` : null].filter(Boolean).join(' · ') || 'Sin fecha'}
                      </p>
                      {v.proxima && <p className="text-xs text-brand-600">Próxima: {fechaCorta(v.proxima)}</p>}
                      {v.notas && <p className="mt-0.5 text-xs text-slate-500">{v.notas}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => editar(v)} title="Editar" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"><Pencil size={15} /></button>
                      <button onClick={() => eliminar(v)} title="Eliminar" className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal alta / edición */}
      <Modal
        open={open}
        title={editId ? 'Editar vacuna' : 'Registrar vacuna'}
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
            <label className="label">Vacuna</label>
            <input className="input" list="lista-vacunas" placeholder="Ej. Influenza, Neumococo, Herpes zóster…" value={form.vacuna} onChange={(e) => setForm({ ...form, vacuna: e.target.value })} />
            <datalist id="lista-vacunas">
              {VACUNAS.map((v) => <option key={v.key} value={v.nombre} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Dosis</label>
              <input className="input" placeholder="Ej. 1.ª dosis, refuerzo" value={form.dosis} onChange={(e) => setForm({ ...form, dosis: e.target.value })} />
            </div>
            <div>
              <label className="label">Fecha de aplicación</label>
              <input type="date" className="input" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div>
              <label className="label">Lote</label>
              <input className="input" placeholder="Opcional" value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} />
            </div>
            <div>
              <label className="label">Próxima dosis</label>
              <div className="flex gap-1">
                <input type="date" className="input" value={form.proxima} onChange={(e) => setForm({ ...form, proxima: e.target.value })} />
                <button type="button" onClick={autoProxima} title="Sugerir según esquema" className="shrink-0 rounded-lg border border-slate-200 px-2 text-slate-500 hover:bg-brand-50 hover:text-brand-600"><CalendarClock size={16} /></button>
              </div>
            </div>
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
