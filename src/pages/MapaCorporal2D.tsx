import { ZONAS, nivelDef, NivelKey } from '../lib/mapaCorporal'

// Cuerpo del paciente en 2D (figura del adulto mayor) con las 11 zonas superpuestas.
// Cada zona con nivel se enciende como "heatmap"; todas son tocables.

export default function MapaCorporal2D({
  niveles = {},
  onSelect = () => {},
}: {
  niveles?: Record<string, NivelKey>
  onSelect?: (k: string) => void
}) {
  return (
    <div
      className="flex justify-center rounded-2xl border border-brand-100 py-3"
      style={{ background: 'radial-gradient(120% 90% at 50% 12%, #f4f8fc 0%, #e6eef7 55%, #d5e2f0 100%)' }}
    >
      <div className="relative" style={{ height: 'min(68vh, 540px)' }}>
        <img
          src="/cuerpo-geriatria.png"
          alt="Cuerpo del paciente"
          draggable={false}
          className="block h-full w-auto select-none rounded-xl"
        />
        {ZONAS.map((z) => {
          const nk = niveles[z.key] ?? 'sin'
          const nd = nivelDef(nk)
          return (
            <div key={z.key} className="absolute" style={{ left: `${z.pos[0]}%`, top: `${z.pos[1]}%`, transform: 'translate(-50%, -50%)' }}>
              {nd.glow && (
                <span
                  aria-hidden
                  className="absolute left-1/2 top-1/2"
                  style={{
                    width: 58, height: 58, transform: 'translate(-50%, -50%)', borderRadius: '9999px',
                    background: `radial-gradient(circle, ${nd.color} 0%, ${nd.color}00 68%)`,
                    opacity: 0.8, filter: 'blur(3px)', pointerEvents: 'none',
                  }}
                />
              )}
              <button
                type="button"
                onClick={() => onSelect(z.key)}
                title={`${z.num}. ${z.nombre}`}
                aria-label={z.nombre}
                className="relative block rounded-full transition hover:ring-2 hover:ring-white/80"
                style={{ width: 30, height: 30, background: 'transparent' }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
