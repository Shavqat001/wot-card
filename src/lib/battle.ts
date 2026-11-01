import type {
  Battle,
  BattleStats,
  Beat,
  FoeNote,
  Mode,
  Order,
  Outcome,
  ShellKind,
  Unit,
  Vehicle,
} from "./types"
import { chooseAi } from "./ai"
import { enemySlots, MODE_LIMIT, teamSlots } from "./modes"
import { emptyShells, repairBill, rewardOf, type Reward } from "./reward"
import { mulberry32 } from "./rng"
import {
  leaveChance,
  pickImpact,
  resolveShot,
  retreatTo,
  salvoCount,
  shotVerb,
  startDistance,
  type HitInput,
  type PlateName,
  type ShotOutcome,
} from "./shot"
import { cleanGear, fit } from "./gear"
import { byId, ofType, VEHICLES } from "./vehicles"

function plateOf(v: Vehicle, plate: PlateName): number {
  const hull = plate.startsWith("hull")
  const box = hull ? v.hull : v.turret
  if (plate.endsWith("Front")) return box[0]
  if (plate.endsWith("Side")) return box[1]
  return box[2]
}

function freshStats(): BattleStats {
  return {
    damage: [],
    frags: [],
    blocked: 0,
    support: [],
    repairHp: 0,
    shells: emptyShells(),
    foes: [],
  }
}

function tank(battle: Battle, u: Unit): Vehicle {
  const kit = u.kit.length ? u.kit : u.player ? battle.gear : []
  return kit.length ? fit(byId(u.vid), kit) : byId(u.vid)
}

function makeUnit(vid: string, side: 0 | 1, player: boolean, gear: string[] = [], human = player): Unit {
  const kit = cleanGear(gear)
  const v = human ? fit(byId(vid), kit) : byId(vid)
  return {
    vid,
    side,
    player,
    hp: v.hp,
    maxHp: v.hp,
    distance: startDistance(v.type),
    charge: Math.max(v.reload, 10),
    kits: 2,
    gunDamaged: false,
    engineDamaged: false,
    trackDamaged: false,
    nextGun: false,
    nextEngine: false,
    nextTrack: false,
    alive: true,
    present: true,
    action: null,
    target: null,
    shell: null,
    human,
    kit: human ? kit : [],
  }
}

function pickWeighted(pool: Vehicle[], rng: () => number, tier: number): Vehicle {
  const weights = pool.map((v) => 4 - Math.min(3, Math.abs(v.tier - tier)))
  let roll = rng() * weights.reduce((sum, w) => sum + w, 0)
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]
    if (roll < 0) return pool[i]
  }
  return pool[pool.length - 1]
}

function pickFill(
  type: Vehicle["type"],
  tier: number,
  rng: () => number,
  used: Map<string, number>,
): Vehicle {
  const typed = ofType(type)
  const open = (span: number) => typed.filter((v) => Math.abs(v.tier - tier) <= span && (used.get(v.id) ?? 0) === 0)
  const near = open(1)
  const pool = near.length ? near : open(4)
  const choice = pickWeighted(pool.length ? pool : typed, rng, tier)
  used.set(choice.id, (used.get(choice.id) ?? 0) + 1)
  return choice
}

function pickDuel(player: Vehicle, rng: () => number): Vehicle {
  const sameTier = rng() < 0.75
  const sameClass = rng() < 0.7
  let pool = VEHICLES.filter((v) => v.id !== player.id)
  if (sameTier) {
    const tier = pool.filter((v) => v.tier === player.tier)
    if (tier.length) pool = tier
  }
  if (sameClass) {
    const klass = pool.filter((v) => v.type === player.type)
    if (klass.length) pool = klass
  }
  return pool[Math.floor(rng() * pool.length)] ?? VEHICLES.find((v) => v.id !== player.id) ?? player
}

