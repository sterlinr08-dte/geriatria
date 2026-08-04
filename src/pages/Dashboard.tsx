import { AlertTriangle, ArrowDownRight, ArrowUpRight, Bird, Egg, Package, TrendingUp, Wheat } from 'lucide-react'

const kpis = [
  { label: 'Gallinas activas', value: '48,620', trend: '+1.8%', positive: true, icon: Bird },
  { label: 'Producción de hoy', value: '43,286', trend: '+3.4%', positive: true, icon: Egg },
  { label: 'Porcentaje de postura', value: '89.0%', trend: '+1.2%', positive: true, icon: TrendingUp },
  { label: 'Consumo de alimento', value: '5,420 kg', trend: '+0.7%', positive: false, icon: Wheat },
  { label: 'Inventario disponible', value: '126,480', trend: '-2.1%', positive: false, icon: Package },
]

const produccion = [74, 78, 75, 82, 80, 86, 84, 88, 85, 90, 89, 92, 91, 94, 93, 96, 95, 97, 96, 98, 97, 99, 98, 100]
const galpones = [
  ['Galpón A-01', '92.8%', '9,840 huevos'],
  ['Galpón B-02', '90.4%', '8,970 huevos'],
  ['Galpón A-03', '88.9%', '8,215 huevos'],
  ['Galpón C-01', '86.6%', '7,840 huevos'],
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Resumen ejecutivo</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Rendimiento consolidado de Granja Principal · Hoy, 4 de agosto de 2026</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost">Últimos 30 días</button>
          <button className="btn-primary">Registrar producción</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map(({ label, value, trend, positive, icon: Icon }) => (
          <article key={label} className="card">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={20} /></div>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-emerald-700' : 'text-amber-700'}`}>
                {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{trend}
              </span>
            </div>
            <p className="mt-5 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <section className="card">
          <div className="mb-6 flex items-center justify-between">
            <div><h2 className="text-base font-semibold text-slate-900">Producción de los últimos 30 días</h2><p className="mt-1 text-xs text-slate-500">Huevos recolectados por día</p></div>
            <span className="badge bg-emerald-50 text-emerald-700 ring-emerald-200">+6.8% vs. período anterior</span>
          </div>
          <div className="flex h-64 items-end gap-2 border-b border-l border-slate-200 px-3 pb-3">
            {produccion.map((valor, i) => <div key={i} title={`${valor}%`} className="flex-1 rounded-t-md bg-emerald-600/85 transition hover:bg-emerald-700" style={{ height: `${valor}%` }} />)}
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-slate-400"><span>6 jul</span><span>13 jul</span><span>20 jul</span><span>27 jul</span><span>4 ago</span></div>
        </section>

        <section className="card">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-semibold text-slate-900">Producción por galpón</h2><p className="mt-1 text-xs text-slate-500">Ranking de postura de hoy</p></div><button className="text-xs font-semibold text-emerald-700">Ver todos</button></div>
          <div className="space-y-4">
            {galpones.map(([nombre, postura, huevos], i) => (
              <div key={nombre}>
                <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium text-slate-800">{i + 1}. {nombre}</span><span className="font-semibold text-slate-900">{postura}</span></div>
                <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-600" style={{ width: postura }} /></div>
                <p className="mt-1.5 text-[11px] text-slate-500">{huevos}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900">Indicadores operativos</h2><span className="text-xs text-slate-400">Actualizado hace 8 min</span></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[['Huevos buenos','41,974','97.0%'],['Huevos rotos','562','1.3%'],['Huevos sucios','481','1.1%'],['Descartados','269','0.6%']].map(([l,v,p]) => <div key={l} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">{l}</p><p className="mt-2 text-xl font-bold text-slate-900">{v}</p><p className="mt-1 text-xs font-semibold text-emerald-700">{p}</p></div>)}
          </div>
        </section>
        <section className="card border-amber-200 bg-amber-50/60">
          <div className="flex items-start gap-3"><div className="rounded-xl bg-amber-100 p-2 text-amber-700"><AlertTriangle size={20} /></div><div><h2 className="font-semibold text-slate-900">Alertas prioritarias</h2><p className="mt-1 text-xs text-slate-500">3 requieren atención</p></div></div>
          <div className="mt-4 space-y-3 text-sm">
            <p className="rounded-lg bg-white/80 p-3 text-slate-700"><strong>Galpón C-01:</strong> postura 4.2% por debajo del promedio.</p>
            <p className="rounded-lg bg-white/80 p-3 text-slate-700"><strong>Alimento postura:</strong> disponibilidad estimada para 6 días.</p>
            <p className="rounded-lg bg-white/80 p-3 text-slate-700"><strong>Lote L-2403:</strong> vacuna programada para mañana.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
