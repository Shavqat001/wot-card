import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import { canBuy, type Save } from "../lib/garage"
import { COUNTRIES, fmt, roman, TECH_TITLE } from "../lib/text"
import type { Country, Vehicle } from "../lib/types"
import { GERMANY_ROW } from "../lib/germanyTree"
import { USA_ROW } from "../lib/usaTree"
import { USSR_ROW } from "../lib/ussrTree"
import { VEHICLES } from "../lib/vehicles"
import { TankArt } from "./TankArt"

const TIERS = 10
const CELL_W = 92
const CELL_H = 68
const GAP_X = 18
const GAP_Y = 8

const ROW: Partial<Record<Country, Record<string, number>>> = {
  ussr: USSR_ROW,
  germany: GERMANY_ROW,
  usa: USA_ROW,
}

type Spot = { v: Vehicle; col: number; row: number }

/** Нации по скринам клиента. Остальные пока пустые. */
function layout(country: Country): Spot[] {
  const rows = ROW[country]
  if (!rows) return []
  return VEHICLES
    .filter((v) => v.country === country && rows[v.id] != null)
    .map((v) => ({ v, col: v.tier, row: rows[v.id] }))
}

function Flag({ country, on, onPick }: { country: Country; on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      className={on ? `flag ${country} on` : `flag ${country}`}
      aria-label={TECH_TITLE[country]}
      aria-pressed={on}
      onClick={onPick}
    >
      <img src={`${import.meta.env.BASE_URL}flags/${country}.jpg`} alt="" draggable={false} />
    </button>
  )
}

export function Research({
  save,
  onBack,
  onOpen,
}: {
  save: Save
  onBack: () => void
  onOpen: (id: string) => void
}) {
  const [nation, setNation] = useState<Country>("ussr")
  const canvasRef = useRef<HTMLDivElement>(null)
  const pan = useRef<{
    id: number
    x: number
    y: number
    left: number
    top: number
    moved: boolean
  } | null>(null)
  const spots = useMemo(() => layout(nation), [nation])
  const byId = useMemo(() => new Map(spots.map((s) => [s.v.id, s])), [spots])
  const have = useMemo(() => new Set(save.owned), [save.owned])
  const rows = spots.length ? Math.max(...spots.map((s) => s.row)) : 0
  const width = TIERS * CELL_W + (TIERS - 1) * GAP_X
  const height = rows > 0 ? rows * CELL_H + (rows - 1) * GAP_Y : 120

  useEffect(() => {
    const box = canvasRef.current
    if (!box) return
    box.scrollTop = 0
    box.scrollLeft = 0
  }, [nation])

  function point(spot: Spot, edge: "left" | "right" | "mid") {
    const x0 = (spot.col - 1) * (CELL_W + GAP_X)
    const y = (spot.row - 1) * (CELL_H + GAP_Y) + CELL_H / 2
    const x = edge === "left" ? x0 : edge === "right" ? x0 + CELL_W : x0 + CELL_W / 2
    return { x, y }
  }

  function grab(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    const box = canvasRef.current
    if (!box) return
    /* тап по карточке — досье, без панорамирования */
    if ((e.target as Element | null)?.closest?.("button.node")) return
    pan.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      left: box.scrollLeft,
      top: box.scrollTop,
      moved: false,
    }
    try {
      box.setPointerCapture(e.pointerId)
    } catch {
      /* захват есть не везде */
    }
  }

  function drag(e: PointerEvent<HTMLDivElement>) {
    const box = canvasRef.current
    const hold = pan.current
    if (!box || !hold || e.pointerId !== hold.id) return
    const dx = e.clientX - hold.x
    const dy = e.clientY - hold.y
    if (!hold.moved && dx * dx + dy * dy < 196) return
    hold.moved = true
    box.classList.add("grabbing")
    box.scrollLeft = hold.left - dx
    box.scrollTop = hold.top - dy
  }

  function drop(e: PointerEvent<HTMLDivElement>) {
    const hold = pan.current
    if (!hold || e.pointerId !== hold.id) return
    pan.current = null
    canvasRef.current?.classList.remove("grabbing")
  }

  function openTank(id: string) {
    onOpen(id)
  }

  const wires = useMemo(() => {
    const out: { d: string; key: string; lit: boolean }[] = []
    for (const spot of spots) {
      if (!spot.v.pred) continue
      const from = byId.get(spot.v.pred)
      if (!from) continue
      const a = point(from, "right")
      const b = point(spot, "left")
      const lit = have.has(from.v.id)
      let d: string
      if (Math.abs(a.y - b.y) < 1) d = `M ${a.x} ${a.y} H ${b.x}`
      else {
        const mid = a.x + (b.x - a.x) * 0.45
        d = `M ${a.x} ${a.y} H ${mid} V ${b.y} H ${b.x}`
      }
      out.push({ d, key: `${from.v.id}-${spot.v.id}`, lit })
    }
    return out
  }, [spots, byId, have])

  return (
    <main className="sheet study">
      <header className="studyhead">
        <button type="button" className="back" onClick={onBack}>назад</button>
        <h1>{TECH_TITLE[nation]}</h1>
      </header>
      <div className="board">
        <nav className="flags" aria-label="страна">
          {COUNTRIES.map((c) => (
            <Flag key={c} country={c} on={c === nation} onPick={() => setNation(c)} />
          ))}
        </nav>
        <div
          className="canvas"
          ref={canvasRef}
          onPointerDown={grab}
          onPointerMove={drag}
          onPointerUp={drop}
          onPointerCancel={drop}
        >
          <div className="stage" style={{ width }}>
            <div
              className="ruler"
              style={{ gridTemplateColumns: `repeat(${TIERS}, ${CELL_W}px)`, columnGap: GAP_X }}
            >
              {Array.from({ length: TIERS }, (_, i) => (
                <span key={i}>{roman(i + 1)}</span>
              ))}
            </div>
            <div
              className="tree"
              style={{
                width,
                height,
                gridTemplateColumns: `repeat(${TIERS}, ${CELL_W}px)`,
                gridTemplateRows: rows > 0 ? `repeat(${rows}, ${CELL_H}px)` : undefined,
                columnGap: GAP_X,
                rowGap: GAP_Y,
              }}
            >
              {spots.length === 0 && (
                <p className="empty tree-empty">дерево пусто — жду скрин ветки</p>
              )}
              <svg className="wires" width={width} height={height} aria-hidden>
                {wires.map((w) => (
                  <path key={w.key} d={w.d} className={w.lit ? "lit" : ""} />
                ))}
              </svg>
              {spots.map((spot) => {
                const owned = have.has(spot.v.id)
                const ready = !owned && canBuy(save, spot.v.id, have)
                const locked = !owned && !ready
                return (
                  <button
                    key={spot.v.id}
                    type="button"
                    className={[
                      "node",
                      `c-${spot.v.country}`,
                      owned ? "have" : ready ? "ready" : "locked",
                    ].join(" ")}
                    style={{
                      gridColumn: spot.col,
                      gridRow: spot.row,
                    }}
                    onClick={() => openTank(spot.v.id)}
                  >
                    <i className="mark">{roman(spot.v.tier)}</i>
                    <TankArt id={spot.v.id} size="sm" />
                    <b>{spot.v.name}</b>
                    {owned ? (
                      <em className="got">✓</em>
                    ) : (
                      <em className={locked ? "xp dim" : "xp"}>
                        {spot.v.xp > 0 ? fmt(spot.v.xp) : "—"}
                        <span>★</span>
                      </em>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
