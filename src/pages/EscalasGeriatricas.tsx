import { useEffect, useState } from 'react'
import { ClipboardList, Plus, Save, History, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Cliente } from '../types'
import { hoyISO, fechaCorta } from '../lib/format'
import { ESCALAS, TONOS_ESCALA, DefEscala } from '../lib/escalas'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import Modal from '../components/Modal'
import SelectorPaciente from '../components/SelectorPaciente'

interface Resultado {
  id: string
  escala: string
  fecha: string
  puntaje: number
  interpretacion: string | null
  detalle: any
  created_at: string
}

export default function EscalasGeriatricas({ pacienteFijo }: { pacienteFijo?: string } = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pacienteId, setPacienteId] = useState<string>(pacienteFijo ?? '')
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [loading, setLoading] = useState(false)

  const [activa, setActiva] = useState<DefEscala | null>(null)
  const [respuestas, setRespuestas] = useState<(number | null)[]>([])
  const [fecha, setFecha] = useState(hoyISO())
  const [saving, setSaving] = useState(false)
  const [historialDe, setHistorialDe] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('clientes').select('*').order('nombre').then(({ data }) => setClientes(data ?? []))
  }, [])
  useEffect(() => { if (pacienteFijo != null) setPacienteId(pacienteFijo) }, [pacienteFijo])

  async function cargar(pid: string) {
    setLoading(true)
    const { data } = await supabase.from('escala_resultados').select('*')
      .eq('cliente_id', pid).order('fecha', { ascending: false }).order('created_at', { ascending: false })
    setResultados((data as Resultado[]) ?? [])
    setLoading(false)
  }
  useEffect(() => {
    if (!pacienteId) { setResultados([]); return }
    cargar(pacienteId)
  }, [pacienteId])

  function abrir(esc: DefEscala) {
    setActiva(esc)
    setRespuestas(esc.items.map(() => null))
    setFecha(hoyISO())
  }

  function calcTotal(esc: DefEscala, resp: (number | null)[]): number {
    return esc.items.reduce((s, it, i) => {
      const r = resp[i]
      return r == null ? s : s + it.opciones[r].puntos
    }, 0)
  }
  const total = activa ? calcTotal(activa, respuestas) : 0
  const completa = activa ? respuestas.every((r) => r != null) : false
  const interp = activa && completa ? activa.interpretar(total) : null

  async function guardar() {
    if (!activa || !completa || !pacienteId) return
    setSaving(true)
    const detalle = activa.items.map((it, i) => ({
      item: it.texto,
      opcion: it.opciones[respuestas[i]!].label,
      puntos: it.opciones[respuestas[i]!].puntos,
    }))
    const { error } = await supabase.from('escala_resultados').insert({
      cliente_id: pacienteId, escala: activa.key, fecha,
      puntaje: total, interpretacion: interp?.texto ?? null, detalle,
    })
    setSaving(false)
    if (error) return alert('Error al guardar: ' + error.message)
    setActiva(null)
    cargar(pacienteId)
  }

  const ultimo = (key: string) => resultados.find((r) => r.escala === key)
  const historial = (key: string) => resultados.filter((r) => r.escala === key)

  return (
    <div>
      {!pacienteFijo && (
        <>
          <PageHeader title="Escalas geriátricas" subtitle="Cuestionarios con cálculo automático" />
          <div className="card mb-6 max-w-md">
            <label className="label">Paciente</label>
            <SelectorPaciente clientes={clientes} value={pacienteId} onChange={setPacienteId} />
          </div>
        </>
      )}

      {!pacienteId ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <ClipboardList className="text-brand-300" size={40} />
          <p className="text-slate-500">Selecciona un paciente para aplicar sus escalas.</p>
        </div>
      ) : loading ? (
        <Cargando />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ESCALAS.map((esc) => {
            const u = ultimo(esc.key)
            const abierto = historialDe === esc.key
            const hist = historial(esc.key)
            return (
              <div key={esc.key} className="card flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-slate-800">{esc.sigla ?? esc.nombre}</h3>
                    <p className="text-xs text-slate-500">{esc.dominio}</p>
                  </div>
                  <button className="btn-primary shrink-0 !px-3 !py-1.5 text-xs" onClick={() => abrir(esc)}>
                    <Plus size={14} /> Aplicar
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">{esc.descripcion}</p>

                {u ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-lg font-bold text-slate-800">{u.puntaje}</span>
                    {u.interpretacion && <IntBadge escala={esc} puntaje={u.puntaje} texto={u.interpretacion} />}
                    <span className="ml-auto text-xs text-slate-400">{fechaCorta(u.fecha)}</span>
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-400">Aún no aplicada.</p>
                )}

                {hist.length > 1 && (
                  <div className="mt-2">
                    <button onClick={() => setHistorialDe(abierto ? null : esc.key)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
                      <History size={13} /> Historial ({hist.length}) <ChevronDown size={13} className={abierto ? 'rotate-180 transition' : 'transition'} />
                    </button>
                    {abierto && (
                      <ul className="mt-1 space-y-1">
                        {hist.map((r) => (
                          <li key={r.id} className="flex items-center gap-2 border-b border-slate-50 py-1 text-xs">
                            <span className="text-slate-400">{fechaCorta(r.fecha)}</span>
                            <span className="font-semibold text-slate-700">{r.puntaje}</span>
                            <span className="text-slate-500">{r.interpretacion}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal del cuestionario */}
      <Modal
        open={!!activa}
        title={activa?.nombre ?? ''}
        onClose={() => setActiva(null)}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setActiva(null)}>Cancelar</button>
            <button className="btn-primary" onClick={guardar} disabled={!completa || saving}>
              <Save size={16} /> {saving ? 'Guardando…' : 'Guardar resultado'}
            </button>
          </>
        }
      >
        {activa && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="label">Fecha</label>
                <input type="date" className="input w-44" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-slate-400">Puntaje</p>
                <p className="text-2xl font-bold text-brand-700">{total}</p>
              </div>
            </div>
            {interp && (
              <div className={`rounded-xl px-3 py-2 text-sm font-semibold ${TONOS_ESCALA[interp.tono]}`}>{interp.texto}</div>
            )}
            {!completa && <p className="text-xs text-amber-600">Responde todos los ítems para calcular e interpretar.</p>}

            <ol className="space-y-3">
              {activa.items.map((it, i) => (
                <li key={i} className="rounded-xl border border-slate-100 p-3">
                  <p className="mb-2 text-sm font-medium text-slate-700"><span className="text-slate-400">{i + 1}.</span> {it.texto}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {it.opciones.map((op, j) => {
                      const sel = respuestas[i] === j
                      return (
                        <button
                          key={j}
                          type="button"
                          onClick={() => setRespuestas((prev) => prev.map((v, k) => (k === i ? j : v)))}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                            sel ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50'
                          }`}
                        >
                          {op.label} <span className={sel ? 'text-white/70' : 'text-slate-400'}>({op.puntos})</span>
                        </button>
                      )
                    })}
                  </div>
                </li>
              ))}
            </ol>

            {activa.nota && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{activa.nota}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}

function IntBadge({ escala, puntaje, texto }: { escala: DefEscala; puntaje: number; texto: string }) {
  const tono = escala.interpretar(Number(puntaje)).tono
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONOS_ESCALA[tono]}`}>{texto}</span>
}
