import type { ShellKind } from "./types"
import { clamp } from "./rng"

const NORM: Record<ShellKind, number> = { ap: 5, apcr: 2, he: 0 }
const RICO: Record<ShellKind, number | null> = { ap: 70, apcr: 65, he: null }

export interface ArmorResult {
  effective: number
  ricochet: boolean
  threeCal: boolean
  angle: number
}

export function effectiveArmor(
  nominal: number,
  angleDeg: number,
  shell: ShellKind,
  caliber: number,
): ArmorResult {
  if (nominal <= 0) return { effective: 0, ricochet: false, threeCal: false, angle: 0 }
  if (caliber >= nominal * 3) {
    return { effective: nominal, ricochet: false, threeCal: true, angle: 0 }
  }
  const angle = Math.max(0, angleDeg - NORM[shell])
  const limit = RICO[shell]
  if (limit != null && angle >= limit) {
    return { effective: nominal, ricochet: true, threeCal: false, angle }
  }
  const cos = Math.cos((Math.min(angle, 89) * Math.PI) / 180)
  return {
    effective: Math.round(nominal / Math.max(cos, 0.02)),
    ricochet: false,
    threeCal: false,
    angle,
  }
}

export function rollBand(nominal: number, rng: () => number): number {
  return Math.round(nominal * (0.75 + rng() * 0.5))
}

export function splashFraction(nominal: number, penRoll: number): number {
  const t = clamp(nominal / Math.max(penRoll, 1) / 3, 0, 1)
  return 0.08 + (1 - t) * 0.42
}

export function heSplash(damageRoll: number, nominal: number, penRoll: number): number {
  return Math.round(damageRoll * splashFraction(nominal, penRoll))
}

export type PlateName =
  | "hullFront"
  | "hullSide"
  | "hullRear"
  | "turretFront"
  | "turretSide"
  | "turretRear"

export function pickImpact(
  shooterAction: "attack" | "armor",
  targetAction: string | null,
  speedEdge: boolean,
  covered: boolean,
  rng: () => number,
): { plate: PlateName; angle: number } {
  let plate: PlateName = "hullFront"
  let angle = 8
  if (targetAction === "defend") {
    plate = "turretFront"
    angle = 58
  } else if (targetAction === "retreat") {
    /* ромб ~45°: борт под углом, часто рикошет */
    plate = "hullSide"
    angle = 72
  } else if (shooterAction === "armor") {
    plate = "hullFront"
    angle = 52
    if (speedEdge && rng() < 0.4) {
      plate = rng() < 0.75 ? "hullSide" : "hullRear"
      angle = 40
    }
  } else if (speedEdge && rng() < 0.4) {
    plate = rng() < 0.75 ? "hullSide" : "hullRear"
    angle = 20
  }
  if (targetAction === "armor" && plate === "hullFront") angle = Math.max(angle, 52)
  if (targetAction === "armor" && plate !== "hullFront" && plate !== "turretFront") {
    angle = Math.max(angle, 36)
  }
  if (covered) angle += 8
  return { plate, angle }
}

export interface HitInput {
  dispersion: number
  aim: number
  targetSpeed: number
  distanceGap: number
  targetCamo: number
  view: number
  targetDefend: boolean
  targetRetreat: boolean
  targetArmor: boolean
  shooterArmor: boolean
  targetCovered: boolean
  shooterCovered: boolean
  spotted: boolean
  gunDamaged: boolean
}

export function hitChance(s: HitInput): number {
  let p = 0.84
  p -= s.dispersion * 0.22
  p -= Math.max(0, s.aim - 1.5) * 0.03
  p -= s.targetSpeed * 0.0022
  p -= s.distanceGap * 0.06
  p -= s.targetCamo * 0.16
  p += (s.view - 320) * 0.0003
  if (s.targetDefend) p -= 0.14
  if (s.targetRetreat) p -= 0.05
  if (s.targetArmor) p -= 0.03
  if (s.shooterArmor) p -= 0.06
  if (s.targetCovered) p -= 0.09
  if (s.shooterCovered) p += 0.07
  if (s.spotted) p += 0.05
  if (s.gunDamaged) p -= 0.16
  return clamp(p, 0.08, 0.93)
}