export function createBattle(playerId: string, mode: Mode, rng: () => number = mulberry32(1), gear: string[] = []): Battle {
  const kit = cleanGear(gear)
  const player = byId(playerId)
  const slots = teamSlots(mode, player.type)
  const used = new Map<string, number>()
  const allies: Unit[] = []
  let placed = false
  slots.forEach((type, i) => {
    const takePlayer = !placed && (type === player.type || i === slots.length - 1)
    if (takePlayer) {
      placed = true
      used.set(player.id, (used.get(player.id) ?? 0) + 1)
      allies.push(makeUnit(player.id, 0, true, kit))
      return
    }
    allies.push(makeUnit(pickFill(type, player.tier, rng, used).id, 0, false))
  })
  const enemies: Unit[] = mode === "duel"
    ? [makeUnit(pickDuel(player, rng).id, 1, false)]
    : enemySlots(mode).map((type) => makeUnit(pickFill(type, player.tier, rng, used).id, 1, false))
  const units = [...allies, ...enemies]
  return {
    mode,
    played: 0,
    limit: MODE_LIMIT[mode],
    units,
    log: [],
    beats: [],
    over: false,
    outcome: null,
    playerIndex: units.findIndex((u) => u.player),
    stats: freshStats(),
    gear: kit,
  }
}

export function orderError(battle: Battle, index: number, order: Order): string | null {
  const u = battle.units[index]
  if (!u || !u.alive || !u.present || battle.over) return "нельзя"
  const v = tank(battle, u)
  if (order.kind === "help") {
    if (battle.mode === "duel") return "нельзя"
    const t = order.target == null ? undefined : battle.units[order.target]
    if (!t || t.side !== u.side || t === u || !t.alive || !t.present) return "выбери своего"
    return null
  }
  if (order.kind === "defend" || order.kind === "retreat") return null
  if (order.kind === "armor" && u.charge < v.reload) return null
  if (u.charge < v.reload) return "нет заряда"
  const t = order.target == null ? undefined : battle.units[order.target]
  if (!t || t.side === u.side || !t.alive || !t.present) return "выбери цель"
  if (!order.shell) return "выбери цель"
  return null
}

export function actionError(battle: Battle, order: Order): string | null {
  return orderError(battle, battle.playerIndex, order)
}

function speedOf(battle: Battle, u: Unit): number {
  return tank(battle, u).speed * (u.engineDamaged ? 0.6 : 1)
}

function hitInput(battle: Battle, shooter: Unit, target: Unit, covered: Set<number>, spotting: Set<0 | 1>): HitInput {
  const sv = tank(battle, shooter)
  const tv = tank(battle, target)
  return {
    dispersion: sv.dispersion,
    aim: sv.aim,
    targetSpeed: target.action === "attack" || target.action === "retreat" ? speedOf(battle, target) : 0,
    distanceGap: Math.abs(shooter.distance - target.distance),
    targetCamo: tv.camo,
    view: sv.view,
    targetDefend: target.action === "defend",
    targetRetreat: target.action === "retreat",
    targetArmor: target.action === "armor",
    shooterArmor: shooter.action === "armor",
    targetCovered: covered.has(battleIndex(target)),
    shooterCovered: covered.has(battleIndex(shooter)),
    spotted: spotting.has(shooter.side),
    gunDamaged: shooter.gunDamaged,
  }
}

function battleIndex(u: Unit): number {
  return (u as Unit & { __i?: number }).__i ?? -1
}

function shares(raw: { id: number; dmg: number }[], removed: number): { id: number; dmg: number }[] {
  const total = raw.reduce((s, r) => s + r.dmg, 0)
  if (total <= 0 || removed <= 0) return []
  const parts = raw.map((r) => {
    const exact = (removed * r.dmg) / total
    const base = Math.floor(exact)
    return { id: r.id, dmg: base, frac: exact - base }
  })
  let left = removed - parts.reduce((s, p) => s + p.dmg, 0)
  const order = [...parts].sort((a, b) => b.frac - a.frac)
  for (const p of order) {
    if (left <= 0) break
    p.dmg += 1
    left -= 1
  }
  return parts
}

