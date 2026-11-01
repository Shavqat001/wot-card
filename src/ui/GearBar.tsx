import { useEffect, useState } from "react"
import { GEAR, gearHint, slotsOf, type Gear } from "../lib/gear"
import { fmt } from "../lib/text"

const KEY = "angar.gear"

function Hint({ g }: { g: Gear }) {
  const parts = gearHint(g)
  return (
    <span className="tip" role="tooltip">
      <b>меняет</b>
      {parts.map((part) => (
        <i key={part}>{part}</i>
      ))}
    </span>
  )
}

export function GearBar({
  ids,
  stock,
  silver,
  onChange,
  onBuy,
  onScrap,
}: {
  ids: string[]
  stock: Record<string, number>
  silver: number
  onChange: (index: number, id: string | null) => void
  onBuy: (index: number, id: string) => void
  onScrap: (index: number) => void
}) {
  const [open, setOpen] = useState(() => localStorage.getItem(KEY) !== "0")
  const [menu, setMenu] = useState<{ i: number; x: number; y: number } | null>(null)
  const [ask, setAsk] = useState<string | null>(null)
  const [slot, setSlot] = useState(0)
  const slots = slotsOf(ids)
  const taken = new Set(slots.flatMap((g) => (g ? [g.id] : [])))
  const free = slots[slot] ? slots.findIndex((g) => !g) : slot
  const stored = GEAR.filter((g) => (stock[g.id] ?? 0) > 0 && !taken.has(g.id))
  const shop = GEAR.filter((g) => (stock[g.id] ?? 0) < 1 && !taken.has(g.id))
  const wanted = ask ? GEAR.find((g) => g.id === ask) : null

  function toggle() {
    const next = !open
    setOpen(next)
    localStorage.setItem(KEY, next ? "1" : "0")
  }

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    const id = window.setTimeout(() => window.addEventListener("click", close), 0)
    window.addEventListener("keydown", onKey)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener("click", close)
      window.removeEventListener("keydown", onKey)
    }
  }, [menu])

  const held = menu ? slots[menu.i] : null

  return (
    <div className="gear">
      <p className="gearhead">на машине</p>
      <div className="slots">
        {slots.map((g, i) => (
          <button
            key={i}
            type="button"
            className={g ? "slot on" : "slot"}
            aria-label={g ? `${g.name}. меняет ${gearHint(g).join(", ")}` : "пусто"}
            onClick={() => {
              if (g) return
              setSlot(i)
              setAsk(null)
              if (!open) toggle()
            }}
            onContextMenu={(e) => {
              if (!g) return
              e.preventDefault()
              setMenu({ i, x: e.clientX, y: e.clientY })
            }}
          >
            {g ? <img src={`${import.meta.env.BASE_URL}gear/${g.id}.png`} alt="" /> : <span className="plus">+</span>}
            <small>{g ? g.name : "пусто"}</small>
            {g && <em>{gearHint(g).join(" · ")}</em>}
            {g && <Hint g={g} />}
          </button>
        ))}
      </div>
      <button type="button" className="gearhead" aria-expanded={open} onClick={toggle}>
        оборудование
        <small>{open ? "скрыть" : "показать"}</small>
      </button>
      <div className={open ? "picker-wrap on" : "picker-wrap"}>
        <div className="picker-body">
          <p className="gearhead">склад</p>
          <div className="picker">
            {stored.length === 0 && <p className="empty">на складе пусто</p>}
            {stored.map((g) => (
              <button
                key={g.id}
                type="button"
                className={free < 0 ? "full" : ""}
                aria-label={`${g.name}. на складе ${stock[g.id]}. меняет ${gearHint(g).join(", ")}`}
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  if (free >= 0) onChange(free, g.id)
                }}
              >
                <img src={`${import.meta.env.BASE_URL}gear/${g.id}.png`} alt="" />
                <b>{g.name}</b>
                <small>{g.line}</small>
                <span className="sum">×{stock[g.id]}</span>
                <em>{gearHint(g).join(" · ")}</em>
                <Hint g={g} />
              </button>
            ))}
          </div>
          <p className="gearhead">купить</p>
          <div className="picker">
            {shop.map((g) => {
              const poor = silver < g.cost || free < 0
              return (
                <button
                  key={g.id}
                  type="button"
                  className={poor ? "full" : ""}
                  aria-label={`${g.name}. ${fmt(g.cost)}. меняет ${gearHint(g).join(", ")}`}
                  tabIndex={open ? 0 : -1}
                  onClick={() => {
                    if (!poor) setAsk(g.id)
                  }}
                >
                  <img src={`${import.meta.env.BASE_URL}gear/${g.id}.png`} alt="" />
                  <b>{g.name}</b>
                  <small>{g.line}</small>
                  <span className={silver < g.cost ? "sum poor" : "sum"}>{fmt(g.cost)}</span>
                  <em>{gearHint(g).join(" · ")}</em>
                  <Hint g={g} />
                </button>
              )
            })}
          </div>
          {wanted && (
            <div className="ask">
              <p>купить {wanted.name} за {fmt(wanted.cost)}?</p>
              <div className="confirm">
                <button
                  type="button"
                  onClick={() => {
                    if (free >= 0) onBuy(free, wanted.id)
                    setAsk(null)
                  }}
                >
                  да
                </button>
                <button type="button" onClick={() => setAsk(null)}>нет</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {menu && held && (
        <div
          className="ctx"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" role="menuitem" onClick={() => { onChange(menu.i, null); setMenu(null) }}>в склад</button>
          <button type="button" role="menuitem" onClick={() => { onScrap(menu.i); setMenu(null) }}>уничтожить</button>
          {[0, 1, 2].filter((n) => n !== menu.i).map((n) => (
            <button
              key={n}
              type="button"
              role="menuitem"
              onClick={() => { onChange(n, held.id); setMenu(null) }}
            >
              переместить в слот {n + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
