import type { Shell, Vehicle } from "./types"

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

function tank(v: Vehicle): Vehicle {
  return v
}

/**
 * Ряды Германии как в клиенте WoT (сверху вниз).
 * Премы под жёлтой линией сюда не входят.
 */
export const GERMANY_ROW: Record<string, number> = {
  // САУ
  grille: 1, hummel: 1, gwp: 1, gwtigerp: 1, gwtiger: 1, gwe100: 1,
  // ПТ JagdPz. E 100
  stugb: 2, stug: 2, jp4: 2, jpanther: 2, ferd: 2, jagdtiger: 2, jgpze100: 2,
  // ПТ Grille 15
  nashorn: 3, stemil: 3, rhmbwt: 3, wtpz4: 3, grille15: 3,
  // ТТ Pz.Kpfw. VII (+ Tiger P)
  pz4: 4, vk3001p: 4, tigerp: 4, vk4502a: 4, vk4502b: 4, pz7: 4,
  // ТТ Maus
  vk10001p: 5, mauschen: 5, maus: 5,
  // ТТ E 100 (+ ранние Pz. III)
  pz3e: 6, pz3: 6, vk3001: 6, vk3601: 6, tiger: 6, tiger2: 6, e75: 6, e100: 6,
  // СТ E 50 M
  vk3002: 7, panther: 7, panther2: 7, e50: 7, e50m: 7,
  // СТ Leopard 1
  vk3002d: 8, indpz: 8, leopta: 8, leo1: 8,
  // ЛТ
  pz2g: 9, luchs: 9, vk1602: 9, vk2801: 9, spahpz: 9, hwk12: 9, ru251: 9, rhmwpz: 9,
  // I–II по центру
  ltr: 6, pz2: 6,
}

