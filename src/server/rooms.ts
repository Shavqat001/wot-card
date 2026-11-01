import { asPlayer, commit, createOnline, orderError, type Pilot } from "../lib/battle"
import { cleanGear } from "../lib/gear"
import { sideCap } from "../lib/modes"
import { mulberry32 } from "../lib/rng"
import type { Battle, Mode, Order } from "../lib/types"
import { byId } from "../lib/vehicles"
import type { Lobby } from "../lib/wire"

const MODES: Mode[] = ["duel", "platoon", "company", "battle"]
const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

interface Seat {
  id: string
  vehicleId: string
  gear: string[]
  side: 0 | 1
}

interface Room {
  code: string
  mode: Mode
  hostId: string
  seats: Seat[]
  battle: Battle | null
  rng: () => number
  orders: Map<string, Order>
}

export interface View {
  you: string
  battle: Battle
}

export type OrderResult =
  | { kind: "error"; text: string }
  | { kind: "wait" }
  | { kind: "battle"; views: View[]; over: boolean }

export type LeaveResult =
  | { kind: "none" }
  | { kind: "empty" }
  | { kind: "closed"; ids: string[] }
  | { kind: "lobby" }
  | { kind: "battle"; views: View[]; over: boolean }

function knownVehicle(id: string): boolean {
  try {
    byId(id)
    return true
  } catch {
    return false
  }
}

export class Hub {
  private rooms = new Map<string, Room>()
  private seq = 0

  private nid(): string {
    this.seq += 1
    return `s${this.seq}`
  }

  private freshCode(): string {
    this.seq += 1
    let n = this.seq + 17
    let code = ""
    for (let i = 0; i < 4; i++) {
      code += ABC[n % ABC.length]
      n = Math.floor(n / ABC.length)
    }
    return this.rooms.has(code) ? `${code}${this.rooms.size}` : code
  }

  private roomOf(code: string): Room | null {
    return this.rooms.get(code.trim().toUpperCase()) ?? null
  }

  lobby(code: string, you: string): Lobby | null {
    const room = this.roomOf(code)
    if (!room || !room.seats.some((s) => s.id === you)) return null
    return {
      code: room.code,
      you,
      host: room.hostId === you,
      mode: room.mode,
      seats: room.seats.map((s) => ({
        name: byId(s.vehicleId).name,
        you: s.id === you,
        side: s.side,
      })),
    }
  }

  seatIds(code: string): string[] {
    return this.roomOf(code)?.seats.map((s) => s.id) ?? []
  }

  create(mode: Mode, vehicleId: string, gear: string[]): { error: string } | { code: string; you: string } {
    if (!MODES.includes(mode)) return { error: "нельзя" }
    if (!knownVehicle(vehicleId)) return { error: "нет машины" }
    const code = this.freshCode()
    const you = this.nid()
    this.rooms.set(code, {
      code,
      mode,
      hostId: you,
      seats: [{ id: you, vehicleId, gear: cleanGear(gear), side: 0 }],
      battle: null,
      rng: mulberry32((this.seq * 997 + 13) >>> 0),
      orders: new Map(),
    })
    return { code, you }
  }

  join(code: string, vehicleId: string, gear: string[]): { error: string } | { code: string; you: string } {
    const room = this.roomOf(code)
    if (!room) return { error: "нет комнаты" }
    if (room.battle && !room.battle.over) return { error: "уже идёт" }
    if (!knownVehicle(vehicleId)) return { error: "нет машины" }
    const cap = sideCap(room.mode)
    const n0 = room.seats.filter((s) => s.side === 0).length
    const n1 = room.seats.filter((s) => s.side === 1).length
    if (n0 >= cap && n1 >= cap) return { error: "комната полна" }
    const prefer: 0 | 1 = n1 < n0 ? 1 : 0
    const side: 0 | 1 = prefer === 0 && n0 >= cap ? 1 : prefer === 1 && n1 >= cap ? 0 : prefer
    const you = this.nid()
    room.seats.push({ id: you, vehicleId, gear: cleanGear(gear), side })
    if (room.battle?.over) room.battle = null
    return { code: room.code, you }
  }

