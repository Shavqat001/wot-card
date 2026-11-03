import { fit } from "./gear"
import type { Battle, Order, ShellKind, Unit, Vehicle } from "./types"
import { byId } from "./vehicles"

function pickShell(v: Vehicle, target: Vehicle): ShellKind {
  if (v.type === "spg") return "he"
  const plate = target.hull[0]
  const ap = v.shells[0]
  const apcr = v.shells[1]
  const he = v.shells[2]
  if (ap.pen * 0.85 >= plate) return "ap"
  if (ap.pen < plate && apcr.pen >= plate) return "apcr"
  if (plate > ap.pen && he.damage >= 280) return "he"
  return "ap"
}

export function chooseAi(battle: Battle, u: Unit, rng: () => number): Order {
  const none = (kind: Order["kind"]): Order => ({ kind, target: null, shell: null })
  const base = byId(u.vid)
  const v = u.kit.length ? fit(base, u.kit) : base
  const enemies = battle.units.filter((x) => x.side !== u.side && x.alive && x.present)
  const loaded = u.charge >= v.reload
  if (!loaded) {
    if (v.type === "heavy") return none("armor")
    if (u.hp / u.maxHp < 0.45 && rng() < 0.55) return none("retreat")
    return none("defend")
  }
  if (!enemies.length) return none("defend")
  const wounded = [...enemies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
  let target = wounded[wounded.length > 1 && rng() < 0.5 ? 1 : 0]
  if (v.type === "light" && rng() < 0.4) {
    target = [...enemies].sort((a, b) => byId(a.vid).hull[1] - byId(b.vid).hull[1])[0]
  }
  const shell = pickShell(v, byId(target.vid))
  const idx = battle.units.indexOf(target)
  const frontHolds = v.hull[0] >= byId(target.vid).shells[0].pen * 0.9
  if (u.hp / u.maxHp < 0.34 && rng() < 0.5) return none("retreat")
  if ((v.type === "heavy" || frontHolds) && rng() < 0.55) {
    return { kind: "armor", target: idx, shell }
  }
  if (frontHolds && rng() < 0.28) return none("retreat")
  return { kind: "attack", target: idx, shell }
}