const LINK: Record<string, { tier: number; pred: string | null; xp: number; name?: string }> = {
  ltr: { tier: 1, pred: null, xp: 0, name: "L.Tr." },
  pz2: { tier: 2, pred: "ltr", xp: 1100 },
  pz3e: { tier: 3, pred: "pz2", xp: 2000, name: "Pz. III E" },
  pz2g: { tier: 3, pred: "pz2", xp: 2000, name: "Pz. II G" },
  stugb: { tier: 4, pred: "pz3e", xp: 3700, name: "StuG III B" },
  pz3: { tier: 4, pred: "pz3e", xp: 4000, name: "Pz. III J" },
  luchs: { tier: 4, pred: "pz2g", xp: 3700 },
  grille: { tier: 5, pred: "stugb", xp: 11100 },
  stug: { tier: 5, pred: "stugb", xp: 4000, name: "StuG III G" },
  pz4: { tier: 5, pred: "pz3", xp: 11600, name: "Pz. IV H" },
  vk3001: { tier: 5, pred: "pz3", xp: 11600, name: "VK 30.01 H" },
  vk1602: { tier: 5, pred: "luchs", xp: 9300, name: "Leopard" },
  hummel: { tier: 6, pred: "grille", xp: 24400 },
  jp4: { tier: 6, pred: "stug", xp: 26500, name: "Jg.Pz. IV" },
  nashorn: { tier: 6, pred: "stug", xp: 24400 },
  vk3001p: { tier: 6, pred: "pz4", xp: 24500, name: "VK 30.01 P" },
  vk3601: { tier: 6, pred: "vk3001", xp: 26800, name: "VK 36.01 H" },
  vk3002: { tier: 6, pred: "vk3001", xp: 26800, name: "VK 30.02 M" },
  vk2801: { tier: 6, pred: "vk1602", xp: 28100, name: "VK 28.01" },
  gwp: { tier: 7, pred: "hummel", xp: 55000, name: "G.W. Panther" },
  jpanther: { tier: 7, pred: "jp4", xp: 56000, name: "JPanther" },
  stemil: { tier: 7, pred: "nashorn", xp: 63000, name: "St. Emil" },
  tigerp: { tier: 7, pred: "vk3001p", xp: 45500, name: "Tiger (P)" },
  tiger: { tier: 7, pred: "vk3601", xp: 85000, name: "Tiger I" },
  panther: { tier: 7, pred: "vk3002", xp: 61000 },
  vk3002d: { tier: 7, pred: "vk3002", xp: 61000, name: "VK 30.02 D" },
  spahpz: { tier: 7, pred: "vk2801", xp: 56100, name: "SP I C" },
  gwtigerp: { tier: 8, pred: "gwp", xp: 87000, name: "G.W. Tiger P" },
  ferd: { tier: 8, pred: "jpanther", xp: 110000 },
  rhmbwt: { tier: 8, pred: "stemil", xp: 97000, name: "Rhm.-B. WT" },
  vk4502a: { tier: 8, pred: "tigerp", xp: 99000, name: "VK 45.02 A" },
  vk10001p: { tier: 8, pred: "tigerp", xp: 100500, name: "VK 100.01 P" },
  tiger2: { tier: 8, pred: "tiger", xp: 110000, name: "Tiger II" },
  panther2: { tier: 8, pred: "panther", xp: 100000, name: "Panther II" },
  indpz: { tier: 8, pred: "vk3002d", xp: 99000, name: "Indien-Pz." },
  hwk12: { tier: 8, pred: "spahpz", xp: 86000, name: "HWK 12" },
  gwtiger: { tier: 9, pred: "gwtigerp", xp: 165000, name: "G.W. Tiger" },
  jagdtiger: { tier: 9, pred: "ferd", xp: 192000 },
  wtpz4: { tier: 9, pred: "rhmbwt", xp: 176000, name: "WT auf Pz. IV" },
  vk4502b: { tier: 9, pred: "vk4502a", xp: 195000, name: "VK 45.02 B" },
  mauschen: { tier: 9, pred: "vk10001p", xp: 192000, name: "Mäuschen" },
  e75: { tier: 9, pred: "tiger2", xp: 192000, name: "E 75" },
  e50: { tier: 9, pred: "panther2", xp: 195000, name: "E 50" },
  leopta: { tier: 9, pred: "indpz", xp: 185000, name: "Leopard PT A" },
  ru251: { tier: 9, pred: "hwk12", xp: 195000, name: "Ru 251" },
  gwe100: { tier: 10, pred: "gwtiger", xp: 255000, name: "G.W. E 100" },
  jgpze100: { tier: 10, pred: "jagdtiger", xp: 255000, name: "Jg.Pz. E 100" },
  grille15: { tier: 10, pred: "wtpz4", xp: 240000, name: "Grille 15" },
  pz7: { tier: 10, pred: "vk4502b", xp: 275000, name: "Pz.Kpfw. VII" },
  maus: { tier: 10, pred: "mauschen", xp: 255000 },
  e100: { tier: 10, pred: "e75", xp: 255000, name: "E 100" },
  e50m: { tier: 10, pred: "e50", xp: 255000, name: "E 50 M" },
  leo1: { tier: 10, pred: "leopta", xp: 275000, name: "Leopard 1" },
  rhmwpz: { tier: 10, pred: "ru251", xp: 275000, name: "Rhm. Pzw." },
}

/** Коллекционки / премы — в дереве не показываем. */
const COLLECTOR = new Set([
  "pzi", "pz38t", "dw2", "marder", "hetzer", "bison", "wespe", "bison15",
])

