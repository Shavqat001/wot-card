import type { Vehicle } from "./types"

export interface Gear {
  id: string
  name: string
  line: string
  cost: number
  reload?: number
  aim?: number
  dispersion?: number
  view?: number
  hp?: number
  speed?: number
  camo?: number
  he?: number
}

export const GEAR: Gear[] = [
  { id: "rammer", name: "Досылатель", line: "короче перезарядка", cost: 5000, reload: 0.9 },
  { id: "stab", name: "Стабилизатор", line: "меньше разброс", cost: 5000, dispersion: 0.9 },
  { id: "drives", name: "Приводы наводки", line: "быстрее сведение", cost: 4000, aim: 0.9 },
  { id: "vent", name: "Вентиляция", line: "экипаж бодрее", cost: 5000, reload: 0.97, aim: 0.97, view: 1.03 },
  { id: "optics", name: "Оптика", line: "дальше обзор", cost: 4000, view: 1.1 },
  { id: "harden", name: "Запас прочности", line: "больше прочности", cost: 3500, hp: 1.08 },
  { id: "liner", name: "Подбой", line: "тише фугас", cost: 3000, he: 0.8 },
  { id: "turbo", name: "Турбина", line: "выше скорость", cost: 4500, speed: 1.1 },
  { id: "exhaust", name: "Выхлоп", line: "гуще маскировка", cost: 3500, camo: 0.06 },
]

let BY = new Map(GEAR.map((g) => [g.id, g]))

export function adoptGear(list: Gear[]) {
  GEAR.splice(0, GEAR.length, ...list)
  BY = new Map(GEAR.map((g) => [g.id, g]))
}

export function gearHint(g: Gear): string[] {
  const parts: string[] = []
  if (g.reload) parts.push("перезарядка")
  if (g.aim) parts.push("сведение")
  if (g.dispersion) parts.push("разброс")
  if (g.view) parts.push("обзор")
  if (g.hp) parts.push("прочность")
  if (g.speed) parts.push("скорость")
  if (g.camo) parts.push("маскировка")
  if (g.he) parts.push("фугас")
  if (g.reload) parts.push("в минуту")
  return parts
}

export function gearById(id: string): Gear | null {
  return BY.get(id) ?? null
}

export function cleanGear(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  const out: string[] = []
  for (const id of ids) {
    if (typeof id !== "string" || !BY.get(id) || out.includes(id)) continue
    out.push(id)
    if (out.length === 3) break
  }
  return out
}

export function slotsOf(ids: string[] | undefined): (Gear | null)[] {
  const slots: (Gear | null)[] = [null, null, null]
  ;(ids ?? []).forEach((id, i) => {
    if (i < 3 && id) slots[i] = BY.get(id) ?? null
  })
  return slots
}

export function fit(v: Vehicle, ids: string[]): Vehicle {
  let reload = v.reload
  let aim = v.aim
  let dispersion = v.dispersion
  let view = v.view
  let hp = v.hp
  let speed = v.speed
  let camo = v.camo
  let heTaken = 1
  for (const id of ids) {
    const g = BY.get(id)
    if (!g) continue
    if (g.reload) reload *= g.reload
    if (g.aim) aim *= g.aim
    if (g.dispersion) dispersion *= g.dispersion
    if (g.view) view *= g.view
    if (g.hp) hp *= g.hp
    if (g.speed) speed *= g.speed
    if (g.camo) camo += g.camo
    if (g.he) heTaken *= g.he
  }
  return {
    ...v,
    reload: Math.round(reload * 100) / 100,
    aim: Math.round(aim * 100) / 100,
    dispersion: Math.round(dispersion * 100) / 100,
    view: Math.round(view),
    hp: Math.round(hp),
    speed: Math.round(speed),
    camo: Math.min(0.8, Math.round(camo * 1000) / 1000),
    heTaken,
  }
}
