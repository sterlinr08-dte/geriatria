import { useEffect, useState } from 'react'
import { PersonStanding, Printer, Save, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Cliente } from '../types'
import { fechaCorta, hoyISO } from '../lib/format'
import { NIVELES, nivelDef, figura as figuraSrc, sexoKey, TIENE_ESPALDA, DESCARGO_MAPA, NivelKey, Vista } from '../lib/mapaCorporal'
import { grupoPorCodigo } from '../lib/cie10'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import Modal from '../components/Modal'
import SelectorPaciente from '../components/SelectorPaciente'
import MapaCorporal2D, { Marca } from './MapaCorporal2D'

// Posición aproximada (x,y en %) en la figura frontal según el sistema del diagnóstico.
const POS_GRUPO: Record<string, [number, number]> = {
  'Cardiovascular': [56, 33],
  'Respiratorio': [44, 33],
  'Neurológico / mental': [50, 8],
  'Endocrino / metabólico': [50, 20],
  'Digestivo': [50, 44],
  'Genitourinario / renal': [50, 50],
  'Musculoesquelético': [62, 62],
  'Síndromes geriátricos': [50, 40],
  'Hematológico': [48, 40],
  'Sensorial': [54, 9],
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
function posPorTexto(d?: string | null): [number, number] | null {
  const t = (d ?? '').toLowerCase()
  if (/cabeza|cerebr|demenc|alzh|parkins|cognitiv|[aá]nimo|depres|insomn|mareo|v[eé]rtigo/.test(t)) return [50, 8]
  if (/ojo|vista|visual|catarat|glaucoma/.test(t)) return [54, 9]
  if (/o[ií]do|auditiv|hipoacus|zumbid/.test(t)) return [46, 9]
  if (/coraz|card[ií]|hipertens|presi[oó]n|palpit/.test(t)) return [56, 33]
  if (/pulm|respir|epoc|asma|\btos\b|neumon/.test(t)) return [44, 33]
  if (/abdom|digest|est[oó]mag|g[aá]stric|intestin|estre[nñ]im|h[ií]gado/.test(t)) return [50, 44]
  if (/ri[nñ][oó]n|renal|urin|vejig|pr[oó]stata/.test(t)) return [50, 50]
  if (/rodilla/.test(t)) return [60, 64]
  if (/cadera|f[eé]mur/.test(t)) return [58, 52]
  if (/columna|lumbar|espalda|dorsal/.test(t)) return [50, 40]
  if (/\bpie\b|pies|tobillo/.test(t)) return [58, 90]
  if (/mano|mu[nñ]eca|hombro|brazo|codo/.test(t)) return [30, 40]
  if (/piel|[uú]lcera|herida|escara/.test(t)) return [40, 55]
  return null
}
function posicionSugerida(codigo: string | null, descripcion: string | null, i: number): [number, number] {
  const base = POS_GRUPO[grupoPorCodigo(codigo) ?? ''] ?? posPorTexto(descripcion) ?? [50, 42]
  const jx = ((i % 3) - 1) * 5
  const jy = Math.floor(i / 3) * 5
  return [clamp(base[0] + jx, 6, 94), clamp(base[1] + jy, 4, 94)]
}

export default function MapaCorporal({ pacienteFijo }: { pacienteFijo?: string } = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pacienteId, setPacienteId] = useState<string>(pacienteFijo ?? '')
  const [paciente, setPaciente] = useState<Cliente | null>(null)
  const [marcadores, setMarcadores] = useState<Marca[]>([])
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<{ nivel: NivelKey; texto: string }>({ nivel: 'moderado', texto: '' })
  const [saving, setSaving] = useState(false)
  const [vista, setVista] = useState<Vista>('frontal')

  useEffect(() => {
    if (pacienteFijo != null) return
    supabase.from('clientes').select('*').order('nombre').then(({ data }) => setClientes(data ?? []))
  }, [pacienteFijo])
  useEffect(() => { if (pacienteFijo != null) setPacienteId(pacienteFijo) }, [pacienteFijo])

  async function cargar(pid: string) {
    setLoading(true)
    const [{ data: c }, { data: ms }, { data: probs }] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', pid).single(),
      supabase.from('mapa_marcadores').select('*').eq('cliente_id', pid).order('created_at'),
      supabase.from('problemas_paciente').select('codigo,descripcion,cronico,activo').eq('cliente_id', pid),
    ])
    let marcs = (ms as Marca[]) ?? []

    // Sincronización automática: los diagnósticos activos (CIE-10) aparecen solos
    // como puntos 'auto'; si un diagnóstico se resuelve/quita, su punto se borra.
    // Los puntos que el médico pone a mano ('manual') no se tocan.
    const clave = (codigo?: string | null, texto?: string | null) => (codigo?.trim() || texto?.trim() || '').toLowerCase()
    const activos = ((probs as any[]) ?? []).filter((p) => p.activo)
    const autos = marcs.filter((m) => m.origen === 'auto')
    const activosClaves = new Map(activos.map((p) => [clave(p.codigo, p.descripcion), p]))
    const autoClaves = new Set(autos.map((m) => clave(m.codigo, m.texto)))

    const faltan = activos.filter((p) => !autoClaves.has(clave(p.codigo, p.descripcion)))
    const sobran = autos.filter((m) => !activosClaves.has(clave(m.codigo, m.texto)))

    let cambio = false
    if (faltan.length) {
      const filas = faltan.map((p, i) => {
        const [x, y] = posicionSugerida(p.codigo, p.descripcion, autos.length + i)
        return { cliente_id: pid, x, y, nivel: p.cronico ? 'moderado' : 'leve', texto: p.descripcion, vista: 'frontal', origen: 'auto', codigo: p.codigo }
      })
      await supabase.from('mapa_marcadores').insert(filas); cambio = true
    }
    if (sobran.length) {
      await supabase.from('mapa_marcadores').delete().in('id', sobran.map((m) => m.id)); cambio = true
    }
    if (cambio) {
      const { data: ms2 } = await supabase.from('mapa_marcadores').select('*').eq('cliente_id', pid).order('created_at')
      marcs = (ms2 as Marca[]) ?? []
    }

    setPaciente((c as Cliente) ?? null)
    setMarcadores(marcs)
    setLoading(false)
  }
  useEffect(() => {
    if (!pacienteId) { setMarcadores([]); setPaciente(null); return }
    cargar(pacienteId)
  }, [pacienteId])

  const sexKey = sexoKey(paciente?.sexo)
  const puedeEspalda = TIENE_ESPALDA[sexKey]
  // Si el sexo no tiene espalda, forzar vista frontal.
  useEffect(() => { if (!puedeEspalda && vista !== 'frontal') setVista('frontal') }, [puedeEspalda, vista])
  const src = figuraSrc(paciente?.sexo, vista)
  const marcadoresVista = marcadores.filter((m) => (m.vista ?? 'frontal') === vista)

  async function agregar(x: number, y: number) {
    const { data, error } = await supabase.from('mapa_marcadores')
      .insert({ cliente_id: pacienteId, x, y, nivel: 'moderado', texto: null, vista }).select().single()
    if (error) return alert('Error al agregar: ' + error.message)
    const m = data as Marca
    setMarcadores((prev) => [...prev, m])
    setEditId(m.id); setForm({ nivel: m.nivel, texto: '' })
  }
  async function mover(id: string, x: number, y: number) {
    setMarcadores((prev) => prev.map((m) => (m.id === id ? { ...m, x, y } : m)))
    await supabase.from('mapa_marcadores').update({ x, y, updated_at: new Date().toISOString() }).eq('id', id)
  }
  function abrir(id: string) {
    const m = marcadores.find((x) => x.id === id)
    if (!m) return
    setEditId(id); setForm({ nivel: m.nivel, texto: m.texto ?? '' })
  }
  async function guardar() {
    if (!editId) return
    setSaving(true)
    const { error } = await supabase.from('mapa_marcadores')
      .update({ nivel: form.nivel, texto: form.texto || null, updated_at: new Date().toISOString() }).eq('id', editId)
    setSaving(false)
    if (error) return alert('Error al guardar: ' + error.message)
    setMarcadores((prev) => prev.map((m) => (m.id === editId ? { ...m, nivel: form.nivel, texto: form.texto } : m)))
    setEditId(null)
  }
  async function eliminar() {
    if (!editId) return
    await supabase.from('mapa_marcadores').delete().eq('id', editId)
    setMarcadores((prev) => prev.filter((m) => m.id !== editId))
    setEditId(null)
  }

  function imprimir() {
    const bloque = (v: Vista) => {
      const ms = marcadores.filter((m) => (m.vista ?? 'frontal') === v)
      if (!ms.length) return ''
      const marcas = ms.map((m, i) => {
        const nd = nivelDef(m.nivel)
        return `<span style="position:absolute;left:${m.x}%;top:${m.y}%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:${nd.color};border:2px solid #fff;color:#fff;font:700 10px system-ui;display:flex;align-items:center;justify-content:center">${i + 1}</span>`
      }).join('')
      const fig = `<div style="position:relative;width:180px;flex:none"><img src="${figuraSrc(paciente?.sexo, v)}" style="width:100%;display:block">${marcas}</div>`
      const filas = ms.map((m, i) => {
        const nd = nivelDef(m.nivel)
        return `<tr>
          <td style="text-align:center;font-weight:700">${i + 1}</td>
          <td><span style="display:inline-block;padding:2px 8px;border-radius:99px;background:${nd.color}22;color:${nd.color};font-weight:700;font-size:11px">${nd.label}</span></td>
          <td>${m.texto ? m.texto.replace(/</g, '&lt;') : '—'}</td>
        </tr>`
      }).join('')
      return `<h2>Vista ${v === 'frontal' ? 'frontal' : 'posterior'}</h2>
        <div class="bloque">${fig}
          <table><thead><tr><th>#</th><th>Nivel</th><th>Hallazgo</th></tr></thead><tbody>${filas}</tbody></table>
        </div>`
    }
    const cuerpo = bloque('frontal') + bloque('posterior')
    const w = window.open('', '_blank'); if (!w) return
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
      <title>Mapa del cuerpo humano — Evaluación Geriátrica Integral</title>
      <style>
        body{font-family:system-ui,-apple-system,Arial,sans-serif;color:#1e293b;margin:32px}
        h1{font-size:18px;margin:0 0 2px;color:#1e3a8a;text-align:center}
        h2{font-size:13px;margin:18px 0 6px;color:#456f9c;text-transform:uppercase;letter-spacing:.04em}
        .st{font-size:13px;color:#475569;text-align:center;margin-bottom:2px}
        .sub{color:#64748b;font-size:13px;text-align:center;margin-bottom:14px}
        .bloque{display:flex;gap:16px;align-items:flex-start}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;vertical-align:top}
        th{background:#eef4fa;color:#3a5c82;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
        .pie{margin-top:20px;color:#94a3b8;font-size:11px;text-align:center}
      </style></head><body>
      <h1>MAPA DEL CUERPO HUMANO</h1>
      <div class="st">Evaluación Geriátrica Integral</div>
      <div class="sub">${paciente?.nombre ?? ''}${paciente?.cedula ? ' · Céd. ' + paciente.cedula : ''} · ${fechaCorta(hoyISO())}</div>
      ${cuerpo || '<p style="text-align:center;color:#94a3b8">Sin hallazgos registrados.</p>'}
      <div class="pie">${DESCARGO_MAPA}</div>
      </body></html>`)
    w.document.close(); w.focus(); w.print()
  }

  return (
    <div>
      {!pacienteFijo && (
        <>
          <PageHeader title="Mapa del cuerpo humano" subtitle="Evaluación Geriátrica Integral — marca los hallazgos" />
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
            <p className="text-sm text-slate-500">Los diagnósticos activos aparecen solos. Toca el cuerpo para agregar otro hallazgo; arrastra para mover, toca un punto para editarlo.</p>
            {marcadores.length > 0 && <button className="btn-ghost" onClick={imprimir}><Printer size={16} /> Reporte</button>}
          </div>

          {/* Vista frontal / posterior */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm font-semibold">
              {([['frontal', 'Frontal'], ['posterior', 'Posterior']] as [Vista, string][]).map(([v, lbl]) => {
                const disabled = v === 'posterior' && !puedeEspalda
                const activo = vista === v
                return (
                  <button key={v} disabled={disabled} onClick={() => setVista(v)}
                    title={disabled ? 'Espalda no disponible para esta figura' : ''}
                    className={`rounded-lg px-4 py-1.5 transition ${activo ? 'bg-brand-500 text-white shadow' : disabled ? 'text-slate-300' : 'text-slate-600 hover:bg-brand-50'}`}>
                    {lbl}
                  </button>
                )
              })}
            </div>
          </div>

          <MapaCorporal2D src={src} marcadores={marcadoresVista} onAdd={agregar} onMove={mover} onOpen={abrir} />

          {/* Leyenda de niveles */}
          <div className="flex flex-wrap gap-2">
            {NIVELES.map((n) => (
              <span key={n.key} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: n.color }} /> {n.label}
              </span>
            ))}
          </div>

        </div>
      )}

      {/* Editor del marcador */}
      <Modal
        open={!!editId}
        title="Hallazgo"
        onClose={() => setEditId(null)}
        footer={
          <>
            <button className="btn-ghost !text-rose-600" onClick={eliminar}><Trash2 size={16} /> Eliminar</button>
            <button className="btn-primary" onClick={guardar} disabled={saving}><Save size={16} /> {saving ? 'Guardando…' : 'Guardar'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nivel de alerta</label>
            <div className="grid grid-cols-3 gap-2">
              {NIVELES.map((n) => {
                const sel = form.nivel === n.key
                return (
                  <button key={n.key} type="button" onClick={() => setForm((f) => ({ ...f, nivel: n.key }))}
                    className="flex items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2 text-sm font-semibold transition"
                    style={sel ? { borderColor: n.color, background: n.color + '18', color: n.color } : { borderColor: '#e2e8f0', color: '#64748b' }}>
                    <span className="inline-block h-3 w-3 rounded-full" style={{ background: n.color }} /> {n.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="label">¿Qué le encontró al paciente?</label>
            <textarea className="input" rows={4} autoFocus placeholder="Ej. Dolor y limitación de movilidad en la mano derecha…"
              value={form.texto} onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
