import { SHELL_LABEL } from "./text"
import type { Outcome, ShellKind } from "./types"

/** Полный ремонт по уровню. Цены 9–10 заложены заранее. */
export const FULL_REPAIR: Record<number, number> = {
  1: 400,
  2: 800,
  3: 1000,
  4: 4000,
  5: 7000,
  6: 10000,
  7: 15000,
  8: 18000,
  9: 22000,
  10: 32000,
}

/** Цена обычного ББ. БП = ×4, ОФ = ×2. V уровень — 800, как в примере. */
export const AP_PRICE: Record<number, number> = {
  1: 80,
  2: 150,
  3: 250,
  4: 400,
  5: 800,
  6: 1100,
  7: 1500,
  8: 2000,
  9: 2600,
  10: 3200,
}

export const TIER_BASE: Record<number, number> = {
  1: 180,
  2: 220,
  3: 260,
  4: 300,
  5: 380,
  6: 460,
  7: 560,
  8: 680,
  9: 820,
  10: 980,
}

export interface XpLine {
  label: string
  value: number
}

export interface CreditLine {
  label: string
  value: number
}

export interface RewardInput {
  shooterTier: number
  ownHp: number
  damage: { name: string; tier: number; hp: number; amount: number }[]
  frags: { name: string; tier: number }[]
  blocked: number
  support: { allyTier: number; targetTier: number; targetHp: number; amount: number }[]
  repairHp: number
  stayed: boolean
  left: boolean
  outcome: Outcome
  shells: Record<ShellKind, number>
  depotShells?: Record<ShellKind, number>
  repairCost: number
  hasSuccessor: boolean
}

export interface Reward {
  xp: number
  onVehicle: number
  freeXp: number
  credits: number
  xpLines: XpLine[]
  creditLines: CreditLine[]
}

export function levelMult(targetTier: number, shooterTier: number): number {
  let scaled = 10 + (targetTier - shooterTier)
  if (scaled < 6) scaled = 6
  if (scaled > 14.5) scaled = 14.5
  return scaled / 10
}

export function damageXp(
  amount: number,
  targetHp: number,
  targetTier: number,
  shooterTier: number,
): number {
  if (amount <= 0 || targetHp <= 0) return 0
  const base = TIER_BASE[targetTier] ?? 380
  const scaled = (() => {
    let s = 10 + (targetTier - shooterTier)
    if (s < 6) s = 6
    if (s > 14.5) s = 14.5
    return s
  })()
  return Math.round((amount / targetHp) * base * scaled / 10)
}

export function shellPrice(kind: ShellKind, tier: number): number {
  const ap = AP_PRICE[tier] ?? AP_PRICE[5]
  if (kind === "ap") return ap
  if (kind === "apcr") return ap * 4
  return ap * 2
}

export function shellCost(shells: Record<ShellKind, number>, tier: number): number {
  return shells.ap * shellPrice("ap", tier)
    + shells.apcr * shellPrice("apcr", tier)
    + shells.he * shellPrice("he", tier)
}

export function fullRepair(tier: number): number {
  return FULL_REPAIR[tier] ?? FULL_REPAIR[5]
}

/** Доля потерянной прочности × полный ремонт уровня. 50% HP → половина цены. Гибель → полная. */
export function repairBill(tier: number, hp: number, maxHp: number): number {
  const full = fullRepair(tier)
  if (maxHp <= 0) return full
  const lost = Math.max(0, Math.min(1, 1 - Math.max(0, hp) / maxHp))
  return Math.round(full * lost)
}

function outcomeXp(pre: number, outcome: Outcome): number {
  if (outcome === "win") return Math.max(0, Math.round(pre * 15 / 10))
  if (outcome === "loss") return Math.max(0, Math.round(pre * 6 / 10))
  return Math.max(0, Math.round(pre))
}

function outcomeCredits(gross: number, outcome: Outcome): number {
  if (outcome === "win") return Math.round(gross * 12 / 10)
  if (outcome === "loss") return Math.round(gross * 85 / 100)
  return Math.round(gross)
}