export function resolveRound(battle: Battle, rng: () => number): Battle {
  const next = structuredClone(battle)
  if (next.over) return next
  const units = next.units
  units.forEach((u, i) => {
    ;(u as Unit & { __i: number }).__i = i
  })
  const wasUp = units.map((u) => u.alive && u.present)

  for (const u of units) {
    if (!wasUp[battleIndex(u)]) continue
    u.gunDamaged = u.nextGun
    u.engineDamaged = u.nextEngine
    u.trackDamaged = u.nextTrack
    u.nextGun = false
    u.nextEngine = false
    u.nextTrack = false
  }

  const covered = new Set<number>()
  const spotting = new Set<0 | 1>()
  for (const u of units) {
    if (!wasUp[battleIndex(u)] || u.action !== "help" || u.target == null) continue
    const t = units[u.target]
    if (!t || t.side !== u.side || t === u || !wasUp[u.target]) continue
    covered.add(u.target)
    spotting.add(u.side)
  }

  type Pending = {
    shooter: number
    target: number
    result: ShotOutcome
    caliber: number
    sniper: boolean
    arty: boolean
  }
  const pending: Pending[] = []

  for (const u of units) {
    const i = battleIndex(u)
    if (!wasUp[i]) continue
    const v = tank(next, u)
    const shooting = u.action === "attack" || (u.action === "armor" && u.charge >= v.reload)
    const targetIndex = u.target
    const target = targetIndex == null ? undefined : units[targetIndex]
    const n = shooting && target && u.shell && targetIndex != null && wasUp[targetIndex] && target.side !== u.side
      ? salvoCount(u.charge, v.reload)
      : 0
    if (n <= 0 || !target || !u.shell) continue
    const sv = v
    const shell = sv.shells.find((s) => s.kind === u.shell) ?? sv.shells[0]
    for (let s = 0; s < n; s++) {
      const speedEdge = u.action === "attack" && speedOf(next, u) >= speedOf(next, target) + 15
      const impact = pickImpact(
        u.action === "armor" ? "armor" : "attack",
        target.action,
        speedEdge,
        covered.has(u.target!),
        rng,
      )
      const result = resolveShot({
        shell: shell.kind,
        damage: shell.damage,
        pen: shell.pen,
        caliber: sv.caliber,
        plateNominal: plateOf(byId(target.vid), impact.plate),
        angle: impact.angle,
        hit: hitInput(next, u, target, covered, spotting),
        startHp: target.hp,
      }, rng)
      const taken = tank(next, target).heTaken ?? 1
      if (shell.kind === "he" && taken < 1 && result.damage > 0) {
        result.damage = Math.round(result.damage * taken)
      }
      pending.push({
        shooter: i,
        target: u.target!,
        result,
        caliber: sv.caliber,
        sniper: sv.type === "td" || sv.role === "sniper",
        arty: sv.type === "spg",
      })
      const fired = book(next, i)
      if (fired) fired.shells[shell.kind] += 1
    }
    u.charge -= n * v.reload
  }

  for (const u of units) {
    const i = battleIndex(u)
    if (!wasUp[i] || u.action !== "help" || u.target == null) continue
    const t = units[u.target]
    if (!t || t.side !== u.side || t === u || !wasUp[u.target]) continue
    const missing = t.maxHp - t.hp
    if (u.kits > 0 && missing > 0) {
      const heal = Math.min(missing, Math.round(t.maxHp * 0.08 + 40))
      t.hp += heal
      u.kits -= 1
      const medic = book(next, i)
      if (medic) medic.repairHp += heal
      const own = u.player || t.player
      next.log.push({
        own,
        focus: own,
        text: `${byId(u.vid).name} чинит ${byId(t.vid).name}`,
      })
    }
  }

  const hpLeft = units.map((u) => u.hp)
  const byTarget = new Map<number, Pending[]>()
  for (const p of pending) {
    const list = byTarget.get(p.target) ?? []
    list.push(p)
    byTarget.set(p.target, list)
  }

  const player = next.playerIndex
  const helpedBy = new Map<number, number>()
  for (const u of units) {
    const i = battleIndex(u)
    if (!wasUp[i] || u.action !== "help" || u.target == null || !covered.has(u.target)) continue
    if (book(next, i)) helpedBy.set(u.target, i)
  }

  const dead = new Set<number>()
  for (const [ti, shots] of byTarget) {
    const raw = new Map<number, number>()
    for (const shot of shots) {
      const wall = book(next, ti)
      if (shot.result.blocked > 0 && wall) wall.blocked += shot.result.blocked
      if (shot.result.crit === "gun") units[ti].nextGun = true
      if (shot.result.crit === "engine") units[ti].nextEngine = true
      if (shot.result.crit === "track") units[ti].nextTrack = true
      if (shot.result.damage <= 0) continue
      raw.set(shot.shooter, (raw.get(shot.shooter) ?? 0) + shot.result.damage)
    }
    const entries = [...raw.entries()].map(([id, dmg]) => ({ id, dmg }))
    const totalRaw = entries.reduce((s, e) => s + e.dmg, 0)
    const removed = Math.min(totalRaw, hpLeft[ti])
    units[ti].hp = hpLeft[ti] - removed
    if (units[ti].hp <= 0) {
      units[ti].hp = 0
      units[ti].alive = false
      units[ti].present = false
      dead.add(ti)
    }
    const parts = shares(entries, removed)
    const tv = byId(units[ti].vid)
    for (const part of parts) {
      if (part.dmg <= 0) continue
      const shooterBook = book(next, part.id)
      if (shooterBook) addDamage(shooterBook, tv.name, tv.tier, units[ti].maxHp, part.dmg)
      const helper = helpedBy.get(part.id)
      if (helper != null) {
        const helpBook = book(next, helper)
        const ally = byId(units[helper].vid)
        if (helpBook) {
          helpBook.support.push({
            allyTier: ally.tier,
            targetTier: tv.tier,
            targetHp: units[ti].maxHp,
            amount: part.dmg,
          })
        }
      }
    }
    if (dead.has(ti) && entries.length) {
      const top = Math.max(...entries.map((e) => e.dmg))
      const leaders = entries.filter((e) => e.dmg === top)
      const winner = leaders.find((e) => e.id === player) ?? leaders[0]
      if (winner) {
        const fragBook = book(next, winner.id)
        if (fragBook) fragBook.frags.push({ name: tv.name, tier: tv.tier })
      }
    }
  }

  const lastDamage = new Map<number, number>()
  pending.forEach((p, i) => {
    if (p.result.damage > 0) lastDamage.set(p.target, i)
  })
  const beats: Beat[] = []
  pending.forEach((p, i) => {
    const killed = dead.has(p.target) && lastDamage.get(p.target) === i
    const own = p.shooter === player || p.target === player
    const verb = !p.result.hit ? "промах"
      : p.result.ricochet ? "рикошет"
      : p.result.splash ? "осколки"
      : !p.result.pen ? "не пробил"
      : "пробил"
    beats.push({
      shooter: p.shooter,
      target: p.target,
      verb,
      killed,
      own,
      damage: p.result.damage,
      caliber: p.caliber,
      sniper: p.sniper,
      arty: p.arty,
    })
    const shooterBook = book(next, p.shooter)
    if (shooterBook) touchFoe(shooterBook, byId(units[p.target].vid).name, verb, killed)
    next.log.push({
      own,
      focus: own || killed,
      text: `${byId(units[p.shooter].vid).name} → ${byId(units[p.target].vid).name}: ${shotVerb(p.result, killed)}`,
    })
  })
  next.beats = beats
  syncFoeDamage(next.stats)
  if (next.ledgers) {
    for (const ledger of Object.values(next.ledgers)) syncFoeDamage(ledger)
  }

  for (const u of units) {
    const i = battleIndex(u)
    if (!wasUp[i] || !u.alive || !u.present || u.action !== "retreat" || u.trackDamaged) continue
    const v = byId(u.vid)
    const speed = speedOf(next, u)
    if (u.distance >= 2) {
      if (rng() < leaveChance(speed, v.type)) {
        u.present = false
        const own = u.player
        next.log.push({ own, focus: true, text: `${v.name} ушёл` })
      }
    } else {
      u.distance = retreatTo(u.distance, speed)
    }
  }

  for (let i = 0; i < units.length; i++) {
    if (wasUp[i]) units[i].charge += 10
  }

  next.played += 1
  const alive = (side: 0 | 1) => units.some((u) => u.side === side && u.alive && u.present)
  const a = alive(0)
  const b = alive(1)
  if (!a || !b) {
    finish(next, !a && !b ? "draw" : a ? "win" : "loss")
  } else if (next.played >= next.limit) {
    const sum = (side: 0 | 1) => units
      .filter((u) => u.side === side && u.alive && u.present)
      .reduce((s, u) => s + u.hp, 0)
    const hs = sum(0)
    const he = sum(1)
    finish(next, hs === he ? "draw" : hs > he ? "win" : "loss")
  }
  return next
}

