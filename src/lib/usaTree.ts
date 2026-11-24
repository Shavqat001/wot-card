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
 * Ряды США как в клиенте WoT (сверху вниз).
 * Премы под жёлтой линией сюда не входят.
 */
export const USA_ROW: Record<string, number> = {
  // САУ
  m41spg: 1, m44: 1, m12: 1, m40: 1, m53: 1, t92: 1,
  // ПТ T110E3
  t40: 2, m10: 2, jackson: 2, t25at: 2, t28: 2, t110e3: 2,
  // ПТ T110E4
  hellcat: 3, t252: 3, t28prot: 3, t30: 3, t110e4: 3,
  // ТТ T110E5
  t6med: 4, t1: 4, m6: 4, t29: 4, t32: 4, m103: 4, t110e5: 4,
  // ТТ M-V-Y
  pawlack: 5, m2y: 5, m3y: 5, m6y: 5, m5y: 5,
  // СТ M48
  sherman: 6, e8: 6, t20: 6, pershing: 6, m46: 6, m48: 6,
  // ЛТ Sheridan
  m5: 7, chaffee: 7, t37: 7, m41bulldog: 7, t49: 7, sheridan: 7,
  // I–III по центру
  t1c: 5, m2lt: 5, m3st: 5,
  // IV разветвление
  m8a1: 2,
}

const LINK: Record<string, { tier: number; pred: string | null; xp: number; name?: string }> = {
  t1c: { tier: 1, pred: null, xp: 0, name: "T1" },
  m2lt: { tier: 2, pred: "t1c", xp: 900, name: "M2 Light" },
  m3st: { tier: 3, pred: "m2lt", xp: 1800, name: "M3 Stuart" },
  m8a1: { tier: 4, pred: "m3st", xp: 3600 },
  t6med: { tier: 4, pred: "m3st", xp: 3800, name: "T6 Medium" },
  m5: { tier: 4, pred: "m3st", xp: 3600, name: "M5 Stuart" },
  m41spg: { tier: 5, pred: "m8a1", xp: 11500, name: "M41 HMC" },
  t40: { tier: 5, pred: "m8a1", xp: 11500 },
  sherman: { tier: 5, pred: "t6med", xp: 12500, name: "M4 Sherman" },
  t1: { tier: 5, pred: "t6med", xp: 12500, name: "T1 Heavy" },
  chaffee: { tier: 5, pred: "m5", xp: 10200, name: "Chaffee" },
  m44: { tier: 6, pred: "m41spg", xp: 25000, name: "M44" },
  m10: { tier: 6, pred: "t40", xp: 27000, name: "Wolverine" },
  hellcat: { tier: 6, pred: "m10", xp: 26500 },
  e8: { tier: 6, pred: "sherman", xp: 27500, name: "M4A3E8" },
  m6: { tier: 6, pred: "t1", xp: 28000 },
  pawlack: { tier: 6, pred: "t1", xp: 28000, name: "Pawlack Tank" },
  t37: { tier: 6, pred: "chaffee", xp: 26000 },
  m12: { tier: 7, pred: "m44", xp: 54000, name: "M12" },
  jackson: { tier: 7, pred: "m10", xp: 58000, name: "Jackson" },
  t252: { tier: 7, pred: "hellcat", xp: 56000, name: "T25/2" },
  t20: { tier: 7, pred: "e8", xp: 58000 },
  t29: { tier: 7, pred: "m6", xp: 65000 },
  m2y: { tier: 7, pred: "pawlack", xp: 62000, name: "M-II-Y" },
  m41bulldog: { tier: 7, pred: "t37", xp: 56000, name: "M41 Bulldog" },
  m40: { tier: 8, pred: "m12", xp: 95000, name: "M40/M43" },
  t25at: { tier: 8, pred: "jackson", xp: 100000, name: "T25 AT" },
  t28prot: { tier: 8, pred: "t252", xp: 98000, name: "T28 Prot." },
  pershing: { tier: 8, pred: "t20", xp: 100000, name: "Pershing" },
  t32: { tier: 8, pred: "t29", xp: 110000 },
  m3y: { tier: 8, pred: "m2y", xp: 105000, name: "M-III-Y" },
  t49: { tier: 8, pred: "m41bulldog", xp: 97000 },
  m53: { tier: 9, pred: "m40", xp: 175000, name: "M53/M55" },
  t28: { tier: 9, pred: "t25at", xp: 185000 },
  t30: { tier: 9, pred: "t28prot", xp: 180000 },
  m46: { tier: 9, pred: "pershing", xp: 190000, name: "M46 Patton" },
  m103: { tier: 9, pred: "t32", xp: 195000 },
  m6y: { tier: 9, pred: "m3y", xp: 192000, name: "M-VI-Y" },
  t92: { tier: 10, pred: "m53", xp: 250000, name: "T92 HMC" },
  t110e3: { tier: 10, pred: "t28", xp: 255000, name: "T110E3" },
  t110e4: { tier: 10, pred: "t30", xp: 255000, name: "T110E4" },
  m48: { tier: 10, pred: "m46", xp: 260000, name: "M48 Patton" },
  t110e5: { tier: 10, pred: "m103", xp: 260000, name: "T110E5" },
  m5y: { tier: 10, pred: "m6y", xp: 270000, name: "M-V-Y" },
  sheridan: { tier: 10, pred: "t49", xp: 270000, name: "Sheridan" },
}

