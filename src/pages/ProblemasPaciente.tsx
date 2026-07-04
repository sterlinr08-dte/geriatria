import { useEffect, useMemo, useState } from 'react'
import { ListChecks, Plus, Pencil, Trash2, Save, Check, RotateCcw, Search, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Cliente } from '../types'
import { fechaCorta, hoyISO } from '../lib/format'
import { buscarCIE10, CodigoCIE10 } from '../lib/cie10'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import Modal from '../components/Modal'
import SelectorPaciente from '../components/SelectorPaciente'

interface Problema {
  id: string
  cliente_id: string
  codigo: string | null
  descripcion: string
  cronico: boolean
  fecha_inicio: string | null
  fecha_resolucion: string | null
  activo: boolean
  notas: string | null
}

const vacio = { codigo: '', descripcion: '', cronico: false, fecha_inicio: hoyISO(), notas: '' }

export default function ProblemasPaciente({ pacienteFijo }: { pacienteFijo?: string } = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pacienteId, setPacienteId] = useState<string>(pacienteFijo ?? '')
  const [items, setItems] = useState<Problema[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(vacio)
  const [busca, setBusca] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('clientes').select('*').order('nombre').then(({ data }) => setClientes(data ?? []))
  }, [])
  useEffect(() => { if (pacienteFijo != null) setPacienteId(pacienteFijo) }, [pacienteFijo])

  async function cargar(pid: string) {
    setLoading(true)
    const { data } = await supabase.from('problemas_paciente').select('*')
      .eq('cliente_id', pid).order('activo', { ascending: false }).order('fecha_inicio', { ascending: false })
    setItems((data as Problema[]) ?? [])
    setLoading(false)
  }
  useEffect(() => {
    if (!pacienteId) { setItems([]); return }
    cargar(pacienteId)
  }, [pacienteId])

  function nuevo() { setEditId(null); setForm({ ...vacio, fecha_inicio: hoyISO() }); setBusca(''); setOpen(true) }
  function editar(p: Problema) {
    setEditId(p.id)
    setForm({ codigo: p.codigo ?? '', descripcion: p.descripcion, cronico: p.cronico, fecha_inicio: p.fecha_inicio ?? hoyISO(), notas: p.notas ?? '' })
    setBusca(''); setOpen(true)
  }
  function elegir(c: CodigoCIE10) {
    setForm((f) => ({ ...f, codigo: c.codigo, descripcion: c.descripcion }))
    setBusca('')
  }
  async function guardar() {
    if (!form.descripcion.trim()) return alert('Escribe o selecciona el diagnóstico.')
    setSaving(true)
    const payload = {
      cliente_id: pacienteId,
      codigo: form.codigo.trim() || null, descripcion: form.descripcion.trim(),
      cronico: form.cronico, fecha_inicio: form.fecha_inicio || null, notas: form.notas || null,
    }
    const { error } = editId
      ? await supabase.from('problemas_paciente').update(payload).eq('id', editId)
      : await supabase.from('problemas_paciente').insert(payload)
    setSaving(false)
    if (error) return alert('Error al guardar: ' + error.message)
    setOpen(false); cargar(pacienteId)
  }
  async function resolver(p: Problema) {
    await supabase.from('problemas_paciente')
      .update({ activo: !p.activo, fecha_resolucion: p.activo ? hoyISO() : null }).eq('id', p.id)
    cargar(pacienteId)
  }
  async function eliminar(p: Problema) {
    if (!confirm(`¿Eliminar "${p.descripcion}" de la lista de problemas?`)) return
    await supabase.from('problemas_paciente').delete().eq('id', p.id)
    cargar(pacienteId)
  }

  const activos = items.filter((p) => p.activo)
  const resueltos = items.filter((p) => !p.activo)
  const sugerencias = useMemo(() => buscarCIE10(busca), [busca])
  const paciente = clientes.find((c) => c.id === pacienteId)

  function imprimir() {
    const filas = (arr: Problema[]) => arr.map((p) => `
      <tr>
        <td style="white-space:nowrap">${p.codigo ?? '—'}</td>
        <td>${p.descripcion}${p.cronico ? ' <b>(crónico)</b>' : ''}${p.notas ? `<br><span style="color:#64748b">${p.notas}</span>` : ''}</td>
        <td style="white-space:nowrap">${p.fecha_inicio ? fechaCorta(p.fecha_inicio) : '—'}</td>
        <td style="white-space:nowrap">${p.activo ? 'Activo' : 'Resuelto' + (p.fecha_resolucion ? ' · ' + fechaCorta(p.fecha_resolucion) : '')}</td>
      </tr>`).join('')
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
      <title>Lista de problemas</title>
      <style>
        body{font-family:system-ui,-apple-system,Arial,sans-serif;color:#1e293b;margin:32px}
        h1{font-size:18px;margin:0 0 2px;color:#3a5c82}
        h2{font-size:13px;margin:18px 0 6px;color:#456f9c;text-transform:uppercase;letter-spacing:.04em}
        .sub{color:#64748b;font-size:13px;margin-bottom:6px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;vertical-align:top}
        th{background:#eef4fa;color:#3a5c82;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
        .pie{margin-top:24px;color:#94a3b8;font-size:11px}
      </style></head><body>
      <h1>Lista de problemas / diagnósticos</h1>
      <div class="sub">${paciente?.nombre ?? ''}${paciente?.cedula ? ' · Céd. ' + paciente.cedula : ''}</div>
      <h2>Problemas activos (${activos.length})</h2>
      <table><thead><tr><th>CIE-10</th><th>Diagnóstico</th><th>Desde</th><th>Estado</th></tr></thead>
      <tbody>${activos.length ? filas(activos) : '<tr><td colspan="4" style="color:#94a3b8">Sin problemas activos.</td></tr>'}</tbody></table>
      ${resueltos.length ? `<h2>Resueltos (${resueltos.length})</h2>
      <table><thead><tr><th>CIE-10</th><th>Diagnóstico</th><th>Desde</th><th>Estado</th></tr></thead>
      <tbody>${filas(resueltos)}</tbody></table>` : ''}
      <div class="pie">Impreso el ${fechaCorta(hoyISO())} · Codificación CIE-10.</div>
      </body></html>`)
    w.document.close(); w.focus(); w.print()
  }

  return (
    <div>
      {!pacienteFijo && (
        <>
          <PageHeader title="Lista de problemas" subtitle="Diagnósticos activos y resueltos (CIE-10)" />
          <div className="card mb-6 max-w-md">
            <label className="label">Paciente</label>
            <SelectorPaciente clientes={clientes} value={pacienteId} onChange={setPacienteId} />
          </div>
        </>
      )}

      {!pacienteId ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <ListChecks className="text-brand-300" size={40} />
          <p className="text-slate-500">Selecciona un paciente para ver su lista de problemas.</p>
        </div>
      ) : loading ? (
        <Cargando />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge bg-brand-50 text-brand-700">{activos.length} activo(s)</span>
              {resueltos.length > 0 && <span className="badge bg-slate-100 text-slate-500">{resueltos.length} resuelto(s)</span>}
            </div>
            <div className="flex gap-2">
              {items.length > 0 && (
                <button className="btn-ghost" onClick={imprimir}><Printer size={16} /> Imprimir</button>
              )}
              <button className="btn-primary" onClick={nuevo}><Plus size={16} /> Agregar diagnóstico</button>
            </div>
          </div>

          {activos.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-10 text-center">
              <ListChecks className="text-brand-300" size={36} />
              <p className="text-slate-500">Sin problemas activos registrados.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activos.map((p) => (
                <div key={p.id} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">
                        {p.codigo && <span className="mr-2 rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-bold text-brand-700">{p.codigo}</span>}
                        {p.descripcion}
                        {p.cronico && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Crónico</span>}
                      </p>
                      {p.fecha_inicio && <p className="text-xs text-slate-400">Desde {fechaCorta(p.fecha_inicio)}</p>}
                      {p.notas && <p className="mt-0.5 text-xs text-slate-500">{p.notas}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => resolver(p)} title="Marcar resuelto" className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"><Check size={15} /></button>
                      <button onClick={() => editar(p)} title="Editar" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"><Pencil size={15} /></button>
                      <button onClick={() => eliminar(p)} title="Eliminar" className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resueltos.length > 0 && (
            <div>
              <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Resueltos ({resueltos.length})</h3>
              <div className="space-y-2">
                {resueltos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2">
                    <span className="min-w-0 truncate text-sm text-slate-500">
                      {p.codigo && <span className="mr-1.5 font-semibold">{p.codigo}</span>}
                      <span className="line-through">{p.descripcion}</span>
                      {p.fecha_resolucion && <span className="ml-1.5 text-xs text-slate-400">· {fechaCorta(p.fecha_resolucion)}</span>}
                    </span>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => resolver(p)} title="Reactivar" className="rounded-lg p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-600"><RotateCcw size={15} /></button>
                      <button onClick={() => eliminar(p)} title="Eliminar" className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
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
        title={editId ? 'Editar diagnóstico' : 'Agregar diagnóstico'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={guardar} disabled={saving}><Save size={16} /> {saving ? 'Guardando…' : 'Guardar'}</button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Buscador CIE-10 */}
          <div>
            <label className="label">Buscar en CIE-10</label>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" placeholder="Ej. diabetes, I10, caídas, demencia…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            {sugerencias.length > 0 && (
              <ul className="mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-100">
                {sugerencias.map((c) => (
                  <li key={c.codigo}>
                    <button type="button" onClick={() => elegir(c)} className="flex w-full items-start gap-2 border-b border-slate-50 px-3 py-2 text-left text-sm hover:bg-brand-50">
                      <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-bold text-brand-700">{c.codigo}</span>
                      <span className="min-w-0"><span className="text-slate-700">{c.descripcion}</span> <span className="text-xs text-slate-400">· {c.grupo}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Código CIE-10</label>
              <input className="input" placeholder="Opcional" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Fecha de diagnóstico</label>
              <input type="date" className="input" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Diagnóstico</label>
            <input className="input" placeholder="Descripción del problema" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" checked={form.cronico} onChange={(e) => setForm({ ...form, cronico: e.target.checked })} />
            Condición crónica
          </label>
          <div>
            <label className="label">Notas</label>
            <textarea className="input" rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