export interface ShotInput {
  shell: ShellKind
  damage: number
  pen: number
  caliber: number
  plateNominal: number
  angle: number
  hit: HitInput
  startHp: number
}

export type CritKind = "gun" | "engine" | "track" | "ammo"

export interface ShotOutcome {
  hit: boolean
  ricochet: boolean
  pen: boolean
  splash: boolean
  damage: number
  blocked: number
  effective: number
  penRoll: number
  damageRoll: number
  angle: number
  threeCal: boolean
  crit: CritKind | null
}

export function resolveShot(input: ShotInput, rng: () => number): ShotOutcome {
  const blank: ShotOutcome = {
    hit: false,
    ricochet: false,
    pen: false,
    splash: false,
    damage: 0,
    blocked: 0,
    effective: 0,
    penRoll: 0,
    damageRoll: 0,
    angle: input.angle,
    threeCal: false,
    crit: null,
  }
  if (rng() >= hitChance(input.hit)) return blank
  const armor = effectiveArmor(input.plateNominal, input.angle, input.shell, input.caliber)
  if (armor.ricochet) {
    return { ...blank, hit: true, ricochet: true, effective: armor.effective, angle: armor.angle }
  }
  const penRoll = rollBand(input.pen, rng)
  const damageRoll = rollBand(input.damage, rng)
  const base = {
    ...blank,
    hit: true,
    effective: armor.effective,
    penRoll,
    damageRoll,
    angle: armor.angle,
    threeCal: armor.threeCal,
  }
  if (penRoll >= armor.effective) {
    let crit: CritKind | null = null
    let damage = damageRoll
    if (input.shell !== "he" && rng() < 0.09) {
      const kinds: CritKind[] = ["gun", "engine", "track", "ammo"]
      crit = kinds[Math.floor(rng() * 4)] ?? "gun"
      if (crit === "ammo") damage += Math.round(input.startHp * 0.1)
    }
    return { ...base, pen: true, damage, crit }
  }
  if (input.shell === "he") {
    return { ...base, splash: true, damage: heSplash(damageRoll, input.plateNominal, penRoll) }
  }
  return { ...base, blocked: damageRoll }
}

export function shotVerb(s: ShotOutcome, killed: boolean): string {
  if (!s.hit) return "промах"
  if (s.ricochet) return killed ? "рикошет · уничтожен" : "рикошет"
  if (s.splash) return killed ? "осколки · уничтожен" : "осколки"
  if (!s.pen) return "не пробил"
  return killed ? "пробил · уничтожен" : "пробил"
}

export function salvoCount(charge: number, reload: number): number {
  if (charge < reload || reload <= 0) return 0
  return Math.floor(charge / reload)
}

export function gunWord(charge: number, reload: number): string {
  const n = salvoCount(charge, reload)
  if (n >= 2) return "два выстрела"
  if (n >= 1) return "готов"
  return "ещё удар"
}

export function retreatTo(distance: 0 | 1 | 2, speed: number): 0 | 1 | 2 {
  if (distance >= 2) return 2
  const step = speed >= 48 ? 2 : 1
  const next = distance + step
  return next >= 2 ? 2 : 1
}

export function leaveChance(speed: number, type: string): number {
  let p = 0.08 + Math.max(0, speed - 25) * 0.01
  if (type === "heavy") p *= 0.22
  else if (type === "td" || type === "spg") p *= 0.55
  return clamp(p, 0, 0.72)
}

export function startDistance(type: string): 0 | 1 | 2 {
  if (type === "heavy") return 0
  if (type === "medium") return 1
  return 2
}
