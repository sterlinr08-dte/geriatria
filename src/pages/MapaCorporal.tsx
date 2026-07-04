import { useEffect, useMemo, useState } from 'react'
import { PersonStanding, Printer, Save, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Cliente } from '../types'
import { fechaCorta, hoyISO } from '../lib/format'
import { ZONAS, NIVELES, nivelDef, zonaPorKey, DESCARGO_MAPA, NivelKey } from '../lib/mapaCorporal'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import Modal from '../components/Modal'
import SelectorPaciente from '../components/SelectorPaciente'
import MapaCorporal2D from './MapaCorporal2D'

interface Registro { nivel: NivelKey; sintomas: string[]; nota: string }
const vacio: Registro = { nivel: 'sin', sintomas: [], nota: '' }

export default function MapaCorporal({ pacienteFijo }: { pacienteFijo?: string } = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pacienteId, setPacienteId] = useState<string>(pacienteFijo ?? '')
  const [estado, setEstado] = useState<Record<string, Registro>>({})
  const [loading, setLoading] = useState(false)
  const [zonaSel, setZonaSel] = useState<string | null>(null)
  const [form, setForm] = useState<Registro>(vacio)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (pacienteFijo != null) return
    supabase.from('clientes').select('*').order('nombre').then(({ data }) => setClientes(data ?? []))
  }, [pacienteFijo])
  useEffect(() => { if (pacienteFijo != null) setPacienteId(pacienteFijo) }, [pacienteFijo])

  async function cargar(pid: string) {
    setLoading(true)
    const { data } = await supabase.from('mapa_corporal').select('*').eq('cliente_id', pid)
    const m: Record<string, Registro> = {}
    ;(data ?? []).forEach((r: any) => {
      m[r.zona] = { nivel: (r.nivel ?? 'sin') as NivelKey, sintomas: Array.isArray(r.sintomas) ? r.sintomas : [], nota: r.nota ?? '' }
    })
    setEstado(m)
    setLoading(false)
  }
  useEffect(() => {
    if (!pacienteId) { setEstado({}); return }
    cargar(pacienteId)
  }, [pacienteId])

  const niveles = useMemo(() => {
    const m: Record<string, NivelKey> = {}
    Object.entries(estado).forEach(([k, r]) => { m[k] = r.nivel })
    return m
  }, [estado])

  function abrir(zonaKey: string) {
    setZonaSel(zonaKey)
    setForm(estado[zonaKey] ?? vacio)
  }
  function toggleSintoma(s: string) {
    setForm((f) => ({ ...f, sintomas: f.sintomas.includes(s) ? f.sintomas.filter((x) => x !== s) : [...f.sintomas, s] }))
  }
  async function guardar() {
    if (!zonaSel || !pacienteId) return
    setSaving(true)
    const payload = {
      cliente_id: pacienteId, zona: zonaSel, nivel: form.nivel,
      sintomas: form.sintomas, nota: form.nota || null, updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('mapa_corporal').upsert(payload, { onConflict: 'cliente_id,zona' })
    setSaving(false)
    if (error) return alert('Error al guardar: ' + error.message)
    setEstado((prev) => ({ ...prev, [zonaSel]: { nivel: form.nivel, sintomas: form.sintomas, nota: form.nota } }))
    setZonaSel(null)
  }

  const paciente = clientes.find((c) => c.id === pacienteId)
  const conAlteraciones = ZONAS.filter((z) => (estado[z.key]?.nivel ?? 'sin') !== 'sin')

  function imprimir() {
    // Figura del cuerpo con las zonas encendidas (para el reporte)
    const marcas = conAlteraciones.map((z) => {
      const nd = nivelDef(estado[z.key]!.nivel)
      return `<span style="position:absolute;left:${z.pos[0]}%;top:${z.pos[1]}%;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;background:${nd.color}66;border:2px solid ${nd.color}"></span>`
    }).join('')
    const figura = `<div style="position:relative;width:230px;margin:0 auto 14px"><img src="/cuerpo-geriatria.png" style="width:100%;display:block;max-height:none">${marcas}</div>`

    const filas = conAlteraciones.map((z) => {
      const r = estado[z.key]!; const nd = nivelDef(r.nivel)
      return `<tr>
        <td><b>${z.num}. ${z.nombre}</b></td>
        <td><span style="display:inline-block;padding:2px 8px;border-radius:99px;background:${nd.color}22;color:${nd.color};font-weight:700;font-size:11px">${nd.label}</span></td>
        <td>${r.sintomas.length ? r.sintomas.join(', ') : '—'}${r.nota ? `<br><span style="color:#64748b">${r.nota}</span>` : ''}</td>
      </tr>`
    }).join('')

    const w = window.open('', '_blank'); if (!w) return
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
      <title>Mapa del cuerpo humano — Evaluación Geriátrica Integral</title>
      <style>
        body{font-family:system-ui,-apple-system,Arial,sans-serif;color:#1e293b;margin:32px}
        h1{font-size:18px;margin:0 0 2px;color:#1e3a8a;text-align:center}
        .st{font-size:13px;color:#475569;text-align:center;margin-bottom:2px}
        .sub{color:#64748b;font-size:13px;text-align:center;margin-bottom:14px}
        .fig{position:relative;width:230px;margin:0 auto 14px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;vertical-align:top}
        th{background:#eef4fa;color:#3a5c82;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
        .pie{margin-top:20px;color:#94a3b8;font-size:11px;text-align:center}
      </style></head><body>
      <h1>MAPA DEL CUERPO HUMANO</h1>
      <div class="st">Evaluación Geriátrica Integral</div>
      <div class="sub">${paciente?.nombre ?? ''}${paciente?.cedula ? ' · Céd. ' + paciente.cedula : ''} · ${fechaCorta(hoyISO())}</div>
      ${conAlteraciones.length ? figura : ''}
      <table><thead><tr><th>Zona</th><th>Nivel de alerta</th><th>Hallazgos</th></tr></thead>
      <tbody>${filas || '<tr><td colspan="3" style="color:#94a3b8">Sin alteraciones registradas.</td></tr>'}</tbody></table>
      <div class="pie">${DESCARGO_MAPA}</div>
      </body></html>`)
    w.document.close(); w.focus(); w.print()
  }

  return (
    <div>
      {!pacienteFijo && (
        <>
          <PageHeader title="Mapa del cuerpo humano" subtitle="Evaluación Geriátrica Integral por zonas" />
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
      ) : loading ? (
        <Cargando />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500">Toca una zona del cuerpo o de la lista para registrar hallazgos.</p>
            <button className="btn-ghost" onClick={imprimir}><Printer size={16} /> Reporte</button>
          </div>

          {/* Cuerpo del paciente (figura 2D del adulto mayor) */}
          <MapaCorporal2D niveles={niveles} onSelect={abrir} />

          {/* Leyenda de niveles */}
          <div className="flex flex-wrap gap-2">
            {NIVELES.map((n) => (
              <span key={n.key} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: n.color }} /> {n.label}
              </span>
            ))}
          </div>

          {/* Lista de zonas */}
          <div className="grid gap-2 sm:grid-cols-2">
            {ZONAS.map((z) => {
              const r = estado[z.key]; const nd = nivelDef(r?.nivel)
              const activa = (r?.nivel ?? 'sin') !== 'sin'
              return (
                <button key={z.key} onClick={() => abrir(z.key)}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left transition hover:border-brand-200 hover:bg-brand-50/40">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: z.color }}>{z.num}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{z.nombre}</span>
                    {activa
                      ? <span className="text-xs" style={{ color: nd.color }}>{nd.label}{r?.sintomas.length ? ` · ${r.sintomas.length} hallazgo(s)` : ''}</span>
                      : <span className="text-xs text-slate-400">Sin registrar</span>}
                  </span>
                  {activa && <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: nd.color }} />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Editor de zona */}
      <Modal
        open={!!zonaSel}
        title={zonaSel ? `${zonaPorKey(zonaSel)?.num}. ${zonaPorKey(zonaSel)?.nombre}` : ''}
        onClose={() => setZonaSel(null)}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setZonaSel(null)}>Cancelar</button>
            <button className="btn-primary" onClick={guardar} disabled={saving}><Save size={16} /> {saving ? 'Guardando…' : 'Guardar'}</button>
          </>
        }
      >
        {zonaSel && (
          <div className="space-y-4">
            {/* Nivel de alerta */}
            <div>
              <label className="label">Nivel de alerta</label>
              <div className="grid grid-cols-2 gap-2">
                {NIVELES.map((n) => {
                  const sel = form.nivel === n.key
                  return (
                    <button key={n.key} type="button" onClick={() => setForm((f) => ({ ...f, nivel: n.key }))}
                      className="flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition"
                      style={sel ? { borderColor: n.color, background: n.color + '18', color: n.color } : { borderColor: '#e2e8f0', color: '#64748b' }}>
                      <span className="inline-block h-3 w-3 rounded-full" style={{ background: n.color }} />
                      {n.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1 text-xs text-slate-400">{nivelDef(form.nivel).descripcion}</p>
            </div>

            {/* Síntomas / hallazgos */}
            <div>
              <label className="label">Hallazgos</label>
              <div className="flex flex-wrap gap-1.5">
                {zonaPorKey(zonaSel)!.sintomas.map((s) => {
                  const on = form.sintomas.includes(s)
                  return (
                    <button key={s} type="button" onClick={() => toggleSintoma(s)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                        on ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50'
                      }`}>
                      {on && <Check size={12} />} {s}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Nota */}
            <div>
              <label className="label">Nota / observación</label>
              <textarea className="input" rows={2} value={form.nota} onChange={(e) => setForm((f) => ({ ...f, nota: e.target.value }))} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
