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

// Ubicación sugerida (x,y en % + vista) de un diagnóstico sobre la figura.
type Ubic = { x: number; y: number; vista: Vista }
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const norm = (s?: string | null) => (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Posición base por sistema (vista frontal), si no hay coincidencia por palabra.
const POS_GRUPO: Record<string, [number, number]> = {
  'Cardiovascular': [56, 30],
  'Respiratorio': [44, 30],
  'Neurológico / mental': [50, 7],
  'Endocrino / metabólico': [50, 40],
  'Digestivo': [50, 43],
  'Genitourinario / renal': [50, 49],
  'Musculoesquelético': [58, 62],
  'Síndromes geriátricos': [50, 40],
  'Hematológico': [48, 40],
  'Sensorial': [53, 8],
}

function porTexto(t: string): Ubic | null {
  const F = (x: number, y: number): Ubic => ({ x, y, vista: 'frontal' })
  const P = (x: number, y: number): Ubic => ({ x, y, vista: 'posterior' })
  // Espalda (vista posterior)
  if (/dorsal|torac/.test(t)) return P(50, 32)
  if (/sacro|escara|ulcera por presion|ulceras por presion/.test(t)) return P(50, 48)
  if (/lumbalg|lumbar|columna|espalda/.test(t)) return P(50, 42)
  // Frontal
  if (/cabeza|cerebr|demenc|alzh|parkins|cognitiv|animo|depres|insomn|epileps|neuralg|ansiedad/.test(t)) return F(50, 7)
  if (/mareo|vertigo/.test(t)) return F(50, 9)
  if (/ojo|vista|visual|catarat|glaucoma/.test(t)) return F(53, 8)
  if (/oido|auditiv|hipoacus|zumbid/.test(t)) return F(58, 9)
  if (/boca|dental|dient|masticar|disfag|tragar|garganta|bucal/.test(t)) return F(50, 12)
  if (/tiroid|bocio/.test(t)) return F(50, 16)
  if (/coraz|cardi|hipertens|presion|palpit|arritmi|fibrilac|angina|isquemic/.test(t)) return F(56, 30)
  if (/pulm|respir|epoc|asma|\btos\b|neumon|bronqui|sibilanc/.test(t)) return F(44, 30)
  if (/higado|hepat|vesicula|biliar/.test(t)) return F(57, 40)
  if (/estomag|gastric|reflujo|nausea|dispep|ulcera gastr/.test(t)) return F(50, 39)
  if (/intestin|colon|estrenim|diarrea|abdom|digest/.test(t)) return F(50, 44)
  if (/rinon|renal/.test(t)) return F(58, 41)
  if (/prostata/.test(t)) return F(50, 50)
  if (/vejig|urin|orin|incontinenc/.test(t)) return F(50, 49)
  if (/rodilla|gonartros/.test(t)) return F(58, 66)
  if (/cadera|femur|coxartros/.test(t)) return F(58, 52)
  if (/hombro|clavicul/.test(t)) return F(66, 26)
  if (/mano|muneca|dedo/.test(t)) return F(72, 50)
  if (/codo|antebrazo/.test(t)) return F(70, 40)
  if (/pie|pies|tobillo|hongo|juanete/.test(t)) return F(56, 92)
  if (/pierna|gemelo|pantorr|varice|edema/.test(t)) return F(45, 78)
  if (/artros|artrit|articul|osteoporos|fractura|reumat|sarcopenia/.test(t)) return F(58, 60)
  if (/piel|dermat|herida|lesion/.test(t)) return F(42, 50)
  if (/anemia|hemat|vitamin/.test(t)) return F(48, 40)
  if (/caid/.test(t)) return F(45, 72)
  return null
}

function ubicacionSugerida(codigo: string | null, descripcion: string | null, grupo: string | undefined, i: number): Ubic {
  const t = norm(`${codigo ?? ''} ${descripcion ?? ''}`)
  let u = porTexto(t)
  if (!u && grupo && POS_GRUPO[grupo]) u = { x: POS_GRUPO[grupo][0], y: POS_GRUPO[grupo][1], vista: 'frontal' }
  if (!u) u = { x: 50, y: 42, vista: 'frontal' }
  const jx = ((i % 3) - 1) * 4
  const jy = Math.floor(i / 3) * 4
  return { x: clamp(u.x + jx, 6, 94), y: clamp(u.y + jy, 4, 94), vista: u.vista }
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
        const u = ubicacionSugerida(p.codigo, p.descripcion, grupoPorCodigo(p.codigo), autos.length + i)
        return { cliente_id: pid, x: u.x, y: u.y, nivel: p.cronico ? 'moderado' : 'leve', texto: p.descripcion, vista: u.vista, origen: 'auto', codigo: p.codigo }
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
