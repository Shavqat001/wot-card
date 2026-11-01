import { useMemo, useRef, useState, type PointerEvent } from "react"
import { canBuy, type Save } from "../lib/garage"
import { COUNTRIES, roman, TECH_TITLE } from "../lib/text"
import type { Country, VehType, Vehicle } from "../lib/types"
import { VEHICLES } from "../lib/vehicles"
import { TankArt } from "./TankArt"
const TYPE_RANK: Record<VehType, number> = { spg: 0, td: 1, heavy: 2, medium: 3, light: 4 }
const TIERS = 10
const CELL_W = 92
const CELL_H = 68
const GAP_X = 18
const GAP_Y = 8

type Spot = { v: Vehicle; col: number; row: number }

const LAYOUT = new Map<Country, Spot[]>()

function layout(country: Country): Spot[] {
  const hit = LAYOUT.get(country)
  if (hit) return hit
  const tanks = VEHICLES.filter((v) => v.country === country)
  const local = new Map(tanks.map((v) => [v.id, v]))
  const kids = new Map<string, Vehicle[]>()
  for (const v of tanks) {
    if (!v.pred || !local.has(v.pred)) continue
    const list = kids.get(v.pred) ?? []
    list.push(v)
    kids.set(v.pred, list)
  }
  const span = new Map<string, number>()
  const deep = new Map<string, number>()
  const measure = (v: Vehicle): number => {
    const ch = kids.get(v.id) ?? []
    if (!ch.length) {
      span.set(v.id, 1)
      deep.set(v.id, v.tier)
      return 1
    }
    const total = ch.reduce((n, c) => n + measure(c), 0)
    span.set(v.id, total)
    deep.set(v.id, Math.max(v.tier, ...ch.map((c) => deep.get(c.id) ?? c.tier)))
    return total
  }
  const roots = tanks
    .filter((v) => !v.pred || !local.has(v.pred))
    .sort((a, b) => TYPE_RANK[a.type] - TYPE_RANK[b.type] || a.tier - b.tier || a.name.localeCompare(b.name, "ru"))
  roots.forEach(measure)
  for (const list of kids.values()) {
    list.sort((a, b) =>
      (deep.get(b.id) ?? b.tier) - (deep.get(a.id) ?? a.tier)
      || (span.get(b.id) ?? 1) - (span.get(a.id) ?? 1)
      || a.name.localeCompare(b.name, "ru"))
  }
  const rowOf = new Map<string, number>()
  const place = (v: Vehicle, row: number) => {
    rowOf.set(v.id, row)
    let next = row
    for (const child of kids.get(v.id) ?? []) {
      place(child, next)
      next += span.get(child.id) ?? 1
    }
  }
  let row = 1
  for (const root of roots) {
    place(root, row)
    row += span.get(root.id) ?? 1
  }
  const spots = tanks.map((v) => ({ v, col: v.tier, row: rowOf.get(v.id) ?? 1 }))
  LAYOUT.set(country, spots)
  return spots
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
  const skipClick = useRef(false)
  const spots = useMemo(() => layout(nation), [nation])
  const byId = useMemo(() => new Map(spots.map((s) => [s.v.id, s])), [spots])
  const have = useMemo(() => new Set(save.owned), [save.owned])
  const rows = Math.max(1, ...spots.map((s) => s.row))
  const width = TIERS * CELL_W + (TIERS - 1) * GAP_X
  const height = rows * CELL_H + (rows - 1) * GAP_Y

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
    skipClick.current = false
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
    if (!hold.moved && dx * dx + dy * dy < 64) return
    hold.moved = true
    skipClick.current = true
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
    if (skipClick.current) {
      skipClick.current = false
      return
    }
    onOpen(id)
  }

  const wires = useMemo(() => spots.flatMap((spot) => {
    if (!spot.v.pred) return []
    const from = byId.get(spot.v.pred)
    if (!from) return []
    const a = point(from, "right")
    const b = point(spot, "left")
    if (Math.abs(a.y - b.y) < 1) return [`M ${a.x} ${a.y} H ${b.x}`]
    const mid = a.x + (b.x - a.x) * 0.45
    return [`M ${a.x} ${a.y} H ${mid} V ${b.y} H ${b.x}`]
  }), [spots, byId])

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
                gridTemplateRows: `repeat(${rows}, ${CELL_H}px)`,
                columnGap: GAP_X,
                rowGap: GAP_Y,
              }}
            >
              <svg className="wires" width={width} height={height} aria-hidden>
                {wires.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
              {spots.map((spot) => {
                const owned = have.has(spot.v.id)
                const ready = !owned && canBuy(save, spot.v.id, have)
                return (
                  <button
                    key={spot.v.id}
                    type="button"
                    className={`node c-${spot.v.country}${owned ? " have" : ready ? " ready" : ""}`}
                    style={{
                      gridColumn: spot.col,
                      gridRow: spot.row,
                    }}
                    onClick={() => openTank(spot.v.id)}
                  >
                    <i className="mark">{roman(spot.v.tier)}</i>
                    <TankArt id={spot.v.id} size="sm" />
                    <b>{spot.v.name}</b>
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
