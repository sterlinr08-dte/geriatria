import { useRef, useState } from 'react'
import { nivelDef, NivelKey } from '../lib/mapaCorporal'

export interface Marca { id: string; x: number; y: number; nivel: NivelKey; texto?: string | null; vista?: string }

// Figura del paciente con marcadores LIBRES: el médico toca para colocar un punto,
// lo arrastra donde quiera, y lo toca para escribir el hallazgo.
export default function MapaCorporal2D({
  src, marcadores, onAdd, onMove, onOpen,
}: {
  src: string
  marcadores: Marca[]
  onAdd: (x: number, y: number) => void
  onMove: (id: string, x: number, y: number) => void
  onOpen: (id: string) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ id: string; sx: number; sy: number; x: number; y: number; moved: boolean } | null>(null)

  function pct(clientX: number, clientY: number) {
    const r = boxRef.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100)),
    }
  }

  function agregar(e: React.MouseEvent) {
    const { x, y } = pct(e.clientX, e.clientY)
    onAdd(x, y)
  }

  function pinDown(e: React.PointerEvent, m: Marca) {
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const { x, y } = pct(e.clientX, e.clientY)
    setDrag({ id: m.id, sx: x, sy: y, x: m.x, y: m.y, moved: false })
  }
  function pinMove(e: React.PointerEvent) {
    if (!drag) return
    const { x, y } = pct(e.clientX, e.clientY)
    const moved = Math.hypot(x - drag.sx, y - drag.sy) > 1.5
    setDrag((d) => (d ? { ...d, x, y, moved: d.moved || moved } : d))
  }
  function pinUp(e: React.PointerEvent, m: Marca) {
    e.stopPropagation()
    if (drag && drag.id === m.id) {
      if (drag.moved) onMove(m.id, drag.x, drag.y)
      else onOpen(m.id)
    }
    setDrag(null)
  }

  return (
    <div
      className="flex justify-center rounded-2xl border border-brand-100 py-3"
      style={{ background: 'radial-gradient(120% 90% at 50% 12%, #f6f9fc 0%, #eaf1f8 55%, #dce7f2 100%)' }}
    >
      <div ref={boxRef} className="relative" style={{ height: 'min(70vh, 560px)' }}>
        <img
          src={src}
          alt="Cuerpo del paciente"
          draggable={false}
          onClick={agregar}
          className="block h-full w-auto select-none rounded-xl"
          style={{ cursor: 'crosshair' }}
        />
        {marcadores.map((m, i) => {
          const pos = drag && drag.id === m.id ? drag : m
          const nd = nivelDef(m.nivel)
          return (
            <button
              key={m.id}
              onPointerDown={(e) => pinDown(e, m)}
              onPointerMove={pinMove}
              onPointerUp={(e) => pinUp(e, m)}
              title={m.texto || nd.label}
              className="absolute flex items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md"
              style={{
                left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)',
                width: 24, height: 24, background: nd.color, border: '2px solid #fff',
                touchAction: 'none', cursor: 'grab',
              }}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
