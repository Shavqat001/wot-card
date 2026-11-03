import { gearById } from "./gear"
import { GOLD_PACKS, GOLD_TO_SILVER, GOLD_TO_XP, shellPackPrice } from "./shop"
import type { ShellKind, Vehicle } from "./types"
import { byId, successors, VEHICLES } from "./vehicles"

export const SAVE_KEY = "angar.v1"

export interface Depot {
  gear: Record<string, number>
  shells: Record<ShellKind, number>
}

export interface Save {
  v: 1 | 2
  silver: number
  gold: number
  bonds: number
  freeXp: number
  owned: string[]
  xp: Record<string, number>
  selected: string
  gear: Record<string, string[]>
  depot: Depot
}

/** Стартовые лёгкие III уровня: СССР, Германия, США. */
export const STARTER_TANKS = ["t46", "pz2", "m3st"] as const

export function parkIds(): string[] {
  return [...STARTER_TANKS]
}

export const PARK = parkIds()

export function emptyDepot(): Depot {
  return { gear: {}, shells: { ap: 0, apcr: 0, he: 0 } }
}

export function freshSave(): Save {
  return {
    v: 2,
    silver: 24000,
    gold: 0,
    bonds: 0,
    freeXp: 0,
    owned: [...STARTER_TANKS],
    xp: {},
    selected: STARTER_TANKS[0],
    gear: {},
    depot: emptyDepot(),
  }
}

export function loadSave(raw: string | null): { save: Save; rebuilt: boolean } {
  if (!raw) return { save: freshSave(), rebuilt: false }
  try {
    const data = JSON.parse(raw) as Partial<Save>
    const save = asSave(data)
    if (!save) return { save: freshSave(), rebuilt: true }
    return { save: normalizeGear(save), rebuilt: false }
  } catch {
    return { save: freshSave(), rebuilt: true }
  }
}