function book(battle: Battle, index: number): BattleStats | null {
  if (index === battle.playerIndex) return battle.stats
  return battle.ledgers?.[String(index)] ?? null
}

function emptyFoe(name: string): FoeNote {
  return { name, damage: 0, pens: 0, ricochets: 0, noPens: 0, splashes: 0, misses: 0, killed: false }
}

function touchFoe(stats: BattleStats, name: string, verb: string, killed: boolean) {
  let f = stats.foes.find((x) => x.name === name)
  if (!f) {
    f = emptyFoe(name)
    stats.foes.push(f)
  }
  if (verb === "пробил") f.pens += 1
  else if (verb === "рикошет") f.ricochets += 1
  else if (verb === "не пробил") f.noPens += 1
  else if (verb === "осколки") f.splashes += 1
  else f.misses += 1
  if (killed) f.killed = true
}

function syncFoeDamage(stats: BattleStats) {
  for (const d of stats.damage) {
    let f = stats.foes.find((x) => x.name === d.name)
    if (!f) {
      f = emptyFoe(d.name)
      stats.foes.push(f)
    }
    f.damage = d.amount
  }
  for (const frag of stats.frags) {
    const f = stats.foes.find((x) => x.name === frag.name)
    if (f) f.killed = true
  }
}

function addDamage(stats: BattleStats, name: string, tier: number, hp: number, amount: number) {
  const found = stats.damage.find((d) => d.name === name && d.tier === tier && d.hp === hp)
  if (found) found.amount += amount
  else stats.damage.push({ name, tier, hp, amount })
}

