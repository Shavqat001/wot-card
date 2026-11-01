import type { Battle, Mode, Order } from "./types"

export interface LobbySeat {
  name: string
  you: boolean
  side: 0 | 1
}

export interface Lobby {
  code: string
  you: string
  host: boolean
  mode: Mode
  seats: LobbySeat[]
}

export type ClientMsg =
  | { t: "create"; mode: Mode; vehicleId: string; gear: string[] }
  | { t: "join"; code: string; vehicleId: string; gear: string[] }
  | { t: "start" }
  | { t: "order"; order: Order }
  | { t: "back" }
  | { t: "leave" }

export type ServerMsg =
  | ({ t: "lobby" } & Lobby)
  | { t: "battle"; battle: Battle }
  | { t: "wait" }
  | { t: "error"; text: string }
  | { t: "bye" }
