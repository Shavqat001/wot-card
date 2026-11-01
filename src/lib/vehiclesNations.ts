import type { Country, Role, Shell, Vehicle, VehType } from "./types"

function guns(
  ap: [number, number],
  apcr: [number, number],
  he: [number, number],
): [Shell, Shell, Shell] {
  return [
    { kind: "ap", damage: ap[0], pen: ap[1] },
    { kind: "apcr", damage: apcr[0], pen: apcr[1] },
    { kind: "he", damage: he[0], pen: he[1] },
  ]
}

const XP = [0, 40, 90, 220, 1100, 2400, 2800, 5200, 9000, 15000, 25000]
const COST = [0, 0, 3000, 5200, 8500, 14000, 24000, 44000, 76000, 125000, 210000]

type Node = {
  id: string
  name: string
  tier: number
  gun: string
  caliber: number
  pred?: string | null
  casemate?: boolean
}

function shellsOf(type: VehType, tier: number, caliber: number): [Shell, Shell, Shell] {
  const dmg = Math.round(caliber * (type === "spg" ? 4.1 : type === "td" ? 2.3 : 1.85) + tier * 10)
  const pen = Math.round(caliber * 0.88 + tier * 11)
  return guns(
    [dmg, pen],
    [dmg, Math.round(pen * 1.34)],
    [Math.round(dmg * (type === "spg" ? 1.35 : 1.48)), Math.round(caliber * 0.3)],
  )
}

function body(type: VehType, tier: number): Pick<
  Vehicle,
  "hp" | "speed" | "hull" | "turret" | "reload" | "dispersion" | "aim" | "view" | "camo" | "mass" | "power" | "traverse" | "repair"
> {
  const hp0 = { light: 150, medium: 190, heavy: 230, td: 170, spg: 145 }[type]
  const hpS = { light: 68, medium: 126, heavy: 145, td: 116, spg: 86 }[type]
  const speed = { light: 58, medium: 42, heavy: 28, td: 36, spg: 22 }[type] + Math.max(0, 4 - Math.abs(tier - 5))
  const front = { light: 12, medium: 28, heavy: 48, td: 36, spg: 14 }[type] + tier * { light: 6, medium: 9, heavy: 14, td: 10, spg: 4 }[type]
  const side = Math.round(front * 0.72)
  const rear = Math.round(front * 0.5)
  return {
    hp: hp0 + hpS * tier,
    speed,
    hull: [front, side, rear],
    turret: [Math.round(front * 1.08), side, rear],
    reload: { light: 3.4, medium: 5.8, heavy: 8.2, td: 7.1, spg: 13.5 }[type] + tier * 0.12,
    dispersion: { light: 0.42, medium: 0.4, heavy: 0.44, td: 0.36, spg: 0.72 }[type],
    aim: { light: 2.0, medium: 2.3, heavy: 2.8, td: 2.1, spg: 4.6 }[type],
    view: 280 + tier * 18,
    camo: { light: 0.28, medium: 0.16, heavy: 0.08, td: 0.22, spg: 0.12 }[type],
    mass: { light: 8, medium: 22, heavy: 38, td: 20, spg: 16 }[type] + tier * 3,
    power: { light: 12, medium: 16, heavy: 18, td: 14, spg: 10 }[type] + tier,
    traverse: { light: 42, medium: 36, heavy: 28, td: 30, spg: 16 }[type],
    repair: 400 * tier,
  }
}

function line(country: Country, type: VehType, role: Role, nodes: Node[]): Vehicle[] {
  return nodes.map((n, i) => {
    const pred = n.pred === undefined ? (i === 0 ? null : nodes[i - 1].id) : n.pred
    const root = pred === null
    const casemate = n.casemate ?? (type === "td" || type === "spg")
    const built = body(type, n.tier)
    return {
      id: n.id,
      name: n.name,
      country,
      tier: n.tier,
      type,
      role,
      ...built,
      turret: casemate ? built.hull : built.turret,
      casemate,
      gun: n.gun,
      caliber: n.caliber,
      xp: root ? 40 : XP[n.tier],
      cost: root ? 0 : COST[n.tier],
      pred,
      shells: shellsOf(type, n.tier, n.caliber),
    }
  })
}

