import { GEAR } from "./gear"
import { shellPrice } from "./reward"
import type { ShellKind } from "./types"

export const GOLD_TO_SILVER = 400
export const GOLD_TO_XP = 25

export const GOLD_PACKS = [
  { gold: 100, silver: 45000 },
  { gold: 500, silver: 210000 },
  { gold: 2000, silver: 800000 },
] as const

export const SHELL_PACKS: { kind: ShellKind; qty: number }[] = [
  { kind: "ap", qty: 20 },
  { kind: "apcr", qty: 10 },
  { kind: "he", qty: 15 },
]

export const XP_OFFERS = [
  { gold: 10, xp: 250 },
  { gold: 40, xp: 1000 },
  { gold: 100, xp: 2500 },
] as const

export const SILVER_OFFERS = [
  { gold: 10, silver: 4000 },
  { gold: 50, silver: 20000 },
  { gold: 200, silver: 80000 },
] as const

export function shellPackPrice(kind: ShellKind, qty: number): number {
  return qty * shellPrice(kind, 5)
}

export const SHOP_GEAR = GEAR
