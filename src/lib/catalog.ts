import type { Database } from "sql.js"
import { GEAR, adoptGear, type Gear } from "./gear"
import type { Country, Role, Shell, ShellKind, VehType, Vehicle } from "./types"
import { VEHICLES, adoptVehicles } from "./vehicles"

const EQUIP_COLS: [string, string][] = [
  ["cost", "INTEGER NOT NULL DEFAULT 0"],
  ["reload", "REAL"],
  ["aim", "REAL"],
  ["dispersion", "REAL"],
  ["view", "REAL"],
  ["hp", "REAL"],
  ["speed", "REAL"],
  ["camo", "REAL"],
  ["he", "REAL"],
]

function columns(base: Database, table: string): string[] {
  const info = base.exec(`PRAGMA table_info(${table})`)
  return (info[0]?.values ?? []).map((row) => String(row[1]))
}

function ensureEquipment(base: Database) {
  const have = columns(base, "equipment")
  for (const [name, def] of EQUIP_COLS) {
    if (!have.includes(name)) base.run(`ALTER TABLE equipment ADD COLUMN ${name} ${def}`)
  }
}

function all(base: Database, query: string, params: (string | number | null)[] = []) {
  const stmt = base.prepare(query)
  stmt.bind(params)
  const out: Record<string, unknown>[] = []
  while (stmt.step()) out.push(stmt.getAsObject())
  stmt.free()
  return out
}

export const CATALOG_REV = 1

export function catalogStale(base: Database): boolean {
  try {
    const ver = Number(base.exec("PRAGMA user_version")[0]?.values[0][0] ?? 0)
    if (ver !== CATALOG_REV) return true
    const n = Number(base.exec("SELECT COUNT(*) AS n FROM vehicle")[0]?.values[0][0] ?? 0)
    return n !== VEHICLES.length
  } catch {
    return true
  }
}

export function seedCatalog(base: Database) {
  ensureEquipment(base)
  base.run("BEGIN")
  try {
    fillCatalog(base)
    base.run("COMMIT")
  } catch (err) {
    base.run("ROLLBACK")
    throw err
  }
  base.run(`PRAGMA user_version = ${CATALOG_REV}`)
}

function fillCatalog(base: Database) {
  const gear = base.prepare(
    "INSERT OR REPLACE INTO equipment (id, name, line, cost, reload, aim, dispersion, view, hp, speed, camo, he) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  )
  for (const g of GEAR) {
    gear.run([g.id, g.name, g.line, g.cost, g.reload ?? null, g.aim ?? null, g.dispersion ?? null, g.view ?? null, g.hp ?? null, g.speed ?? null, g.camo ?? null, g.he ?? null])
  }
  gear.free()

  base.run("DELETE FROM vehicle_shell")
  base.run("DELETE FROM vehicle")
  const tank = base.prepare(
    `INSERT OR REPLACE INTO vehicle (
      id, name, country, tier, type, role, hp, speed,
      hull_front, hull_side, hull_rear, turret_front, turret_side, turret_rear,
      casemate, gun, caliber, reload, dispersion, aim, view, camo, mass, power, traverse,
      repair, xp, cost, pred, he_taken
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  const shell = base.prepare("INSERT OR REPLACE INTO vehicle_shell (vehicle_id, kind, damage, pen) VALUES (?, ?, ?, ?)")
  for (const v of VEHICLES) {
    tank.run([
      v.id, v.name, v.country, v.tier, v.type, v.role, v.hp, v.speed,
      v.hull[0], v.hull[1], v.hull[2], v.turret[0], v.turret[1], v.turret[2],
      v.casemate ? 1 : 0, v.gun, v.caliber, v.reload, v.dispersion, v.aim, v.view, v.camo,
      v.mass, v.power, v.traverse, v.repair, v.xp, v.cost, v.pred, v.heTaken ?? null,
    ])
    for (const s of v.shells) {
      shell.run([v.id, s.kind, s.damage, s.pen])
    }
  }
  tank.free()
  shell.free()
}

function asCountry(value: unknown): Country {
  return String(value) as Country
}

function asType(value: unknown): VehType {
  return String(value) as VehType
}

function asRole(value: unknown): Role {
  return String(value) as Role
}

function asKind(value: unknown): ShellKind {
  const kind = String(value)
  return kind === "apcr" || kind === "he" ? kind : "ap"
}

export function readVehicles(base: Database): Vehicle[] {
  const shells = new Map<string, Shell[]>()
  for (const item of all(base, "SELECT vehicle_id, kind, damage, pen FROM vehicle_shell")) {
    const id = String(item.vehicle_id)
    const list = shells.get(id) ?? []
    list.push({ kind: asKind(item.kind), damage: Number(item.damage), pen: Number(item.pen) })
    shells.set(id, list)
  }
  return all(base, "SELECT * FROM vehicle").map((item) => {
    const id = String(item.id)
    const loaded = shells.get(id) ?? []
    const ap = loaded.find((s) => s.kind === "ap") ?? { kind: "ap" as const, damage: 0, pen: 0 }
    const apcr = loaded.find((s) => s.kind === "apcr") ?? { kind: "apcr" as const, damage: 0, pen: 0 }
    const he = loaded.find((s) => s.kind === "he") ?? { kind: "he" as const, damage: 0, pen: 0 }
    return {
      id,
      name: String(item.name),
      country: asCountry(item.country),
      tier: Number(item.tier),
      type: asType(item.type),
      role: asRole(item.role),
      hp: Number(item.hp),
      speed: Number(item.speed),
      hull: [Number(item.hull_front), Number(item.hull_side), Number(item.hull_rear)],
      turret: [Number(item.turret_front), Number(item.turret_side), Number(item.turret_rear)],
      casemate: Boolean(item.casemate),
      gun: String(item.gun),
      caliber: Number(item.caliber),
      reload: Number(item.reload),
      dispersion: Number(item.dispersion),
      aim: Number(item.aim),
      view: Number(item.view),
      camo: Number(item.camo),
      mass: Number(item.mass),
      power: Number(item.power),
      traverse: Number(item.traverse),
      repair: Number(item.repair),
      xp: Number(item.xp),
      cost: Number(item.cost),
      pred: item.pred == null ? null : String(item.pred),
      shells: [ap, apcr, he],
      heTaken: item.he_taken == null ? undefined : Number(item.he_taken),
    }
  })
}

export function readGear(base: Database): Gear[] {
  return all(base, "SELECT * FROM equipment").map((item) => {
    const gear: Gear = {
      id: String(item.id),
      name: String(item.name),
      line: String(item.line),
      cost: Number(item.cost) || 0,
    }
    if (item.reload != null) gear.reload = Number(item.reload)
    if (item.aim != null) gear.aim = Number(item.aim)
    if (item.dispersion != null) gear.dispersion = Number(item.dispersion)
    if (item.view != null) gear.view = Number(item.view)
    if (item.hp != null) gear.hp = Number(item.hp)
    if (item.speed != null) gear.speed = Number(item.speed)
    if (item.camo != null) gear.camo = Number(item.camo)
    if (item.he != null) gear.he = Number(item.he)
    return gear
  })
}

export function hydrateCatalog(base: Database) {
  const tanks = readVehicles(base)
  if (tanks.length) adoptVehicles(tanks)
  const gear = readGear(base)
  if (gear.length) adoptGear(gear)
}