const MISSING: Vehicle[] = [
  tank({
    id: "pz3e", name: "Pz. III E", country: "germany", tier: 3, type: "medium", role: "flank",
    hp: 310, speed: 40, hull: [30, 30, 30], turret: [30, 30, 30], casemate: false,
    gun: "37 мм", caliber: 37, reload: 2.5, dispersion: 0.46, aim: 1.7,
    view: 330, camo: 0.2, mass: 16, power: 20, traverse: 40, repair: 480,
    xp: 2000, cost: 45000, pred: "pz2", shells: guns([40, 40], [40, 74], [45, 18]),
  }),
  tank({
    id: "pz2g", name: "Pz. II G", country: "germany", tier: 3, type: "light", role: "scout",
    hp: 280, speed: 50, hull: [30, 20, 20], turret: [30, 20, 20], casemate: false,
    gun: "20 мм", caliber: 20, reload: 2.2, dispersion: 0.48, aim: 1.5,
    view: 350, camo: 0.28, mass: 11, power: 24, traverse: 44, repair: 420,
    xp: 2000, cost: 42000, pred: "pz2", shells: guns([11, 39], [11, 51], [15, 18]),
  }),
  tank({
    id: "stugb", name: "StuG III B", country: "germany", tier: 4, type: "td", role: "ambush",
    hp: 350, speed: 40, hull: [50, 30, 30], turret: [50, 30, 30], casemate: true,
    gun: "75 мм", caliber: 75, reload: 5.5, dispersion: 0.44, aim: 1.7,
    view: 310, camo: 0.24, mass: 20, power: 16, traverse: 34, repair: 900,
    xp: 3700, cost: 140000, pred: "pz3e", shells: guns([110, 98], [110, 126], [175, 38]),
  }),
  tank({
    id: "stemil", name: "St. Emil", country: "germany", tier: 7, type: "td", role: "sniper",
    hp: 850, speed: 25, hull: [50, 30, 20], turret: [20, 15, 15], casemate: true,
    gun: "128 мм", caliber: 128, reload: 14, dispersion: 0.38, aim: 2.7,
    view: 360, camo: 0.14, mass: 35, power: 12, traverse: 20, repair: 6200,
    xp: 63000, cost: 1450000, pred: "nashorn", shells: guns([490, 212], [490, 259], [630, 65]),
  }),
  tank({
    id: "rhmbwt", name: "Rhm.-B. WT", country: "germany", tier: 8, type: "td", role: "sniper",
    hp: 1200, speed: 40, hull: [30, 20, 20], turret: [20, 10, 10], casemate: true,
    gun: "128 мм", caliber: 128, reload: 11, dispersion: 0.32, aim: 2.1,
    view: 380, camo: 0.18, mass: 28, power: 18, traverse: 26, repair: 10000,
    xp: 97000, cost: 2650000, pred: "stemil", shells: guns([560, 246], [560, 311], [700, 65]),
  }),
  tank({
    id: "wtpz4", name: "WT auf Pz. IV", country: "germany", tier: 9, type: "td", role: "sniper",
    hp: 1500, speed: 38, hull: [80, 40, 40], turret: [20, 10, 10], casemate: true,
    gun: "150 мм", caliber: 150, reload: 13, dispersion: 0.34, aim: 2.3,
    view: 390, camo: 0.16, mass: 32, power: 16, traverse: 24, repair: 14000,
    xp: 176000, cost: 3600000, pred: "rhmbwt", shells: guns([750, 276], [750, 350], [950, 75]),
  }),
  tank({
    id: "grille15", name: "Grille 15", country: "germany", tier: 10, type: "td", role: "sniper",
    hp: 1600, speed: 42, hull: [30, 20, 20], turret: [20, 10, 10], casemate: true,
    gun: "150 мм", caliber: 150, reload: 11.5, dispersion: 0.3, aim: 2,
    view: 410, camo: 0.2, mass: 30, power: 20, traverse: 28, repair: 17000,
    xp: 240000, cost: 6100000, pred: "wtpz4", shells: guns([750, 279], [750, 354], [950, 75]),
  }),
  tank({
    id: "vk3002d", name: "VK 30.02 D", country: "germany", tier: 7, type: "medium", role: "flank",
    hp: 1100, speed: 56, hull: [80, 50, 40], turret: [100, 60, 50], casemate: false,
    gun: "88 мм", caliber: 88, reload: 6.5, dispersion: 0.34, aim: 2.1,
    view: 380, camo: 0.12, mass: 36, power: 18, traverse: 40, repair: 5800,
    xp: 61000, cost: 1450000, pred: "vk3002", shells: guns([220, 194], [220, 244], [270, 44]),
  }),
  tank({
    id: "indpz", name: "Indien-Pz.", country: "germany", tier: 8, type: "medium", role: "flank",
    hp: 1350, speed: 55, hull: [90, 60, 45], turret: [130, 80, 60], casemate: false,
    gun: "90 мм", caliber: 90, reload: 6.8, dispersion: 0.32, aim: 2,
    view: 390, camo: 0.12, mass: 40, power: 18, traverse: 40, repair: 9500,
    xp: 99000, cost: 2600000, pred: "vk3002d", shells: guns([240, 212], [240, 259], [320, 50]),
  }),
  tank({
    id: "leopta", name: "Leopard PT A", country: "germany", tier: 9, type: "medium", role: "sniper",
    hp: 1650, speed: 60, hull: [70, 40, 30], turret: [200, 100, 60], casemate: false,
    gun: "105 мм", caliber: 105, reload: 7.5, dispersion: 0.3, aim: 1.8,
    view: 410, camo: 0.14, mass: 40, power: 20, traverse: 44, repair: 13500,
    xp: 185000, cost: 3600000, pred: "indpz", shells: guns([390, 268], [390, 330], [480, 53]),
  }),
  tank({
    id: "leo1", name: "Leopard 1", country: "germany", tier: 10, type: "medium", role: "sniper",
    hp: 1850, speed: 65, hull: [70, 40, 30], turret: [220, 120, 60], casemate: false,
    gun: "105 мм", caliber: 105, reload: 7, dispersion: 0.28, aim: 1.7,
    view: 410, camo: 0.14, mass: 40, power: 22, traverse: 46, repair: 17000,
    xp: 275000, cost: 6100000, pred: "leopta", shells: guns([390, 268], [390, 330], [480, 53]),
  }),
  tank({
    id: "vk10001p", name: "VK 100.01 P", country: "germany", tier: 8, type: "heavy", role: "assault",
    hp: 1500, speed: 20, hull: [180, 100, 80], turret: [220, 140, 100], casemate: false,
    gun: "105 мм", caliber: 105, reload: 9.5, dispersion: 0.38, aim: 2.6,
    view: 370, camo: 0.04, mass: 80, power: 10, traverse: 18, repair: 10000,
    xp: 100500, cost: 2650000, pred: "tigerp", shells: guns([320, 220], [320, 270], [420, 60]),
  }),
  tank({
    id: "mauschen", name: "Mäuschen", country: "germany", tier: 9, type: "heavy", role: "assault",
    hp: 1900, speed: 22, hull: [200, 140, 100], turret: [250, 160, 120], casemate: false,
    gun: "128 мм", caliber: 128, reload: 12, dispersion: 0.38, aim: 2.7,
    view: 380, camo: 0.03, mass: 120, power: 10, traverse: 16, repair: 14000,
    xp: 192000, cost: 3600000, pred: "vk10001p", shells: guns([490, 246], [490, 311], [630, 65]),
  }),
  tank({
    id: "pz7", name: "Pz.Kpfw. VII", country: "germany", tier: 10, type: "heavy", role: "assault",
    hp: 2200, speed: 33, hull: [160, 120, 80], turret: [260, 160, 100], casemate: false,
    gun: "128 мм", caliber: 128, reload: 11, dispersion: 0.35, aim: 2.4,
    view: 400, camo: 0.04, mass: 70, power: 14, traverse: 26, repair: 18000,
    xp: 275000, cost: 6100000, pred: "vk4502b", shells: guns([560, 276], [560, 352], [700, 65]),
  }),
]

export { LINK as GERMANY_LINK, MISSING as GERMANY_MISSING, COLLECTOR as GERMANY_COLLECTOR }

export function mergeGermanyTree(list: Vehicle[]): Vehicle[] {
  const by = new Map(list.map((v) => [v.id, v]))
  for (const v of MISSING) {
    if (!by.has(v.id)) by.set(v.id, v)
  }
  for (const [id, link] of Object.entries(LINK)) {
    const cur = by.get(id)
    if (!cur) continue
    by.set(id, {
      ...cur,
      tier: link.tier,
      pred: link.pred,
      xp: link.xp,
      name: link.name ?? cur.name,
    })
  }
  for (const id of COLLECTOR) {
    const cur = by.get(id)
    if (!cur) continue
    by.set(id, { ...cur, pred: null, xp: 0 })
  }
  return [...by.values()]
}
