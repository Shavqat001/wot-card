export type Country = "ussr" | "germany" | "usa" | "france" | "uk" | "czech" | "china" | "japan" | "poland" | "sweden" | "italy"
export type VehType = "light" | "medium" | "heavy" | "td" | "spg"
export type Role = "scout" | "flank" | "sniper" | "assault" | "breach" | "support" | "ambush"
export type ShellKind = "ap" | "apcr" | "he"
export type ActionKind = "attack" | "defend" | "help" | "retreat" | "armor"
export type Mode = "duel" | "platoon" | "company" | "battle"
export type Outcome = "win" | "loss" | "draw"
export type Distance = 0 | 1 | 2

export interface Shell {
  kind: ShellKind
  damage: number
  pen: number
}

export interface Vehicle {
  id: string
  name: string
  country: Country
  tier: number
  type: VehType
  role: Role
  hp: number
  speed: number
  hull: [number, number, number]
  turret: [number, number, number]
  casemate: boolean
  gun: string
  caliber: number
  reload: number
  dispersion: number
  aim: number
  view: number
  camo: number
  mass: number
  power: number
  traverse: number
  repair: number
  xp: number
  cost: number
  pred: string | null
  shells: [Shell, Shell, Shell]
  heTaken?: number
}

export interface Order {
  kind: ActionKind
  target: number | null
  shell: ShellKind | null
}

export interface LogEvent {
  own: boolean
  focus: boolean
  text: string
}

export interface Unit {
  vid: string
  side: 0 | 1
  player: boolean
  hp: number
  maxHp: number
  distance: Distance
  charge: number
  kits: number
  gunDamaged: boolean
  engineDamaged: boolean
  trackDamaged: boolean
  nextGun: boolean
  nextEngine: boolean
  nextTrack: boolean
  alive: boolean
  present: boolean
  action: ActionKind | null
  target: number | null
  shell: ShellKind | null
  human: boolean
  kit: string[]
  owner?: string
}

export interface DmgGroup {
  name: string
  tier: number
  hp: number
  amount: number
}

export interface FragNote {
  name: string
  tier: number
}

export interface SupportNote {
  allyTier: number
  targetTier: number
  targetHp: number
  amount: number
}

export interface FoeNote {
  name: string
  damage: number
  pens: number
  ricochets: number
  noPens: number
  splashes: number
  misses: number
  killed: boolean
}

export interface BattleStats {
  damage: DmgGroup[]
  frags: FragNote[]
  blocked: number
  support: SupportNote[]
  repairHp: number
  shells: Record<ShellKind, number>
  foes: FoeNote[]
}

export interface Beat {
  shooter: number
  target: number
  verb: string
  killed: boolean
  own: boolean
  damage: number
  caliber: number
  sniper: boolean
  arty: boolean
}

export interface Battle {
  mode: Mode
  played: number
  limit: number
  units: Unit[]
  log: LogEvent[]
  beats: Beat[]
  over: boolean
  outcome: Outcome | null
  playerIndex: number
  stats: BattleStats
  gear: string[]
  ledgers?: Record<string, BattleStats>
}