/** Коллекционки / премы — в дереве не показываем. */
const COLLECTOR = new Set([
  "m2med", "m3lee", "m7", "t21", "t18", "t82", "m37", "priest", "m55", "t92a", "t95",
])

const MISSING: Vehicle[] = [
  tank({
    id: "t6med", name: "T6 Medium", country: "usa", tier: 4, type: "medium", role: "flank",
    hp: 420, speed: 40, hull: [50, 40, 40], turret: [50, 50, 50], casemate: false,
    gun: "75 мм", caliber: 75, reload: 4.5, dispersion: 0.46, aim: 2,
    view: 330, camo: 0.14, mass: 28, power: 16, traverse: 36, repair: 1100,
    xp: 3800, cost: 145000, pred: "m3st", shells: guns([110, 92], [110, 127], [175, 38]),
  }),
  tank({
    id: "t40", name: "T40", country: "usa", tier: 5, type: "td", role: "sniper",
    hp: 360, speed: 36, hull: [50, 25, 25], turret: [25, 15, 15], casemate: true,
    gun: "76 мм", caliber: 76, reload: 5.5, dispersion: 0.41, aim: 1.7,
    view: 350, camo: 0.22, mass: 22, power: 14, traverse: 30, repair: 1800,
    xp: 11500, cost: 420000, pred: "m8a1", shells: guns([115, 120], [115, 160], [185, 38]),
  }),
  tank({
    id: "jackson", name: "Jackson", country: "usa", tier: 7, type: "td", role: "sniper",
    hp: 850, speed: 40, hull: [40, 25, 25], turret: [75, 25, 25], casemate: false,
    gun: "90 мм", caliber: 90, reload: 7.5, dispersion: 0.37, aim: 1.9,
    view: 370, camo: 0.16, mass: 30, power: 16, traverse: 34, repair: 6000,
    xp: 58000, cost: 1450000, pred: "m10", shells: guns([240, 198], [240, 245], [320, 45]),
  }),
  tank({
    id: "t252", name: "T25/2", country: "usa", tier: 7, type: "td", role: "flank",
    hp: 900, speed: 45, hull: [75, 40, 40], turret: [75, 40, 40], casemate: false,
    gun: "90 мм", caliber: 90, reload: 7, dispersion: 0.36, aim: 1.8,
    view: 380, camo: 0.14, mass: 35, power: 16, traverse: 36, repair: 6200,
    xp: 56000, cost: 1450000, pred: "hellcat", shells: guns([240, 198], [240, 245], [320, 45]),
  }),
  tank({
    id: "t28prot", name: "T28 Prot.", country: "usa", tier: 8, type: "td", role: "assault",
    hp: 1150, speed: 28, hull: [200, 50, 50], turret: [200, 100, 100], casemate: false,
    gun: "90 мм", caliber: 90, reload: 7.2, dispersion: 0.35, aim: 2,
    view: 370, camo: 0.1, mass: 60, power: 12, traverse: 22, repair: 10000,
    xp: 98000, cost: 2650000, pred: "t252", shells: guns([240, 220], [240, 270], [320, 45]),
  }),
  tank({
    id: "t30", name: "T30", country: "usa", tier: 9, type: "td", role: "assault",
    hp: 1800, speed: 32, hull: [100, 75, 50], turret: [280, 150, 100], casemate: false,
    gun: "155 мм", caliber: 155, reload: 16, dispersion: 0.4, aim: 3,
    view: 380, camo: 0.06, mass: 65, power: 14, traverse: 24, repair: 14500,
    xp: 180000, cost: 3600000, pred: "t28prot", shells: guns([750, 276], [750, 320], [950, 90]),
  }),
  tank({
    id: "t110e4", name: "T110E4", country: "usa", tier: 10, type: "td", role: "assault",
    hp: 2000, speed: 35, hull: [150, 80, 50], turret: [300, 160, 100], casemate: false,
    gun: "155 мм", caliber: 155, reload: 15, dispersion: 0.38, aim: 2.8,
    view: 390, camo: 0.05, mass: 70, power: 14, traverse: 26, repair: 18000,
    xp: 255000, cost: 6100000, pred: "t30", shells: guns([750, 295], [750, 375], [950, 90]),
  }),
  tank({
    id: "m44", name: "M44", country: "usa", tier: 6, type: "spg", role: "support",
    hp: 280, speed: 45, hull: [15, 10, 10], turret: [10, 8, 8], casemate: true,
    gun: "155 мм", caliber: 155, reload: 13, dispersion: 0.7, aim: 4.5,
    view: 260, camo: 0.14, mass: 28, power: 14, traverse: 20, repair: 3200,
    xp: 25000, cost: 920000, pred: "m41spg", shells: guns([600, 45], [600, 65], [900, 55]),
  }),
  tank({
    id: "m12", name: "M12", country: "usa", tier: 7, type: "spg", role: "support",
    hp: 320, speed: 38, hull: [25, 15, 15], turret: [12, 10, 10], casemate: true,
    gun: "155 мм", caliber: 155, reload: 14, dispersion: 0.72, aim: 4.8,
    view: 270, camo: 0.12, mass: 30, power: 12, traverse: 18, repair: 4800,
    xp: 54000, cost: 1450000, pred: "m44", shells: guns([650, 48], [650, 70], [1000, 60]),
  }),
  tank({
    id: "pawlack", name: "Pawlack Tank", country: "usa", tier: 6, type: "heavy", role: "assault",
    hp: 900, speed: 35, hull: [100, 70, 50], turret: [120, 80, 60], casemate: false,
    gun: "90 мм", caliber: 90, reload: 8, dispersion: 0.4, aim: 2.3,
    view: 360, camo: 0.08, mass: 42, power: 14, traverse: 28, repair: 4500,
    xp: 28000, cost: 920000, pred: "t1", shells: guns([240, 180], [240, 230], [320, 45]),
  }),
  tank({
    id: "m2y", name: "M-II-Y", country: "usa", tier: 7, type: "heavy", role: "assault",
    hp: 1200, speed: 35, hull: [120, 80, 60], turret: [160, 100, 80], casemate: false,
    gun: "90 мм", caliber: 90, reload: 8.5, dispersion: 0.38, aim: 2.4,
    view: 370, camo: 0.06, mass: 48, power: 14, traverse: 28, repair: 6500,
    xp: 62000, cost: 1450000, pred: "pawlack", shells: guns([240, 200], [240, 250], [320, 45]),
  }),
  tank({
    id: "m3y", name: "M-III-Y", country: "usa", tier: 8, type: "heavy", role: "assault",
    hp: 1500, speed: 35, hull: [140, 90, 70], turret: [200, 120, 90], casemate: false,
    gun: "105 мм", caliber: 105, reload: 9.5, dispersion: 0.38, aim: 2.5,
    view: 380, camo: 0.05, mass: 55, power: 14, traverse: 26, repair: 10000,
    xp: 105000, cost: 2650000, pred: "m2y", shells: guns([320, 218], [320, 270], [420, 53]),
  }),
  tank({
    id: "m6y", name: "M-VI-Y", country: "usa", tier: 9, type: "heavy", role: "assault",
    hp: 1850, speed: 35, hull: [160, 100, 80], turret: [250, 140, 100], casemate: false,
    gun: "120 мм", caliber: 120, reload: 11, dispersion: 0.36, aim: 2.6,
    view: 390, camo: 0.04, mass: 60, power: 14, traverse: 26, repair: 14000,
    xp: 192000, cost: 3600000, pred: "m3y", shells: guns([400, 248], [400, 310], [515, 60]),
  }),
  tank({
    id: "m5y", name: "M-V-Y", country: "usa", tier: 10, type: "heavy", role: "assault",
    hp: 2200, speed: 35, hull: [180, 120, 90], turret: [280, 160, 110], casemate: false,
    gun: "120 мм", caliber: 120, reload: 10.5, dispersion: 0.34, aim: 2.4,
    view: 400, camo: 0.04, mass: 65, power: 15, traverse: 28, repair: 18000,
    xp: 270000, cost: 6100000, pred: "m6y", shells: guns([400, 258], [400, 330], [515, 60]),
  }),
]

export { LINK as USA_LINK, MISSING as USA_MISSING, COLLECTOR as USA_COLLECTOR }

export function mergeUsaTree(list: Vehicle[]): Vehicle[] {
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