function finish(battle: Battle, outcome: Outcome) {
  battle.over = true
  battle.outcome = outcome
}

export interface Pilot {
  id: string
  vehicleId: string
  gear: string[]
}

function fillSide(
  types: Vehicle["type"][],
  pilots: Pilot[],
  side: 0 | 1,
  tier: number,
  rng: () => number,
  used: Map<string, number>,
  hostHere: boolean,
): Unit[] {
  const taken = new Set<number>()
  const placed = new Map<number, Unit>()
  pilots.forEach((p, pi) => {
    const v = byId(p.vehicleId)
    let idx = types.findIndex((t, i) => !taken.has(i) && t === v.type)
    if (idx < 0) idx = types.findIndex((_, i) => !taken.has(i))
    if (idx < 0) return
    taken.add(idx)
    used.set(v.id, (used.get(v.id) ?? 0) + 1)
    const unit = makeUnit(v.id, side, hostHere && pi === 0, p.gear, true)
    unit.owner = p.id
    placed.set(idx, unit)
  })
  return types.map((type, i) => placed.get(i) ?? makeUnit(pickFill(type, tier, rng, used).id, side, false))
}

export function createOnline(mode: Mode, allies: Pilot[], enemies: Pilot[], rng: () => number): Battle {
  const host = byId(allies[0].vehicleId)
  const used = new Map<string, number>()
  const left = fillSide(teamSlots(mode, host.type), allies, 0, host.tier, rng, used, true)
  const rival = enemies[0]
  const right = mode === "duel"
    ? rival
      ? fillSide([byId(rival.vehicleId).type], enemies, 1, host.tier, rng, used, false)
      : [makeUnit(pickDuel(host, rng).id, 1, false)]
    : fillSide(enemySlots(mode), enemies, 1, host.tier, rng, used, false)
  const units = [...left, ...right]
  const playerIndex = units.findIndex((u) => u.player)
  const ledgers: Record<string, BattleStats> = {}
  units.forEach((u, i) => {
    if (u.human && i !== playerIndex) ledgers[String(i)] = freshStats()
  })
  return {
    mode,
    played: 0,
    limit: MODE_LIMIT[mode],
    units,
    log: [],
    beats: [],
    over: false,
    outcome: null,
    playerIndex,
    stats: freshStats(),
    gear: units[playerIndex]?.kit ?? [],
    ledgers,
  }
}