/** Деревья Франции, Британии, Чехословакии, Китая, Японии, Польши, Швеции, Италии. Свои числа. */
export const NATIONS: Vehicle[] = [
  ...line("france", "light", "scout", [
    { id: "rft", name: "Renault FT", tier: 1, gun: "37 мм", caliber: 37 },
    { id: "h35", name: "Hotchkiss H35", tier: 2, gun: "37 мм", caliber: 37 },
    { id: "amx38", name: "AMX 38", tier: 3, gun: "37 мм", caliber: 37 },
    { id: "amx40", name: "AMX 40", tier: 4, gun: "47 мм", caliber: 47 },
    { id: "amx12t", name: "AMX 12t", tier: 5, gun: "75 мм", caliber: 75 },
    { id: "amx1375", name: "AMX 13 75", tier: 6, gun: "75 мм", caliber: 75 },
    { id: "amx1390", name: "AMX 13 90", tier: 7, gun: "90 мм", caliber: 90 },
    { id: "bc12t", name: "Bat.-Châtillon 12t", tier: 8, gun: "90 мм", caliber: 90 },
    { id: "lynx", name: "Lynx 6x6", tier: 9, gun: "90 мм", caliber: 90 },
    { id: "ebr105", name: "EBR 105", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("france", "medium", "flank", [
    { id: "d2", name: "D2", tier: 3, gun: "47 мм", caliber: 47 },
    { id: "somua", name: "Somua S35", tier: 4, gun: "47 мм", caliber: 47 },
    { id: "sarl42", name: "SARL 42", tier: 5, gun: "75 мм", caliber: 75 },
    { id: "amx13fl", name: "AMX 13 FL 11", tier: 6, gun: "75 мм", caliber: 75 },
    { id: "loren40t", name: "Lorraine 40 t", tier: 7, gun: "100 мм", caliber: 100 },
    { id: "bc25t", name: "Bat.-Châtillon 25 t", tier: 8, gun: "100 мм", caliber: 100 },
    { id: "bc25tap", name: "Bat.-Châtillon 25 t AP", tier: 9, gun: "105 мм", caliber: 105 },
    { id: "amx30b", name: "AMX 30 B", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("france", "heavy", "assault", [
    { id: "b1", name: "B1", tier: 4, gun: "47 мм", caliber: 47 },
    { id: "bdr", name: "BDR G1 B", tier: 5, gun: "90 мм", caliber: 90 },
    { id: "arl44", name: "ARL 44", tier: 6, gun: "90 мм", caliber: 90 },
    { id: "amx445", name: "AMX M4 45", tier: 7, gun: "90 мм", caliber: 90 },
    { id: "amx50100", name: "AMX 50 100", tier: 8, gun: "100 мм", caliber: 100 },
    { id: "amx50120", name: "AMX 50 120", tier: 9, gun: "120 мм", caliber: 120 },
    { id: "amx50b", name: "AMX 50 B", tier: 10, gun: "120 мм", caliber: 120 },
  ]),
  ...line("france", "td", "sniper", [
    { id: "rftac", name: "Renault FT AC", tier: 2, gun: "47 мм", caliber: 47 },
    { id: "ue57", name: "UE 57", tier: 3, gun: "57 мм", caliber: 57 },
    { id: "s35ca", name: "S35 CA", tier: 5, gun: "90 мм", caliber: 90 },
    { id: "arlac", name: "ARL V 39", tier: 6, gun: "90 мм", caliber: 90 },
    { id: "amxac46", name: "AMX AC 46", tier: 7, gun: "90 мм", caliber: 90 },
    { id: "amxac48", name: "AMX AC 48", tier: 8, gun: "100 мм", caliber: 100 },
    { id: "foch", name: "AMX 50 Foch", tier: 9, gun: "120 мм", caliber: 120 },
    { id: "foch155", name: "AMX 50 Foch 155", tier: 10, gun: "155 мм", caliber: 155 },
  ]),
  ...line("france", "spg", "support", [
    { id: "rft75", name: "Renault BS", tier: 2, gun: "75 мм", caliber: 75 },
    { id: "lor39", name: "Lorraine 39L AM", tier: 3, gun: "105 мм", caliber: 105 },
    { id: "amx105", name: "AMX 105 AM", tier: 5, gun: "105 мм", caliber: 105 },
    { id: "amx13f3", name: "AMX 13 F3 AM", tier: 6, gun: "155 мм", caliber: 155 },
    { id: "lor155", name: "Lorraine 155 50", tier: 7, gun: "155 мм", caliber: 155 },
    { id: "lor15551", name: "Lorraine 155 51", tier: 8, gun: "155 мм", caliber: 155 },
    { id: "bat15555", name: "Bat.-Châtillon 155 55", tier: 9, gun: "155 мм", caliber: 155 },
    { id: "bat15558", name: "Bat.-Châtillon 155 58", tier: 10, gun: "155 мм", caliber: 155 },
  ]),

  ...line("uk", "light", "scout", [
    { id: "cruiser1", name: "Cruiser I", tier: 1, gun: "40 мм", caliber: 40 },
    { id: "cruiser2", name: "Cruiser II", tier: 2, gun: "40 мм", caliber: 40 },
    { id: "cruiser3", name: "Cruiser III", tier: 3, gun: "40 мм", caliber: 40 },
    { id: "cruiser4", name: "Cruiser IV", tier: 4, gun: "40 мм", caliber: 40 },
    { id: "covenanter", name: "Covenanter", tier: 5, gun: "40 мм", caliber: 40 },
    { id: "crusader", name: "Crusader", tier: 6, gun: "57 мм", caliber: 57 },
    { id: "setter", name: "GSR 3301 Setter", tier: 7, gun: "75 мм", caliber: 75 },
    { id: "lhmtv", name: "LHMTV", tier: 8, gun: "76 мм", caliber: 76 },
    { id: "gsor", name: "GSOR 1006", tier: 9, gun: "90 мм", caliber: 90 },
    { id: "manticore", name: "Manticore", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("uk", "medium", "flank", [
    { id: "vickers1", name: "Vickers Medium I", tier: 1, gun: "47 мм", caliber: 47 },
    { id: "vickers2", name: "Vickers Medium II", tier: 2, gun: "47 мм", caliber: 47 },
    { id: "vickers3", name: "Vickers Medium III", tier: 3, gun: "47 мм", caliber: 47 },
    { id: "matilda", name: "Matilda", tier: 4, gun: "40 мм", caliber: 40 },
    { id: "cavalier", name: "Cavalier", tier: 5, gun: "75 мм", caliber: 75 },
    { id: "cromwell", name: "Cromwell", tier: 6, gun: "75 мм", caliber: 75 },
    { id: "comet", name: "Comet", tier: 7, gun: "77 мм", caliber: 77 },
    { id: "centurion", name: "Centurion I", tier: 8, gun: "84 мм", caliber: 84 },
    { id: "cent71", name: "Centurion 7/1", tier: 9, gun: "105 мм", caliber: 105 },
    { id: "fv4202", name: "FV4202", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("uk", "heavy", "breach", [
    { id: "churchill1", name: "Churchill I", tier: 5, gun: "75 мм", caliber: 75 },
    { id: "churchill7", name: "Churchill VII", tier: 6, gun: "75 мм", caliber: 75 },
    { id: "blackprince", name: "Black Prince", tier: 7, gun: "77 мм", caliber: 77 },
    { id: "caernarvon", name: "Caernarvon", tier: 8, gun: "84 мм", caliber: 84 },
    { id: "conqueror", name: "Conqueror", tier: 9, gun: "120 мм", caliber: 120 },
    { id: "fv215b", name: "FV215b", tier: 10, gun: "120 мм", caliber: 120 },
  ]),
  ...line("uk", "td", "ambush", [
    { id: "valentineat", name: "Valentine AT", tier: 4, gun: "57 мм", caliber: 57 },
    { id: "at2", name: "AT 2", tier: 5, gun: "76 мм", caliber: 76 },
    { id: "at8", name: "AT 8", tier: 6, gun: "84 мм", caliber: 84 },
    { id: "at7", name: "AT 7", tier: 7, gun: "84 мм", caliber: 84 },
    { id: "at15", name: "AT 15", tier: 8, gun: "84 мм", caliber: 84 },
    { id: "tortoise", name: "Tortoise", tier: 9, gun: "120 мм", caliber: 120 },
    { id: "fv215b183", name: "FV215b 183", tier: 10, gun: "183 мм", caliber: 183 },
  ]),
  ...line("uk", "spg", "support", [
    { id: "birch", name: "Birch Gun", tier: 4, gun: "84 мм", caliber: 84 },
    { id: "bishop", name: "Bishop", tier: 5, gun: "88 мм", caliber: 88 },
    { id: "fv304", name: "FV304", tier: 6, gun: "88 мм", caliber: 88 },
    { id: "crusadersp", name: "Crusader SP", tier: 7, gun: "140 мм", caliber: 140 },
    { id: "fv207", name: "FV207", tier: 8, gun: "183 мм", caliber: 183 },
    { id: "fv3805", name: "FV3805", tier: 9, gun: "140 мм", caliber: 140 },
    { id: "conqgc", name: "Conqueror GC", tier: 10, gun: "183 мм", caliber: 183 },
  ]),

  ...line("czech", "light", "scout", [
    { id: "kolo", name: "Kolohousenka", tier: 1, gun: "37 мм", caliber: 37 },
    { id: "ltvz35", name: "LT vz. 35", tier: 2, gun: "37 мм", caliber: 37 },
    { id: "ltvz38", name: "LT vz. 38", tier: 3, gun: "37 мм", caliber: 37 },
    { id: "stvz39", name: "ST vz. 39", tier: 4, gun: "47 мм", caliber: 47 },
    { id: "skodat15", name: "Škoda T 15", tier: 5, gun: "37 мм", caliber: 37 },
    { id: "skodat17", name: "Škoda T 17", tier: 6, gun: "75 мм", caliber: 75 },
    { id: "skodat27", name: "Škoda T 27", tier: 7, gun: "75 мм", caliber: 75 },
    { id: "tvplt8", name: "TVP VT-510", tier: 8, gun: "90 мм", caliber: 90 },
    { id: "skodalt9", name: "Škoda T 50 LT", tier: 9, gun: "100 мм", caliber: 100 },
    { id: "vz68", name: "Vz. 68", tier: 10, gun: "100 мм", caliber: 100 },
  ]),
  ...line("czech", "medium", "flank", [
    { id: "skodat24", name: "Škoda T 24", tier: 5, gun: "75 мм", caliber: 75, pred: "stvz39" },
    { id: "skodat25", name: "Škoda T 25", tier: 6, gun: "75 мм", caliber: 75 },
    { id: "t34100", name: "Konštrukta T-34/100", tier: 7, gun: "100 мм", caliber: 100 },
    { id: "tvpvtu", name: "TVP VTU", tier: 8, gun: "100 мм", caliber: 100 },
    { id: "skodat50", name: "Škoda T 50", tier: 9, gun: "100 мм", caliber: 100 },
    { id: "tvp51", name: "TVP T 50/51", tier: 10, gun: "100 мм", caliber: 100 },
  ]),
  ...line("czech", "heavy", "assault", [
    { id: "vz441", name: "Vz. 44-1", tier: 6, gun: "88 мм", caliber: 88 },
    { id: "skodat45", name: "Škoda T 45", tier: 7, gun: "100 мм", caliber: 100 },
    { id: "tvpt50", name: "TVP T 50/51", tier: 8, gun: "100 мм", caliber: 100 },
    { id: "tnh10551", name: "TNH T Vz. 51", tier: 9, gun: "122 мм", caliber: 122 },
    { id: "vz55", name: "Vz. 55", tier: 10, gun: "130 мм", caliber: 130 },
  ]),
  ...line("czech", "td", "sniper", [
    { id: "t25td", name: "T-25", tier: 5, gun: "75 мм", caliber: 75, pred: "stvz39" },
    { id: "t28td", name: "T-28", tier: 6, gun: "88 мм", caliber: 88 },
    { id: "t37td", name: "T-37", tier: 7, gun: "100 мм", caliber: 100 },
    { id: "stptk", name: "ShPTK-TVP 100", tier: 8, gun: "100 мм", caliber: 100 },
    { id: "vz50td", name: "Vz. 50 TD", tier: 9, gun: "122 мм", caliber: 122 },
    { id: "vz55td", name: "Vz. 55 TD", tier: 10, gun: "152 мм", caliber: 152 },
  ]),
  ...line("czech", "spg", "support", [
    { id: "vz37", name: "vz. 37", tier: 4, gun: "100 мм", caliber: 100 },
    { id: "vz38h", name: "vz. 38H", tier: 5, gun: "105 мм", caliber: 105 },
    { id: "skodah", name: "Škoda H-series", tier: 7, gun: "150 мм", caliber: 150 },
    { id: "tvph", name: "TVP SPG", tier: 8, gun: "152 мм", caliber: 152 },
    { id: "vz77", name: "Vz. 77", tier: 9, gun: "152 мм", caliber: 152 },
    { id: "dakar", name: "ShKH DANA", tier: 10, gun: "152 мм", caliber: 152 },
  ]),

  ...line("china", "light", "scout", [
    { id: "nc31", name: "Renault NC-31", tier: 1, gun: "37 мм", caliber: 37 },
    { id: "vickerse", name: "Vickers Mk. E Type B", tier: 2, gun: "47 мм", caliber: 47 },
    { id: "chihatype", name: "Type 2597 Chi-Ha", tier: 3, gun: "57 мм", caliber: 57 },
    { id: "m5a1", name: "M5A1 Stuart", tier: 4, gun: "37 мм", caliber: 37 },
    { id: "n5916", name: "59-16", tier: 6, gun: "85 мм", caliber: 85 },
    { id: "wz131", name: "WZ-131", tier: 7, gun: "85 мм", caliber: 85 },
    { id: "wz132", name: "WZ-132", tier: 8, gun: "85 мм", caliber: 85 },
    { id: "wz132a", name: "WZ-132A", tier: 9, gun: "100 мм", caliber: 100 },
    { id: "wz1321", name: "WZ-132-1", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("china", "medium", "flank", [
    { id: "typet34", name: "Type T-34", tier: 5, gun: "85 мм", caliber: 85 },
    { id: "type58", name: "Type 58", tier: 6, gun: "85 мм", caliber: 85 },
    { id: "t341", name: "T-34-1", tier: 7, gun: "100 мм", caliber: 100 },
    { id: "t342", name: "T-34-2", tier: 8, gun: "100 мм", caliber: 100 },
    { id: "wz120", name: "WZ-120", tier: 9, gun: "100 мм", caliber: 100 },
    { id: "n121", name: "121", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("china", "heavy", "assault", [
    { id: "cnis2", name: "IS-2", tier: 7, gun: "122 мм", caliber: 122 },
    { id: "wz111", name: "WZ-111", tier: 8, gun: "130 мм", caliber: 130 },
    { id: "wz11114", name: "WZ-111 1-4", tier: 9, gun: "130 мм", caliber: 130 },
    { id: "n113", name: "113", tier: 10, gun: "130 мм", caliber: 130 },
  ]),
  ...line("china", "td", "sniper", [
    { id: "t26gft", name: "T-26G FT", tier: 2, gun: "47 мм", caliber: 47 },
    { id: "m3gft", name: "M3G FT", tier: 3, gun: "75 мм", caliber: 75 },
    { id: "su76gft", name: "SU-76G FT", tier: 4, gun: "76 мм", caliber: 76 },
    { id: "n60gft", name: "60G FT", tier: 5, gun: "85 мм", caliber: 85 },
    { id: "wz131gft", name: "WZ-131G FT", tier: 6, gun: "85 мм", caliber: 85 },
    { id: "t342gft", name: "T-34-2G FT", tier: 7, gun: "100 мм", caliber: 100 },
    { id: "wz111gft", name: "WZ-111-1G FT", tier: 8, gun: "122 мм", caliber: 122 },
    { id: "wz111gft9", name: "WZ-111G FT", tier: 9, gun: "130 мм", caliber: 130 },
    { id: "wz113gft", name: "WZ-113G FT", tier: 10, gun: "152 мм", caliber: 152 },
  ]),
  ...line("china", "spg", "support", [
    { id: "cnbs", name: "Type 59 SPG", tier: 4, gun: "122 мм", caliber: 122 },
    { id: "wz111h", name: "WZ-111 SPG", tier: 6, gun: "152 мм", caliber: 152 },
    { id: "n113gft", name: "113 SPG", tier: 8, gun: "152 мм", caliber: 152 },
    { id: "n113gft9", name: "113G FT IX", tier: 9, gun: "152 мм", caliber: 152 },
    { id: "n113gft10", name: "113G FT X", tier: 10, gun: "152 мм", caliber: 152 },
  ]),

  ...line("japan", "light", "scout", [
    { id: "renoft", name: "Renault Otsu", tier: 1, gun: "37 мм", caliber: 37 },
    { id: "hago", name: "Ha-Go", tier: 2, gun: "37 мм", caliber: 37 },
    { id: "keni", name: "Ke-Ni", tier: 3, gun: "37 мм", caliber: 37 },
    { id: "keho", name: "Ke-Ho", tier: 4, gun: "47 мм", caliber: 47 },
    { id: "keho2", name: "Ke-Ho II", tier: 5, gun: "47 мм", caliber: 47 },
    { id: "type60lt", name: "Type 60 LT", tier: 6, gun: "57 мм", caliber: 57 },
    { id: "sta0", name: "STA-0", tier: 7, gun: "75 мм", caliber: 75 },
    { id: "type74lt", name: "Type 74 LT", tier: 8, gun: "90 мм", caliber: 90 },
    { id: "type87", name: "Type 87", tier: 9, gun: "90 мм", caliber: 90 },
    { id: "type16", name: "Type 16", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("japan", "medium", "flank", [
    { id: "chini", name: "Chi-Ni", tier: 2, gun: "57 мм", caliber: 57 },
    { id: "chiha", name: "Chi-Ha", tier: 3, gun: "57 мм", caliber: 57 },
    { id: "chihe", name: "Chi-He", tier: 4, gun: "47 мм", caliber: 47 },
    { id: "chinu", name: "Chi-Nu", tier: 5, gun: "75 мм", caliber: 75 },
    { id: "chito", name: "Chi-To", tier: 6, gun: "75 мм", caliber: 75 },
    { id: "chiri", name: "Chi-Ri", tier: 7, gun: "75 мм", caliber: 75 },
    { id: "sta1", name: "STA-1", tier: 8, gun: "90 мм", caliber: 90 },
    { id: "type61", name: "Type 61", tier: 9, gun: "90 мм", caliber: 90 },
    { id: "stb1", name: "STB-1", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("japan", "heavy", "assault", [
    { id: "type91", name: "Type 91", tier: 3, gun: "57 мм", caliber: 57 },
    { id: "type95h", name: "Type 95 Heavy", tier: 4, gun: "70 мм", caliber: 70 },
    { id: "oiexp", name: "O-I Experimental", tier: 5, gun: "100 мм", caliber: 100 },
    { id: "oi", name: "O-I", tier: 6, gun: "150 мм", caliber: 150 },
    { id: "oho", name: "O-Ho", tier: 7, gun: "150 мм", caliber: 150 },
    { id: "type4h", name: "Type 4 Heavy", tier: 8, gun: "150 мм", caliber: 150 },
    { id: "type4kai", name: "Type 4 Kai", tier: 9, gun: "150 мм", caliber: 150 },
    { id: "type5h", name: "Type 5 Heavy", tier: 10, gun: "150 мм", caliber: 150 },
  ]),
  ...line("japan", "td", "sniper", [
    { id: "honi", name: "Ho-Ni I", tier: 4, gun: "75 мм", caliber: 75 },
    { id: "honiii", name: "Ho-Ni III", tier: 5, gun: "75 мм", caliber: 75 },
    { id: "natojp", name: "Na-To", tier: 6, gun: "75 мм", caliber: 75 },
    { id: "hori", name: "Ho-Ri", tier: 8, gun: "105 мм", caliber: 105 },
    { id: "hori2", name: "Ho-Ri 1", tier: 9, gun: "120 мм", caliber: 120 },
    { id: "hori3", name: "Ho-Ri 3", tier: 10, gun: "150 мм", caliber: 150 },
  ]),
  ...line("japan", "spg", "support", [
    { id: "jpsp", name: "Type 4 Ho-Ro", tier: 4, gun: "150 мм", caliber: 150 },
    { id: "type38", name: "Type 38", tier: 5, gun: "105 мм", caliber: 105 },
    { id: "type96sp", name: "Type 96 SPG", tier: 7, gun: "150 мм", caliber: 150 },
    { id: "type5sp", name: "Type 5 SPG", tier: 8, gun: "150 мм", caliber: 150 },
    { id: "type5sp9", name: "Type 5 HO-RI SPG", tier: 9, gun: "150 мм", caliber: 150 },
    { id: "type5sp10", name: "Type 5 75", tier: 10, gun: "150 мм", caliber: 150 },
  ]),

  ...line("poland", "light", "scout", [
    { id: "tp4", name: "4TP", tier: 1, gun: "20 мм", caliber: 20 },
    { id: "tp7", name: "7TP", tier: 2, gun: "37 мм", caliber: 37 },
    { id: "tp10", name: "10TP", tier: 3, gun: "37 мм", caliber: 37 },
    { id: "tp14", name: "14TP", tier: 4, gun: "47 мм", caliber: 47 },
    { id: "tp20", name: "20TP", tier: 5, gun: "47 мм", caliber: 47 },
    { id: "tp30", name: "30TP", tier: 6, gun: "75 мм", caliber: 75 },
    { id: "cs48", name: "CS-48", tier: 7, gun: "90 мм", caliber: 90 },
    { id: "cs52", name: "CS-52", tier: 8, gun: "90 мм", caliber: 90 },
    { id: "cs56", name: "CS-56", tier: 9, gun: "100 мм", caliber: 100 },
    { id: "cs63lt", name: "CS-63 LT", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("poland", "medium", "flank", [
    { id: "tp25", name: "25TP", tier: 5, gun: "75 мм", caliber: 75, pred: "tp14" },
    { id: "tp40", name: "40TP", tier: 6, gun: "88 мм", caliber: 88 },
    { id: "cs44", name: "CS-44", tier: 7, gun: "90 мм", caliber: 90 },
    { id: "cs53", name: "CS-53", tier: 8, gun: "100 мм", caliber: 100 },
    { id: "cs59", name: "CS-59", tier: 9, gun: "105 мм", caliber: 105 },
    { id: "cs63", name: "CS-63", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("poland", "heavy", "assault", [
    { id: "tp45", name: "45TP", tier: 6, gun: "100 мм", caliber: 100 },
    { id: "tp53", name: "53TP", tier: 7, gun: "122 мм", caliber: 122 },
    { id: "tp50", name: "50TP", tier: 8, gun: "122 мм", caliber: 122 },
    { id: "tp50p", name: "50TP prototyp", tier: 9, gun: "122 мм", caliber: 122 },
    { id: "tp60", name: "60TP", tier: 10, gun: "152 мм", caliber: 152 },
  ]),
  ...line("poland", "td", "sniper", [
    { id: "tp25td", name: "25TP KSUST", tier: 5, gun: "75 мм", caliber: 75 },
    { id: "tp40td", name: "40TP Habicha", tier: 6, gun: "88 мм", caliber: 88 },
    { id: "cs49", name: "CS-49", tier: 7, gun: "100 мм", caliber: 100 },
    { id: "cs63td", name: "CS-63 TD", tier: 8, gun: "100 мм", caliber: 100 },
    { id: "cs67", name: "CS-67", tier: 9, gun: "122 мм", caliber: 122 },
    { id: "nc70", name: "NC 70 Błyskawica", tier: 10, gun: "152 мм", caliber: 152 },
  ]),
  ...line("poland", "spg", "support", [
    { id: "plsp4", name: "4TP SPG", tier: 3, gun: "100 мм", caliber: 100 },
    { id: "plsp6", name: "25TP SPG", tier: 5, gun: "122 мм", caliber: 122 },
    { id: "plsp8", name: "50TP SPG", tier: 8, gun: "155 мм", caliber: 155 },
    { id: "plsp9", name: "53TP SPG", tier: 9, gun: "155 мм", caliber: 155 },
    { id: "plsp10", name: "60TP SPG", tier: 10, gun: "155 мм", caliber: 155 },
  ]),

  ...line("sweden", "light", "scout", [
    { id: "strvfm21", name: "Strv fm/21", tier: 1, gun: "37 мм", caliber: 37 },
    { id: "strvm38", name: "Strv m/38", tier: 2, gun: "37 мм", caliber: 37 },
    { id: "strvm40", name: "Strv m/40L", tier: 3, gun: "37 мм", caliber: 37 },
    { id: "lago", name: "Lago", tier: 4, gun: "57 мм", caliber: 57 },
    { id: "strvm41", name: "Strv m/41", tier: 5, gun: "37 мм", caliber: 37 },
    { id: "pbvm42", name: "Pbv m/42", tier: 6, gun: "75 мм", caliber: 75 },
    { id: "udes11", name: "UDES 11", tier: 7, gun: "75 мм", caliber: 75 },
    { id: "udes13", name: "UDES 13", tier: 8, gun: "90 мм", caliber: 90 },
    { id: "udes19", name: "UDES 19", tier: 9, gun: "90 мм", caliber: 90 },
    { id: "udes20", name: "UDES 20", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("sweden", "medium", "flank", [
    { id: "strvm42", name: "Strv m/42", tier: 5, gun: "75 мм", caliber: 75, pred: "lago" },
    { id: "strv74", name: "Strv 74", tier: 6, gun: "75 мм", caliber: 75 },
    { id: "leo", name: "Leo", tier: 7, gun: "90 мм", caliber: 90 },
    { id: "udes14", name: "UDES 14", tier: 8, gun: "90 мм", caliber: 90 },
    { id: "udes16", name: "UDES 16", tier: 9, gun: "105 мм", caliber: 105 },
    { id: "udes1516", name: "UDES 15/16", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("sweden", "heavy", "breach", [
    { id: "krv", name: "Heavy Tank Krv", tier: 7, gun: "105 мм", caliber: 105 },
    { id: "emil1", name: "Emil I", tier: 8, gun: "105 мм", caliber: 105 },
    { id: "emil2", name: "Emil II", tier: 9, gun: "120 мм", caliber: 120 },
    { id: "kranvagn", name: "Kranvagn", tier: 10, gun: "120 мм", caliber: 120 },
  ]),
  ...line("sweden", "td", "ambush", [
    { id: "pvlvv", name: "Pvlvv fm/42", tier: 2, gun: "37 мм", caliber: 37 },
    { id: "ikv72", name: "Ikv 72", tier: 3, gun: "75 мм", caliber: 75 },
    { id: "ikv103", name: "Ikv 103", tier: 5, gun: "105 мм", caliber: 105 },
    { id: "ikv65", name: "Ikv 65 Alt II", tier: 6, gun: "90 мм", caliber: 90 },
    { id: "ikv90", name: "Ikv 90 Typ B", tier: 7, gun: "90 мм", caliber: 90 },
    { id: "udes03", name: "UDES 03", tier: 8, gun: "105 мм", caliber: 105 },
    { id: "strv1030", name: "Strv 103-0", tier: 9, gun: "105 мм", caliber: 105 },
    { id: "strv103b", name: "Strv 103B", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("sweden", "spg", "support", [
    { id: "savm43", name: "Sav m/43", tier: 4, gun: "105 мм", caliber: 105 },
    { id: "swsp6", name: "Locust SPG", tier: 6, gun: "105 мм", caliber: 105 },
    { id: "swsp8", name: "Bandkanon", tier: 8, gun: "155 мм", caliber: 155 },
    { id: "bkan1a", name: "Bandkanon 1A", tier: 9, gun: "155 мм", caliber: 155 },
    { id: "bkan1", name: "Bandkanon 1", tier: 10, gun: "155 мм", caliber: 155 },
  ]),

  ...line("italy", "light", "scout", [
    { id: "fiat13", name: "Fiat 3000", tier: 1, gun: "37 мм", caliber: 37 },
    { id: "l640", name: "L6/40", tier: 2, gun: "20 мм", caliber: 20 },
    { id: "m1141", name: "M11/39", tier: 3, gun: "37 мм", caliber: 37 },
    { id: "ab41", name: "AB 41", tier: 4, gun: "20 мм", caliber: 20 },
    { id: "ab43", name: "AB 43", tier: 5, gun: "47 мм", caliber: 47 },
    { id: "fiat6614", name: "Fiat 6614", tier: 6, gun: "75 мм", caliber: 75 },
    { id: "fiat6616", name: "Fiat 6616", tier: 7, gun: "90 мм", caliber: 90 },
    { id: "centauro", name: "B1 Centauro", tier: 8, gun: "105 мм", caliber: 105 },
    { id: "centauro120", name: "Centauro 120", tier: 9, gun: "120 мм", caliber: 120 },
    { id: "centauro2", name: "Centauro II", tier: 10, gun: "120 мм", caliber: 120 },
  ]),
  ...line("italy", "medium", "flank", [
    { id: "m1441", name: "M14/41", tier: 2, gun: "47 мм", caliber: 47 },
    { id: "m1542", name: "M15/42", tier: 3, gun: "47 мм", caliber: 47 },
    { id: "p2640", name: "P26/40", tier: 4, gun: "75 мм", caliber: 75 },
    { id: "p43", name: "P.43", tier: 5, gun: "75 мм", caliber: 75 },
    { id: "p43bis", name: "P.43 bis", tier: 6, gun: "90 мм", caliber: 90 },
    { id: "p43ter", name: "P.43 ter", tier: 7, gun: "90 мм", caliber: 90 },
    { id: "prototipo", name: "Prototipo Standard", tier: 8, gun: "90 мм", caliber: 90 },
    { id: "standardb", name: "Standard B", tier: 9, gun: "105 мм", caliber: 105 },
    { id: "progetto65", name: "Progetto 65", tier: 10, gun: "105 мм", caliber: 105 },
  ]),
  ...line("italy", "heavy", "assault", [
    { id: "carrop88", name: "Carro P.88", tier: 8, gun: "90 мм", caliber: 90, pred: "p43ter" },
    { id: "carrop67", name: "Carro P.67", tier: 9, gun: "120 мм", caliber: 120 },
    { id: "rinoceronte", name: "Rinoceronte", tier: 10, gun: "127 мм", caliber: 127 },
  ]),
  ...line("italy", "td", "ambush", [
    { id: "semovente", name: "Semovente M41", tier: 4, gun: "75 мм", caliber: 75 },
    { id: "bassotto", name: "Bassotto", tier: 6, gun: "105 мм", caliber: 105 },
    { id: "smvcc56", name: "SMV CC-56", tier: 7, gun: "105 мм", caliber: 105 },
    { id: "smvcc67", name: "SMV CC-67", tier: 8, gun: "105 мм", caliber: 105 },
    { id: "smvcc69", name: "SMV CC-67 Mk.2", tier: 9, gun: "120 мм", caliber: 120 },
    { id: "minotauro", name: "Controcarro 3 Minotauro", tier: 10, gun: "127 мм", caliber: 127 },
  ]),
  ...line("italy", "spg", "support", [
    { id: "sem75", name: "Semovente 75/18", tier: 4, gun: "75 мм", caliber: 75 },
    { id: "sem105", name: "Semovente 105", tier: 6, gun: "105 мм", caliber: 105 },
    { id: "sem149", name: "Semovente 149", tier: 8, gun: "149 мм", caliber: 149 },
    { id: "sem1499", name: "Semovente 149/40", tier: 9, gun: "149 мм", caliber: 149 },
    { id: "sem14910", name: "Semovente 149/50", tier: 10, gun: "149 мм", caliber: 149 },
  ]),
]
