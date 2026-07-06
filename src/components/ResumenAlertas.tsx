import { useEffect, useState } from 'react'
import { Pill, ShieldAlert, Syringe, Activity, HeartPulse, Brain } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { hoyISO } from '../lib/format'
import { revisarMedicamento, UMBRAL_POLIFARMACIA } from '../lib/medicamentos'
import { cargaAnticolinergica } from '../lib/cargaFarmacologica'
import { escalaPorKey } from '../lib/escalas'
import { calcularFragilidad, Fragilidad, DESCARGO_FRAGILIDAD } from '../lib/fragilidad'

type Color = 'rose' | 'orange' | 'amber'
interface Alerta { icon: typeof Pill; texto: string; color: Color }

const TONO: Record<Color, string> = {
  rose: 'bg-rose-100 text-rose-700',
  orange: 'bg-orange-100 text-orange-700',
  amber: 'bg-amber-100 text-amber-800',
}

// Resumen inteligente: junta en un vistazo la fragilidad y las alertas del paciente
// (polifarmacia, medicación inapropiada, vacunas vencidas, escalas alteradas).
export default function ResumenAlertas({ pacienteId }: { pacienteId: string }) {
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [frag, setFrag] = useState<Fragilidad | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const hoy = hoyISO()
      const [meds, vac, esc, prob] = await Promise.all([
        supabase.from('medicamentos_paciente').select('nombre,activo').eq('cliente_id', pacienteId),
        supabase.from('vacunas_paciente').select('vacuna,proxima').eq('cliente_id', pacienteId),
        supabase.from('escala_resultados').select('escala,fecha,puntaje').eq('cliente_id', pacienteId).order('fecha', { ascending: false }),
        supabase.from('problemas_paciente').select('descripcion,codigo,cronico,activo').eq('cliente_id', pacienteId),
      ])
      if (!alive) return

      const activos = (meds.data ?? []).filter((m: any) => m.activo)
      const polifarmacia = activos.length >= UMBRAL_POLIFARMACIA
      const inapropiados = activos.filter((m: any) => revisarMedicamento(m.nombre).length > 0)
      const acb = cargaAnticolinergica(activos.map((m: any) => m.nombre))
      const vencidas = (vac.data ?? []).filter((v: any) => v.proxima && v.proxima < hoy)

      // Última aplicación de cada escala (esc viene ordenado por fecha desc)
      const ultima = new Map<string, number>()
      ;(esc.data ?? []).forEach((r: any) => { if (!ultima.has(r.escala)) ultima.set(r.escala, Number(r.puntaje)) })
      const rojas: { sigla: string; texto: string; tono: string }[] = []
      ultima.forEach((puntaje, key) => {
        const def = escalaPorKey(key)
        if (!def) return
        const it = def.interpretar(puntaje)
        if (it.tono === 'orange' || it.tono === 'rose') rojas.push({ sigla: def.sigla ?? def.nombre, texto: it.texto, tono: it.tono })
      })

      const probActivos = (prob.data ?? []).filter((p: any) => p.activo)
      const cronicos = probActivos.filter((p: any) => p.cronico).length
      const caidas = probActivos.some((p: any) => /ca[ií]d/i.test(p.descripcion ?? '') || ['Z91.81', 'R29.6'].includes(p.codigo ?? ''))

      const a: Alerta[] = []
      if (polifarmacia) a.push({ icon: Pill, color: 'amber', texto: `Polifarmacia — ${activos.length} medicamentos activos` })
      if (inapropiados.length) a.push({ icon: ShieldAlert, color: 'rose', texto: `${inapropiados.length} medicamento(s) potencialmente inapropiado(s)` })
      if (acb.nivel === 'significativa') a.push({ icon: Brain, color: 'rose', texto: `Carga anticolinérgica alta (ACB ${acb.total})` })
      if (vencidas.length) a.push({ icon: Syringe, color: 'orange', texto: `${vencidas.length} vacuna(s) vencida(s)` })
      rojas.forEach((r) => a.push({ icon: Activity, color: r.tono === 'rose' ? 'rose' : 'orange', texto: `${r.sigla}: ${r.texto}` }))

      setAlertas(a)
      setFrag(calcularFragilidad({
        polifarmacia, multimorbilidad: cronicos >= 3, escalasAlteradas: rojas.length,
        escalasEvaluadas: ultima.size, caidas, medicacionInapropiada: inapropiados.length > 0,
        cargaAnticolinergica: acb.nivel === 'significativa',
      }))
      setLoading(false)
    })()
    return () => { alive = false }
  }, [pacienteId])

  if (loading || !frag) return null

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <HeartPulse size={16} className="text-brand-500" />
        <h3 className="text-sm font-bold text-slate-700">Resumen y alertas</h3>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
          style={{ background: frag.color + '22', color: frag.color }}>
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: frag.color }} />
          {frag.label} · IF {frag.indice.toFixed(2)}
        </span>
      </div>

      <p className="mb-2 text-xs text-slate-500">
        Índice de fragilidad {frag.indice.toFixed(2)} ({frag.presentes} de {frag.evaluados} déficits)
        {frag.deficits.length > 0 && <> — {frag.deficits.join(' · ')}</>}.
      </p>

      {alertas.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {alertas.map((al, i) => {
            const Icon = al.icon
            return (
              <span key={i} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONO[al.color]}`}>
                <Icon size={13} /> {al.texto}
              </span>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Sin alertas activas.</p>
      )}

      <p className="mt-2 text-[10px] text-slate-400">{DESCARGO_FRAGILIDAD}</p>
    </div>
  )
}