  start(code: string, you: string): OrderResult {
    const room = this.roomOf(code)
    if (!room || room.hostId !== you) return { kind: "error", text: "нельзя" }
    if (room.seats.length < 2) return { kind: "error", text: "жди второго" }
    if (room.battle && !room.battle.over) return { kind: "error", text: "уже идёт" }
    const allies = room.seats.filter((s) => s.side === 0).map(pilot)
    const enemies = room.seats.filter((s) => s.side === 1).map(pilot)
    room.battle = createOnline(room.mode, allies, enemies, room.rng)
    room.orders.clear()
    return { kind: "battle", views: this.views(room), over: false }
  }

  order(code: string, you: string, order: Order): OrderResult {
    const room = this.roomOf(code)
    if (!room?.battle || room.battle.over) return { kind: "error", text: "нет боя" }
    const index = room.battle.units.findIndex((u) => u.owner === you && u.human)
    if (index < 0) return { kind: "error", text: "нельзя" }
    if (room.orders.has(you)) return { kind: "wait" }
    const text = orderError(room.battle, index, order)
    if (text) return { kind: "error", text }
    room.orders.set(you, order)
    if (!this.living(room).every((s) => room.orders.has(s.id))) return { kind: "wait" }
    const views = this.resolve(room)
    return { kind: "battle", views, over: Boolean(room.battle?.over) }
  }

  force(code: string): OrderResult | null {
    const room = this.roomOf(code)
    if (!room?.battle || room.battle.over) return null
    const views = this.resolve(room)
    return { kind: "battle", views, over: Boolean(room.battle?.over) }
  }

  back(code: string, you: string): Lobby | null {
    return this.lobby(code, you)
  }

  leave(code: string, you: string): LeaveResult {
    const room = this.roomOf(code)
    if (!room) return { kind: "none" }
    if (!room.seats.some((s) => s.id === you)) return { kind: "none" }
    room.seats = room.seats.filter((s) => s.id !== you)
    room.orders.delete(you)
    const unit = room.battle?.units.find((u) => u.owner === you)
    if (unit) {
      unit.human = false
      unit.player = false
    }
    if (!room.seats.length) {
      this.rooms.delete(room.code)
      return { kind: "empty" }
    }
    if (!room.battle && room.hostId === you) {
      const ids = room.seats.map((s) => s.id)
      this.rooms.delete(room.code)
      return { kind: "closed", ids }
    }
    if (room.hostId === you) room.hostId = room.seats[0].id
    if (room.battle && !room.battle.over && this.living(room).every((s) => room.orders.has(s.id))) {
      const views = this.resolve(room)
      return { kind: "battle", views, over: Boolean(room.battle?.over) }
    }
    if (room.battle && !room.battle.over) return { kind: "none" }
    return { kind: "lobby" }
  }

  private living(room: Room): Seat[] {
    if (!room.battle) return []
    return room.seats.filter((s) => {
      const u = room.battle?.units.find((unit) => unit.owner === s.id)
      return Boolean(u && u.human && u.alive && u.present)
    })
  }

  private resolve(room: Room): View[] {
    if (!room.battle) return []
    const orders = room.battle.units.map((u) => (u.owner ? room.orders.get(u.owner) ?? null : null))
    let battle = commit(room.battle, orders, room.rng)
    room.orders.clear()
    let guard = 0
    while (!battle.over && guard++ < 24 && !battle.units.some((u) => u.human && u.alive && u.present)) {
      battle = commit(battle, battle.units.map(() => null), room.rng)
    }
    room.battle = battle
    return this.views(room)
  }

  private views(room: Room): View[] {
    if (!room.battle) return []
    return room.seats.flatMap((s) => {
      const index = room.battle?.units.findIndex((u) => u.owner === s.id) ?? -1
      if (index < 0 || !room.battle) return []
      return [{ you: s.id, battle: asPlayer(room.battle, index) }]
    })
  }
}

function pilot(s: Seat): Pilot {
  return { id: s.id, vehicleId: s.vehicleId, gear: s.gear }
}
