import { useEffect, useState } from 'react'
import { LineChart, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Cliente, HistoriaEvolucion } from '../types'
import { fechaCorta } from '../lib/format'
import { ESCALAS } from '../lib/escalas'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import SelectorPaciente from '../components/SelectorPaciente'

interface Punto { t: string; v: number }
interface Serie { nombre?: string; color: string; puntos: Punto[] }

// ── Gráfico de línea liviano (SVG, sin dependencias) ──
// Una escala por gráfico (small multiples). Línea fina, puntos, etiqueta del último valor.
function MiniLinea({ titulo, unidad, series }: { titulo: string; unidad?: string; series: Serie[] }) {
  const W = 340, H = 130
  const padL = 30, padR = 44, padT = 14, padB = 22
  const todos = series.flatMap((s) => s.puntos.map((p) => p.v))
  if (todos.length === 0) return null
  let min = Math.min(...todos), max = Math.max(...todos)
  if (min === max) { min -= 1; max += 1 }
  const rango = max - min
  // eje x por índice (visitas equiespaciadas) usando la serie más larga
  const n = Math.max(...series.map((s) => s.puntos.length))
  const x = (i: number) => padL + (n <= 1 ? 0 : (i * (W - padL - padR)) / (n - 1))
  const y = (v: number) => padT + (1 - (v - min) / rango) * (H - padT - padB)
  const fechas = series.reduce((a, s) => (s.puntos.length > a.length ? s.puntos : a), [] as Punto[])

  return (
    <div className="card">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{titulo}{unidad ? ` (${unidad})` : ''}</h3>
        {series.length > 1 && (
          <div className="flex items-center gap-3 text-[11px]">
            {series.map((s) => (
              <span key={s.nombre} className="inline-flex items-center gap-1 text-slate-500">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.nombre}
              </span>
            ))}
          </div>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'auto' }} role="img" aria-label={titulo}>
        {/* Líneas guía horizontales (recesivas) */}
        {[0, 0.5, 1].map((f) => {
          const yy = padT + f * (H - padT - padB)
          const val = max - f * rango
          return (
            <g key={f}>
              <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#eef2f7" strokeWidth={1} />
              <text x={2} y={yy + 3} fontSize={9} fill="#94a3b8">{Math.round(val * 10) / 10}</text>
            </g>
          )
        })}
        {series.map((s, si) => {
          if (s.puntos.length === 0) return null
          const d = s.puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.v)}`).join(' ')
          const ult = s.puntos[s.puntos.length - 1]
          return (
            <g key={si}>
              {s.puntos.length > 1 && <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
              {s.puntos.map((p, i) => (
                <circle key={i} cx={x(i)} cy={y(p.v)} r={3} fill={s.color}>
                  <title>{fechaCorta(p.t)}: {p.v}{unidad ? ' ' + unidad : ''}</title>
                </circle>
              ))}
              {/* Etiqueta del último valor (selectiva) */}
              <text x={x(s.puntos.length - 1) + 5} y={y(ult.v) + 3} fontSize={10} fontWeight={700} fill={s.color}>{ult.v}</text>
            </g>
          )
        })}
        {/* Fechas: primera y última */}
        {fechas.length > 0 && <text x={padL} y={H - 6} fontSize={9} fill="#94a3b8">{fechaCorta(fechas[0].t)}</text>}
        {fechas.length > 1 && <text x={x(fechas.length - 1)} y={H - 6} fontSize={9} fill="#94a3b8" textAnchor="end">{fechaCorta(fechas[fechas.length - 1].t)}</text>}
      </svg>
    </div>
  )
}

const AZUL = '#5484b4', AZUL_OSC = '#3a5c82', AZUL_CLARO = '#8fb0d6'

export default function TendenciasPaciente({ pacienteFijo }: { pacienteFijo?: string } = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pacienteId, setPacienteId] = useState<string>(pacienteFijo ?? '')
  const [evos, setEvos] = useState<HistoriaEvolucion[]>([])
  const [escalasRes, setEscalasRes] = useState<{ escala: string; fecha: string; puntaje: number }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('clientes').select('*').order('nombre').then(({ data }) => setClientes(data ?? []))
  }, [])
  useEffect(() => { if (pacienteFijo != null) setPacienteId(pacienteFijo) }, [pacienteFijo])

  async function cargar(pid: string) {
    setLoading(true)
    const [ev, es] = await Promise.all([
      supabase.from('historia_evoluciones').select('*').eq('cliente_id', pid).order('fecha', { ascending: true }),
      supabase.from('escala_resultados').select('escala,fecha,puntaje').eq('cliente_id', pid).order('fecha', { ascending: true }),
    ])
    setEvos((ev.data as HistoriaEvolucion[]) ?? [])
    setEscalasRes((es.data as any[]) ?? [])
    setLoading(false)
  }
  useEffect(() => {
    if (!pacienteId) { setEvos([]); setEscalasRes([]); return }
    cargar(pacienteId)
  }, [pacienteId])

  // Series de signos vitales
  function serieVital(campo: keyof HistoriaEvolucion): Punto[] {
    return evos.filter((e) => e[campo] != null).map((e) => ({ t: e.fecha, v: Number(e[campo]) }))
  }
  const metricas: { titulo: string; unidad: string; puntos: Punto[] }[] = [
    { titulo: 'Peso', unidad: 'lb', puntos: serieVital('peso') },
    { titulo: 'IMC', unidad: '', puntos: serieVital('imc') },
    { titulo: 'Glucosa', unidad: 'mg/dL', puntos: serieVital('glucosa') },
    { titulo: 'Frecuencia cardíaca', unidad: 'L/m', puntos: serieVital('fc') },
    { titulo: 'Saturación O₂', unidad: '%', puntos: serieVital('sat') },
  ].filter((m) => m.puntos.length >= 2)

  const taSist = evos.filter((e) => e.ta_sistolica != null).map((e) => ({ t: e.fecha, v: Number(e.ta_sistolica) }))
  const taDiast = evos.filter((e) => e.ta_diastolica != null).map((e) => ({ t: e.fecha, v: Number(e.ta_diastolica) }))
  const hayTA = taSist.length >= 2

  const escalasConDatos = ESCALAS.map((esc) => ({
    esc,
    puntos: escalasRes.filter((r) => r.escala === esc.key).map((r) => ({ t: r.fecha, v: Number(r.puntaje) })),
  })).filter((x) => x.puntos.length >= 2)

  const sinDatos = metricas.length === 0 && !hayTA && escalasConDatos.length === 0

  return (
    <div>
      {!pacienteFijo && (
        <>
          <PageHeader title="Tendencias" subtitle="Evolución de signos vitales y escalas en el tiempo" />
          <div className="card mb-6 max-w-md">
            <label className="label">Paciente</label>
            <SelectorPaciente clientes={clientes} value={pacienteId} onChange={setPacienteId} />
          </div>
        </>
      )}

      {!pacienteId ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <LineChart className="text-brand-300" size={40} />
          <p className="text-slate-500">Selecciona un paciente para ver sus tendencias.</p>
        </div>
      ) : loading ? (
        <Cargando />
      ) : sinDatos ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <TrendingUp className="text-brand-300" size={40} />
          <p className="text-slate-500">Aún no hay suficientes datos para graficar.</p>
          <p className="text-xs text-slate-400">Se necesitan al menos 2 registros (signos vitales en consultas o escalas aplicadas).</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(metricas.length > 0 || hayTA) && (
            <div>
              <h2 className="mb-3 font-display text-lg font-bold text-slate-800">Signos vitales</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {hayTA && (
                  <MiniLinea titulo="Presión arterial" unidad="mmHg" series={[
                    { nombre: 'Sistólica', color: AZUL_OSC, puntos: taSist },
                    { nombre: 'Diastólica', color: AZUL_CLARO, puntos: taDiast },
                  ]} />
                )}
                {metricas.map((m) => (
                  <MiniLinea key={m.titulo} titulo={m.titulo} unidad={m.unidad} series={[{ color: AZUL, puntos: m.puntos }]} />
                ))}
              </div>
            </div>
          )}

          {escalasConDatos.length > 0 && (
            <div>
              <h2 className="mb-3 font-display text-lg font-bold text-slate-800">Escalas geriátricas</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {escalasConDatos.map(({ esc, puntos }) => (
                  <MiniLinea key={esc.key} titulo={esc.sigla ?? esc.nombre} unidad="pts" series={[{ color: AZUL, puntos }]} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