export function asPlayer(battle: Battle, index: number): Battle {
  const view = structuredClone(battle)
  const mine = view.units[index]
  if (!mine) return view
  if (mine.side === 1 && view.outcome && view.outcome !== "draw") {
    view.outcome = view.outcome === "win" ? "loss" : "win"
  }
  if (mine.side === 1) {
    for (const u of view.units) u.side = u.side === 0 ? 1 : 0
  }
  view.stats = index === battle.playerIndex ? view.stats : (view.ledgers?.[String(index)] ?? freshStats())
  view.playerIndex = index
  view.gear = [...mine.kit]
  delete view.ledgers
  view.units.forEach((u, i) => {
    u.player = i === index
  })
  view.beats = view.beats.map((b) => ({ ...b, own: b.shooter === index || b.target === index }))
  return view
}

export function commit(battle: Battle, orders: (Order | null)[], rng: () => number): Battle {
  const next = structuredClone(battle)
  if (next.over) return next
  for (let i = 0; i < next.units.length; i++) {
    const u = next.units[i]
    if (!u.alive || !u.present) {
      u.action = null
      u.target = null
      continue
    }
    const order = orders[i] ?? null
    if ((u.human || u.player) && order && !orderError(next, i, order)) {
      u.action = order.kind
      u.target = order.target
      u.shell = order.shell
    } else if (u.human || u.player) {
      u.action = "defend"
      u.target = null
      u.shell = null
    } else {
      const ai = chooseAi(next, u, rng)
      u.action = ai.kind
      u.target = ai.target
      u.shell = ai.shell
    }
  }
  return resolveRound(next, rng)
}

export function step(battle: Battle, order: Order | null, rng: () => number): Battle {
  const next = structuredClone(battle)
  if (next.over) return next
  for (let i = 0; i < next.units.length; i++) {
    const u = next.units[i]
    if (!u.alive || !u.present) {
      u.action = null
      u.target = null
      continue
    }
    if (u.player && order && !actionError(next, order)) {
      u.action = order.kind
      u.target = order.target
      u.shell = order.shell
    } else {
      const ai = chooseAi(next, u, rng)
      u.action = ai.kind
      u.target = ai.target
      u.shell = ai.shell
    }
  }
  return resolveRound(next, rng)
}

export function autoFinish(battle: Battle, rng: () => number): Battle {
  let s = battle
  let guard = 0
  while (!s.over && guard++ < 24) {
    const u = s.units[s.playerIndex]
    if (u?.alive && u.present) break
    s = step(s, null, rng)
  }
  return s
}

export function settle(
  battle: Battle,
  hasSuccessor: boolean,
  ammo?: { billed: Record<ShellKind, number>; taken: Record<ShellKind, number> },
): Reward | null {
  if (!battle.over || !battle.outcome) return null
  const u = battle.units[battle.playerIndex]
  const v = byId(u.vid)
  const left = u.alive && !u.present
  const stayed = u.alive && u.present
  return rewardOf({
    shooterTier: v.tier,
    ownHp: u.maxHp,
    damage: battle.stats.damage,
    frags: battle.stats.frags,
    blocked: battle.stats.blocked,
    support: battle.stats.support,
    repairHp: battle.stats.repairHp,
    stayed,
    left,
    outcome: battle.outcome,
    shells: ammo?.billed ?? battle.stats.shells,
    depotShells: ammo?.taken,
    repairCost: repairBill(v.tier, u.hp, u.maxHp),
    hasSuccessor,
  })
}

export function shellOf(v: Vehicle, kind: ShellKind) {
  return v.shells.find((s) => s.kind === kind) ?? v.shells[0]
}
