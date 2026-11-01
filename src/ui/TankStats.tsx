import { useState } from "react"
import { fullRepair } from "../lib/reward"
import { dec, fmt } from "../lib/text"
import type { Vehicle } from "../lib/types"
import { dpm, gunArcText } from "../lib/vehicles"

type Block = {
  id: string
  title: string
  score: number
  rows: { value: string; label: string }[]
}

function clamp(n: number, a = 0, b = 1): number {
  return Math.max(a, Math.min(b, n))
}

function mix(parts: [number, number, number][]): number {
  const s = parts.reduce((n, [v, max, w]) => n + clamp(v / max) * w, 0)
  return Math.round(clamp(s) * 1000)
}

function blocks(v: Vehicle): Block[] {
  const ap = v.shells[0]
  const rof = 60 / v.reload
  const engine = Math.round(v.mass * v.power)
  const back = Math.max(8, Math.round(v.speed * 0.33))
  const minute = dpm(v)
  return [
    {
      id: "fire",
      title: "Огневая мощь",
      score: mix([[minute, 2400, 0.4], [ap.pen, 260, 0.3], [ap.damage, 400, 0.3]]),
      rows: [
        { value: String(ap.damage), label: "средний урон" },
        { value: String(ap.pen), label: "бронепробитие" },
        { value: dec(rof, 2), label: "скорострельность" },
        { value: dec(v.reload), label: "перезарядка" },
        { value: dec(v.aim), label: "сведение" },
        { value: dec(v.dispersion, 2), label: "разброс на 100 м" },
        { value: gunArcText(v), label: "УВН" },
        { value: fmt(minute), label: "урон в минуту" },
      ],
    },
    {
      id: "live",
      title: "Живучесть",
      score: mix([[v.hp, 1800, 0.55], [v.hull[0], 200, 0.45]]),
      rows: [
        { value: fmt(v.hp), label: "прочность" },
        { value: v.hull.join("/"), label: "бронирование корпуса" },
        { value: v.turret.join("/"), label: v.casemate ? "бронирование рубки" : "бронирование башни" },
        { value: fmt(fullRepair(v.tier)), label: "ремонт" },
      ],
    },
    {
      id: "move",
      title: "Мобильность",
      score: mix([[v.speed, 72, 0.4], [v.power, 36, 0.35], [v.traverse, 48, 0.25]]),
      rows: [
        { value: String(v.mass), label: "масса" },
        { value: fmt(engine), label: "мощность двигателя" },
        { value: dec(v.power), label: "удельная мощность" },
        { value: `${v.speed}/${back}`, label: "макс. скорость / задний ход" },
        { value: dec(v.traverse), label: "поворот шасси" },
      ],
    },
    {
      id: "hide",
      title: "Незаметность",
      score: mix([[v.camo, 0.35, 1]]),
      rows: [
        { value: dec(v.camo * 100), label: "маскировка" },
      ],
    },
    {
      id: "spot",
      title: "Наблюдение",
      score: mix([[v.view, 420, 1]]),
      rows: [
        { value: String(v.view), label: "обзор" },
      ],
    },
  ]
}

export function TankStats({ tank }: { tank: Vehicle }) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const list = blocks(tank)
  return (
    <div className="tstats">
      {list.map((b) => {
        const on = Boolean(open[b.id])
        return (
          <section key={b.id} className={on ? "tblock on" : "tblock"}>
            <button
              type="button"
              className="thead"
              aria-expanded={on}
              onClick={() => setOpen((s) => ({ ...s, [b.id]: !s[b.id] }))}
            >
              <i className="chev" aria-hidden />
              <span>
                <b>{b.title}</b>
                <em className="tbar"><i style={{ width: `${Math.max(4, Math.min(100, b.score / 10))}%` }} /></em>
              </span>
              <strong>{b.score}</strong>
            </button>
            <div className="tdrop">
              <ul>
                {b.rows.map((row) => (
                  <li key={row.label}>
                    <b>{row.value}</b>
                    <span>{row.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )
      })}
    </div>
  )
}
