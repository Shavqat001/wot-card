import type { Mode, VehType } from "./types"

export const MODE_LIMIT: Record<Mode, number> = {
  duel: 14,
  platoon: 12,
  company: 10,
  battle: 8,
}

export const MODE_NAME: Record<Mode, string> = {
  duel: "Дуэль",
  platoon: "Взвод",
  company: "Рота",
  battle: "Сражение",
}

export const MODE_SIZE: Record<Mode, string> = {
  duel: "1×1",
  platoon: "5×5",
  company: "7×7",
  battle: "15×15",
}

const COMP: Record<Exclude<Mode, "duel">, VehType[]> = {
  platoon: ["light", "medium", "medium", "heavy", "td"],
  company: ["light", "medium", "medium", "heavy", "heavy", "td", "spg"],
  battle: [
    "light", "light", "light",
    "medium", "medium", "medium", "medium", "medium",
    "heavy", "heavy", "heavy", "heavy",
    "td", "td",
    "spg",
  ],
}

export function teamSlots(mode: Mode, playerType: VehType): VehType[] {
  if (mode === "duel") return [playerType]
  const slots = [...COMP[mode]]
  if (!slots.includes(playerType)) slots[slots.length - 1] = playerType
  return slots
}

export function enemySlots(mode: Exclude<Mode, "duel">): VehType[] {
  return [...COMP[mode]]
}

export function sideCap(mode: Mode): number {
  return mode === "duel" ? 1 : COMP[mode].length
}
