import { useLayoutEffect, useRef, useState } from 'react'
import { nivelDef, NivelKey } from '../lib/mapaCorporal'

export interface Marca { id: string; x: number; y: number; nivel: NivelKey; texto?: string | null; vista?: string; origen?: string; codigo?: string | null }

interface Pin { id: string; idx: number; x: number; y: number; color: string }
interface Card { id: string; idx: number; x: number; y: number; w: number; side: 'left' | 'right'; color: string; texto: string; nivel: NivelKey }
interface Line { id: string; x1: number; y1: number; x2: number; y2: number; color: string }

const CARD_H = 42
const CARD_GAP = 6
const GUTTER_GAP = 8
const CARD_W_MAX = 158  // ancho máximo del cuadro (moderado, no se estira en PC)
const CARD_W_MIN = 72

// Figura del paciente con marcadores LIBRES y sus hallazgos en cuadros al lado
// (izquierda/derecha según el punto), unidos por una línea.
export default function MapaCorporal2D({
  src, marcadores, onAdd, onMove, onOpen,
}: {
  src: string
  marcadores: Marca[]
  onAdd: (x: number, y: number) => void
  onMove: (id: string, x: number, y: number) => void
  onOpen: (id: string) => void
}) {
  const outerRef = useRef<HTMLDivElement>(null)
  const figRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ id: string; sx: number; sy: number; x: number; y: number; moved: boolean } | null>(null)
  const [geo, setGeo] = useState<{ pins: Pin[]; cards: Card[]; lines: Line[] }>({ pins: [], cards: [], lines: [] })
  const [tick, setTick] = useState(0)

  useLayoutEffect(() => {
    function compute() {
      const outer = outerRef.current, fig = figRef.current
      if (!outer || !fig) return
      const or = outer.getBoundingClientRect(), fr = fig.getBoundingClientRect()
      const Wo = or.width, Ho = or.height
      const Fl = fr.left - or.left, Wf = fr.width, Ft = fr.top - or.top, Hf = fr.height
      if (Wf === 0) return
      const pins: Pin[] = [], cards: Card[] = [], lines: Line[] = []
      for (const side of ['left', 'right'] as const) {
        const items = marcadores
          .map((m, idx) => ({ m, idx, px: Fl + (m.x / 100) * Wf, py: Ft + (m.y / 100) * Hf }))
          .filter(({ m }) => (m.x < 50) === (side === 'left'))
          .sort((a, b) => a.py - b.py)
        // Cuadro de ancho moderado, pegado al cuerpo (no estirado hasta el borde).
        const gutter = side === 'left' ? Fl - GUTTER_GAP : Wo - (Fl + Wf + GUTTER_GAP)
        const cardW = Math.max(CARD_W_MIN, Math.min(CARD_W_MAX, gutter))
        const cardX = side === 'left' ? Math.max(0, Fl - GUTTER_GAP - cardW) : Fl + Wf + GUTTER_GAP
        let prevBottom = -Infinity
        for (const o of items) {
          const nd = nivelDef(o.m.nivel)
          pins.push({ id: o.m.id, idx: o.idx, x: o.px, y: o.py, color: nd.color })
          let top = o.py - CARD_H / 2
          if (top < prevBottom + CARD_GAP) top = prevBottom + CARD_GAP
          top = Math.max(0, Math.min(Ho - CARD_H, top))
          prevBottom = top + CARD_H
          const anchorX = side === 'left' ? cardX + cardW : cardX
          cards.push({ id: o.m.id, idx: o.idx, x: cardX, y: top, w: cardW, side, color: nd.color, texto: o.m.texto ?? '', nivel: o.m.nivel })
          lines.push({ id: o.m.id, x1: o.px, y1: o.py, x2: anchorX, y2: top + CARD_H / 2, color: nd.color })
        }
      }
      setGeo({ pins, cards, lines })
    }
    compute()
    const ro = new ResizeObserver(compute)
    if (outerRef.current) ro.observe(outerRef.current)
    window.addEventListener('resize', compute)
    return () => { ro.disconnect(); window.removeEventListener('resize', compute) }
  }, [marcadores, src, tick])

  function pctFig(clientX: number, clientY: number) {
    const r = figRef.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100)),
    }
  }
  function pxOuter(clientX: number, clientY: number) {
    const r = outerRef.current!.getBoundingClientRect()
    return { x: clientX - r.left, y: clientY - r.top }
  }

  function agregar(e: React.MouseEvent) {
    const { x, y } = pctFig(e.clientX, e.clientY)
    onAdd(x, y)
  }
  function pinDown(e: React.PointerEvent, p: Pin) {
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const o = pxOuter(e.clientX, e.clientY)
    setDrag({ id: p.id, sx: o.x, sy: o.y, x: o.x, y: o.y, moved: false })
  }
  function pinMove(e: React.PointerEvent) {
    if (!drag) return
    const o = pxOuter(e.clientX, e.clientY)
    const moved = Math.hypot(o.x - drag.sx, o.y - drag.sy) > 4
    setDrag((d) => (d ? { ...d, x: o.x, y: o.y, moved: d.moved || moved } : d))
  }
  function pinUp(e: React.PointerEvent, p: Pin) {
    e.stopPropagation()
    if (drag && drag.id === p.id) {
      if (drag.moved) { const { x, y } = pctFig(e.clientX, e.clientY); onMove(p.id, x, y) }
      else onOpen(p.id)
    }
    setDrag(null)
  }

  return (
    <div
      ref={outerRef}
      className="relative flex justify-center overflow-hidden rounded-2xl border border-brand-100 py-3"
      style={{ height: 'min(66vh, 540px)', background: 'radial-gradient(120% 90% at 50% 12%, #f6f9fc 0%, #eaf1f8 55%, #dce7f2 100%)' }}
    >
      {/* Figura */}
      <div ref={figRef} className="relative h-full">
        <img src={src} alt="Cuerpo del paciente" draggable={false} onClick={agregar} onLoad={() => setTick((t) => t + 1)}
          className="block h-full w-auto select-none rounded-xl" style={{ cursor: 'crosshair' }} />
      </div>

      {/* Líneas punto → cuadro */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 10 }}>
        {geo.lines.map((l) => (
          <line key={l.id} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.color} strokeWidth={1.5} opacity={0.75} />
        ))}
      </svg>

      {/* Cuadros de hallazgos */}
      {geo.cards.map((c) => (
        <button key={c.id} onClick={() => onOpen(c.id)}
          className="absolute flex items-start gap-1.5 overflow-hidden rounded-lg bg-white p-1.5 text-left shadow ring-1 ring-slate-100"
          style={{ left: c.x, top: c.y, width: c.w, height: CARD_H, zIndex: 20, borderLeft: `3px solid ${c.color}` }}>
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: c.color }}>{c.idx + 1}</span>
          <span className="min-w-0 flex-1 text-[11px] leading-tight text-slate-700" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {c.texto || 'Sin descripción'}
          </span>
        </button>
      ))}

      {/* Pines sobre el cuerpo */}
      {geo.pins.map((p) => {
        const pos = drag && drag.id === p.id ? drag : p
        return (
          <button key={p.id}
            onPointerDown={(e) => pinDown(e, p)} onPointerMove={pinMove} onPointerUp={(e) => pinUp(e, p)}
            className="absolute flex items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md"
            style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)', width: 24, height: 24, background: p.color, border: '2px solid #fff', touchAction: 'none', cursor: 'grab', zIndex: 25 }}>
            {p.idx + 1}
          </button>
        )
      })}
    </div>
  )
}