function money(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function asSave(data: Partial<Save> & { credits?: number }): Save | null {
  if (data.v !== 1 && data.v !== 2) return null
  const silver = money(data.silver) ?? money(data.credits)
  const gold = money(data.gold) ?? 0
  const bonds = money(data.bonds) ?? 0
  if (silver == null || !Number.isFinite(gold) || !Number.isFinite(bonds)) return null
  if (typeof data.freeXp !== "number" || !Number.isFinite(data.freeXp)) return null
  if (!Array.isArray(data.owned) || data.owned.some((id) => typeof id !== "string" || !VEHICLES.some((v) => v.id === id))) {
    return null
  }
  if (!data.xp || typeof data.xp !== "object") return null
  if (typeof data.selected !== "string" || !data.owned.includes(data.selected)) return null
  if (data.gear != null && typeof data.gear !== "object") return null
  return {
    v: 2,
    silver: Math.max(0, silver),
    gold,
    bonds,
    freeXp: data.freeXp,
    owned: data.owned,
    xp: data.xp,
    selected: data.selected,
    gear: data.gear ?? {},
    depot: asDepot(data.depot),
  }
}

function asDepot(raw: unknown): Depot {
  const empty = emptyDepot()
  if (!raw || typeof raw !== "object") return empty
  const data = raw as Partial<Depot>
  const gear: Record<string, number> = {}
  if (data.gear && typeof data.gear === "object") {
    for (const [id, n] of Object.entries(data.gear)) {
      if (!gearById(id) || typeof n !== "number" || !Number.isFinite(n) || n <= 0) continue
      gear[id] = Math.floor(n)
    }
  }
  const shells = { ...empty.shells }
  if (data.shells && typeof data.shells === "object") {
    for (const kind of ["ap", "apcr", "he"] as ShellKind[]) {
      const n = data.shells[kind]
      if (typeof n === "number" && Number.isFinite(n) && n > 0) shells[kind] = Math.floor(n)
    }
  }
  return { gear, shells }
}

function normalizeGear(data: Save): Save {
  const gear: Record<string, string[]> = {}
  for (const [vid, list] of Object.entries(data.gear ?? {})) {
    if (!Array.isArray(list)) continue
    const slots: string[] = ["", "", ""]
    const seen = new Set<string>()
    list.slice(0, 3).forEach((id, i) => {
      if (typeof id !== "string" || !id || seen.has(id) || !gearById(id)) return
      seen.add(id)
      slots[i] = id
    })
    if (slots.some(Boolean)) gear[vid] = slots
  }
  return { ...data, gear }
}

function padSlots(list: string[] | undefined): string[] {
  const slots = [...(list ?? ["", "", ""])]
  while (slots.length < 3) slots.push("")
  return slots.slice(0, 3)
}

function withGearQty(depot: Depot, id: string, delta: number): Depot {
  const next = Math.max(0, (depot.gear[id] ?? 0) + delta)
  const gear = { ...depot.gear }
  if (next) gear[id] = next
  else delete gear[id]
  return { ...depot, gear }
}

export function setGear(save: Save, vehicleId: string, index: number, gearId: string | null): Save {
  if (!save.owned.includes(vehicleId) || index < 0 || index > 2) return save
  const slots = padSlots(save.gear[vehicleId])
  const depot = save.depot ?? emptyDepot()
  if (!gearId) {
    const had = slots[index]
    if (!had) return save
    slots[index] = ""
    return { ...save, gear: { ...save.gear, [vehicleId]: slots }, depot: withGearQty(depot, had, 1) }
  }
  if (!gearById(gearId)) return save
  const already = slots.indexOf(gearId)
  if (already === index) return save
  if (already >= 0) {
    const swap = slots[index]
    slots[index] = gearId
    slots[already] = swap
    return { ...save, gear: { ...save.gear, [vehicleId]: slots } }
  }
  if ((depot.gear[gearId] ?? 0) < 1) return save
  const displaced = slots[index]
  slots[index] = gearId
  let nextDepot = withGearQty(depot, gearId, -1)
  if (displaced) nextDepot = withGearQty(nextDepot, displaced, 1)
  return { ...save, gear: { ...save.gear, [vehicleId]: slots }, depot: nextDepot }
}

export function scrapGear(save: Save, vehicleId: string, index: number): Save {
  if (!save.owned.includes(vehicleId) || index < 0 || index > 2) return save
  const slots = padSlots(save.gear[vehicleId])
  if (!slots[index]) return save
  slots[index] = ""
  return { ...save, gear: { ...save.gear, [vehicleId]: slots } }
}

export function scrapDepotGear(save: Save, gearId: string): Save {
  if ((save.depot.gear[gearId] ?? 0) < 1) return save
  return { ...save, depot: withGearQty(save.depot, gearId, -1) }
}

export function buyGear(save: Save, gearId: string, qty = 1): Save | null {
  const item = gearById(gearId)
  if (!item || qty < 1) return null
  const cost = item.cost * qty
  if (save.silver < cost) return null
  return { ...save, silver: save.silver - cost, depot: withGearQty(save.depot ?? emptyDepot(), gearId, qty) }
}

export function buyShells(save: Save, kind: ShellKind, qty: number): Save | null {
  if (qty < 1) return null
  const cost = shellPackPrice(kind, qty)
  if (save.silver < cost) return null
  const shells = { ...(save.depot ?? emptyDepot()).shells }
  shells[kind] += qty
  return { ...save, silver: save.silver - cost, depot: { ...(save.depot ?? emptyDepot()), shells } }
}

export function buyGold(save: Save, pack: number): Save | null {
  const offer = GOLD_PACKS[pack]
  if (!offer || save.silver < offer.silver) return null
  return { ...save, silver: save.silver - offer.silver, gold: save.gold + offer.gold }
}

export function goldToSilver(save: Save, gold: number): Save | null {
  if (gold < 1 || save.gold < gold) return null
  return { ...save, gold: save.gold - gold, silver: save.silver + gold * GOLD_TO_SILVER }
}

export function goldToXp(save: Save, gold: number): Save | null {
  if (gold < 1 || save.gold < gold) return null
  return { ...save, gold: save.gold - gold, freeXp: save.freeXp + gold * GOLD_TO_XP }
}

export function spendShells(save: Save, used: Record<ShellKind, number>): {
  save: Save
  billed: Record<ShellKind, number>
  taken: Record<ShellKind, number>
} {
  const shells = { ...(save.depot ?? emptyDepot()).shells }
  const billed: Record<ShellKind, number> = { ap: 0, apcr: 0, he: 0 }
  const taken: Record<ShellKind, number> = { ap: 0, apcr: 0, he: 0 }
  for (const kind of ["ap", "apcr", "he"] as ShellKind[]) {
    const need = Math.max(0, used[kind] ?? 0)
    const have = shells[kind] ?? 0
    const use = Math.min(need, have)
    shells[kind] = have - use
    taken[kind] = use
    billed[kind] = need - use
  }
  return {
    save: { ...save, depot: { ...(save.depot ?? emptyDepot()), shells } },
    billed,
    taken,
  }
}

export function hasOpenSuccessor(save: Save, id: string): boolean {
  const have = new Set(save.owned)
  return successors(id).some((v) => !have.has(v.id))
}

export function wallet(v: Vehicle): "free" | "tank" {
  return v.pred ? "tank" : "free"
}

export function canBuy(save: Save, id: string, have = new Set(save.owned)): boolean {
  const v = byId(id)
  if (have.has(id)) return false
  if (save.silver < v.cost) return false
  if (v.pred) {
    if (!have.has(v.pred)) return false
    const prev = byId(v.pred)
    /* только следующий уровень ветки, без прыжка через машину */
    if (v.tier > prev.tier + 1) return false
    return (save.xp[v.pred] ?? 0) >= v.xp
  }
  return save.freeXp >= v.xp
}

export function buy(save: Save, id: string): Save | null {
  if (!canBuy(save, id)) return null
  const v = byId(id)
  const xp = { ...save.xp }
  let freeXp = save.freeXp
  if (v.pred) xp[v.pred] = (xp[v.pred] ?? 0) - v.xp
  else freeXp -= v.xp
  return {
    ...save,
    silver: save.silver - v.cost,
    freeXp,
    owned: [...save.owned, id],
    xp,
    selected: id,
  }
}

export function applyReward(
  save: Save,
  vehicleId: string,
  gained: { onVehicle: number; freeXp: number; credits: number },
): Save {
  const xp = { ...save.xp }
  xp[vehicleId] = (xp[vehicleId] ?? 0) + gained.onVehicle
  return {
    ...save,
    silver: Math.max(0, save.silver + gained.credits),
    freeXp: save.freeXp + gained.freeXp,
    xp,
  }
}
