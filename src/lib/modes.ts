import type { Mode, VehType } from "./types"

export const MODE_LIMIT: Record<Mode, number> = {
  duel: 14,
  platoon: 12,
  company: 10,
}

export const MODE_NAME: Record<Mode, string> = {
  duel: "Дуэль",
  platoon: "Стычка",
  company: "Рота",
}

export const MODE_SIZE: Record<Mode, string> = {
  duel: "1×1",
  platoon: "5×5",
  company: "7×7",
}

export const MODE_HINT: Record<Mode, string> = {
  duel: "друг напротив",
  platoon: "свои вместе, против ботов",
  company: "свои вместе, против ботов",
}

const COMP: Record<Exclude<Mode, "duel">, VehType[]> = {
  platoon: ["light", "medium", "medium", "heavy", "td"],
  company: ["light", "medium", "medium", "heavy", "heavy", "td", "spg"],
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