export function rewardOf(input: RewardInput): Reward {
  const xpLines: XpLine[] = []
  let pre = 0
  for (const hit of input.damage) {
    const value = damageXp(hit.amount, hit.hp, hit.tier, input.shooterTier)
    if (value === 0) continue
    xpLines.push({ label: `урон · ${hit.name}`, value })
    pre += value
  }
  for (const frag of input.frags) {
    const base = TIER_BASE[frag.tier] ?? 380
    const value = Math.round(0.22 * base)
    xpLines.push({ label: `фраг · ${frag.name}`, value })
    pre += value
  }
  if (input.blocked > 0 && input.ownHp > 0) {
    const ownBase = TIER_BASE[input.shooterTier] ?? 380
    const value = Math.round((input.blocked / input.ownHp) * ownBase * 0.4)
    if (value !== 0) {
      xpLines.push({ label: "блок", value })
      pre += value
    }
  }
  const supportGroups = new Map<string, RewardInput["support"][number]>()
  for (const s of input.support) {
    const key = `${s.allyTier}:${s.targetTier}:${s.targetHp}`
    const prev = supportGroups.get(key)
    if (prev) prev.amount += s.amount
    else supportGroups.set(key, { ...s })
  }
  let supportXp = 0
  let supportDamage = 0
  for (const s of supportGroups.values()) {
    const dx = damageXp(s.amount, s.targetHp, s.targetTier, s.allyTier)
    supportXp += Math.round(0.55 * dx)
    supportDamage += s.amount
  }
  if (supportXp !== 0) {
    xpLines.push({ label: "поддержка", value: supportXp })
    pre += supportXp
  }
  if (input.repairHp > 0) {
    const value = Math.round(input.repairHp * 0.2)
    xpLines.push({ label: "ремонт", value })
    pre += value
  }
  if (input.stayed) {
    const bonus = Math.floor(pre / 10)
    xpLines.push({ label: "в строю", value: bonus })
    pre += bonus
  } else if (input.left) {
    const pen = Math.floor(pre / 5)
    xpLines.push({ label: "ушёл", value: -pen })
    pre -= pen
  }
  const xp = outcomeXp(pre, input.outcome)
  const delta = xp - pre
  if (delta !== 0) {
    const label = input.outcome === "win" ? "победа" : input.outcome === "loss" ? "поражение" : "ничья"
    xpLines.push({ label, value: delta })
  }
  const freeXp = input.hasSuccessor ? Math.round(xp * 0.05) : xp
  const onVehicle = xp - freeXp

  const damageSum = input.damage.reduce((s, d) => s + d.amount, 0)
  const fragCredits = input.frags.reduce((s, f) => s + 700 * f.tier, 0)
  const grossRaw = damageSum * (260 + 42 * input.shooterTier) / 100
    + fragCredits
    + input.blocked * 3 / 10
    + supportDamage * 45 / 100
  const gross = outcomeCredits(grossRaw, input.outcome)
  const ammo = shellCost(input.shells, input.shooterTier)
  const credits = gross - ammo - input.repairCost
  const creditLines: CreditLine[] = [{ label: "начислено", value: gross }]
  const kinds: ShellKind[] = ["ap", "apcr", "he"]
  for (const kind of kinds) {
    const stock = input.depotShells?.[kind] ?? 0
    if (stock) creditLines.push({ label: `склад · ${SHELL_LABEL[kind]} × ${stock}`, value: 0 })
    const n = input.shells[kind]
    if (!n) continue
    creditLines.push({
      label: `пополнение · ${SHELL_LABEL[kind]} × ${n}`,
      value: -(n * shellPrice(kind, input.shooterTier)),
    })
  }
  creditLines.push({ label: "ремонт", value: -input.repairCost })
  return { xp, onVehicle, freeXp, credits, xpLines, creditLines }
}

export function emptyShells(): Record<ShellKind, number> {
  return { ap: 0, apcr: 0, he: 0 }
}
