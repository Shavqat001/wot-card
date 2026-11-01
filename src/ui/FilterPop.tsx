import { useLayoutEffect, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { COUNTRIES, COUNTRY_LABEL, ROLES, ROLE_LABEL, TIERS, TYPE_LABEL, roman } from "../lib/text"
import type { Country, Role, VehType } from "../lib/types"

const TYPES: VehType[] = ["light", "medium", "heavy", "td", "spg"]

function Mark({ t }: { t: VehType }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": true as const }
  if (t === "light") {
    return <svg {...common}><path d="M12 3.2 20.8 12 12 20.8 3.2 12Z" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
  }
  if (t === "medium") {
    return <svg {...common}><path d="M12 3.2 19.6 7.6v8.8L12 20.8 4.4 16.4V7.6Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
  }
  if (t === "heavy") {
    return <svg {...common}><path d="M12 4.2 20.2 19.2H3.8Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
  }
  if (t === "td") {
    return <svg {...common}><path d="M4 6.2h10.4L20 12 14.4 17.8H4Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
  }
  return <svg {...common}><rect x="5" y="5" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
}

export function FilterPop({
  anchor, shown, total, country, kind, role, tier,
  onCountry, onKind, onRole, onTier, onReset, onClose,
}: {
  anchor: HTMLElement | null
  shown: number
  total: number
  country: Country | null
  kind: VehType | null
  role: Role | null
  tier: number | null
  onCountry: (c: Country | null) => void
  onKind: (t: VehType | null) => void
  onRole: (r: Role | null) => void
  onTier: (n: number | null) => void
  onReset: () => void
  onClose: () => void
}) {
  const box = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = box.current
    if (!el || !anchor) return
    const app = document.querySelector(".app")
    const r = anchor.getBoundingClientRect()
    const host = app?.getBoundingClientRect() ?? { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight }
    const w = el.offsetWidth
    const h = el.offsetHeight
    const gap = 8
    let left = r.right - w
    let top = r.bottom + gap
    if (top + h > host.bottom - 8) top = r.top - h - gap
    if (left < host.left + 8) left = host.left + 8
    if (left + w > host.right - 8) left = host.right - w - 8
    if (top < host.top + 8) top = host.top + 8
    el.style.left = `${left}px`
    el.style.top = `${top}px`
  })

  useLayoutEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (box.current?.contains(t) || anchor?.contains(t)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("pointerdown", onDown)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("keydown", onKey)
    }
  }, [anchor, onClose])

  const host = document.querySelector(".app") ?? document.body
  const body: ReactNode = (
    <div ref={box} className="fpop" role="dialog" aria-label="фильтр">
      <header>
        <div>
          <h2>Фильтр по параметрам</h2>
          <small>техника {shown} / {total}</small>
        </div>
        <button type="button" className="x" aria-label="закрыть" onClick={onClose}>×</button>
      </header>

      <p>Тип</p>
      <div className="grid types">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={kind === t ? "on" : ""}
            aria-label={TYPE_LABEL[t]}
            aria-pressed={kind === t}
            onClick={() => onKind(kind === t ? null : t)}
          >
            <Mark t={t} />
          </button>
        ))}
      </div>

      <p>Нация</p>
      <div className="grid nations">
        {COUNTRIES.map((c) => (
          <button
            key={c}
            type="button"
            className={country === c ? `on ${c}` : c}
            aria-label={COUNTRY_LABEL[c]}
            aria-pressed={country === c}
            onClick={() => onCountry(country === c ? null : c)}
          >
            <img src={`${import.meta.env.BASE_URL}flags/${c}.jpg`} alt="" draggable={false} />
          </button>
        ))}
      </div>

      <p>Роль</p>
      <div className="roles">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            className={role === r ? "chip on" : "chip"}
            onClick={() => onRole(role === r ? null : r)}
          >
            {ROLE_LABEL[r]}
          </button>
        ))}
      </div>

      <p>Уровень</p>
      <div className="grid tiers">
        {TIERS.map((n) => (
          <button
            key={n}
            type="button"
            className={tier === n ? "on" : ""}
            aria-pressed={tier === n}
            onClick={() => onTier(tier === n ? null : n)}
          >
            {roman(n)}
          </button>
        ))}
      </div>

      <button type="button" className="wipe" aria-label="сброс" onClick={onReset}>×</button>
    </div>
  )

  return createPortal(body, host)
}
