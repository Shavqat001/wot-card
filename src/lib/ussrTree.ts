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
 * Ряды СССР как в клиенте WoT (сверху вниз).
 * Премы под жёлтой линией сюда не входят.
 */
export const USSR_ROW: Record<string, number> = {
  // САУ
  su122: 1, su8: 1, s51: 1, su142: 1, obj212: 1, obj261: 1,
  // ПТ 268
  su76: 2, su85: 2, su100: 2, su152: 2, isu: 2, obj704: 2, obj268: 2,
  // ПТ 268/4
  su100m1: 3, su101: 3, obj263: 3, obj2684: 3,
  // ТТ ИС-7
  t28m: 4, kv1: 4, kv1s: 4, is: 4, is3: 4, t10: 4, is7: 4,
  // ТТ Об.277
  obj257: 5, obj277: 5,
  // ТТ Об.705А
  ism: 6, obj705: 6, obj705a: 6,
  // ТТ ИС-4
  t150: 7, kv3: 7, kv4: 7, sti: 7, is4: 7,
  // ТТ СТ-II + КВ-2
  is2ii: 8, is3ii: 8, stii: 8, kv2: 8,
  // СТ Об.140
  t34: 9, t3485: 9, t43: 9, t44: 9, t54: 9, obj140: 9,
  // СТ Об.430У (из Т-44)
  obj430: 10, obj430u: 10,
  // СТ К-91 (А-43 → … → Об.430 II)
  a43: 11, a44: 11, obj416: 11, obj430ii: 11, k91: 11,
  // ЛТ от А-20
  a20: 12, mt25: 12, ltg: 12, lt432: 12, t54lt: 12, t100lt: 12,
  // I–III по центру (столбцы 1–3 свободны)
  t60: 7, t70: 7,
  ms1: 8, bt2: 8, bt5: 8, bt7: 8,
}

/** Связи и уровни исследовательского дерева (без премов/коллекционок). */
const LINK: Record<string, { tier: number; pred: string | null; xp: number; name?: string }> = {
  ms1: { tier: 1, pred: null, xp: 0 },
  t60: { tier: 2, pred: "ms1", xp: 270 },
  bt2: { tier: 2, pred: "ms1", xp: 270 },
  t70: { tier: 3, pred: "t60", xp: 1150 },
  bt5: { tier: 3, pred: "bt2", xp: 1500 },
  su76: { tier: 4, pred: "t70", xp: 3900, name: "СУ-76М" },
  t28m: { tier: 4, pred: "bt5", xp: 3200 },
  bt7: { tier: 4, pred: "bt5", xp: 3200 },
  su122: { tier: 5, pred: "su76", xp: 12570, name: "СУ-122А" },
  su85: { tier: 5, pred: "su76", xp: 12500 },
  kv1: { tier: 5, pred: "t28m", xp: 13500 },
  t34: { tier: 5, pred: "bt7", xp: 11500 },
  a20: { tier: 5, pred: "bt7", xp: 10200 },
  su8: { tier: 6, pred: "su122", xp: 29800 },
  su100: { tier: 6, pred: "su85", xp: 26500 },
  kv2: { tier: 6, pred: "kv1", xp: 26700 },
  kv1s: { tier: 6, pred: "kv1", xp: 25650 },
  t150: { tier: 6, pred: "kv1", xp: 24500 },
  t3485: { tier: 6, pred: "t34", xp: 27825 },
  a43: { tier: 6, pred: "t34", xp: 29660 },
  mt25: { tier: 6, pred: "a20", xp: 32150 },
  s51: { tier: 7, pred: "su8", xp: 62200 },
  su100m1: { tier: 7, pred: "su100", xp: 48200 },
  su152: { tier: 7, pred: "su100", xp: 31500 },
  is: { tier: 7, pred: "kv1s", xp: 49480 },
  kv3: { tier: 7, pred: "t150", xp: 34000 },
  t43: { tier: 7, pred: "t3485", xp: 53000 },
  a44: { tier: 7, pred: "a43", xp: 56200 },
  ltg: { tier: 7, pred: "mt25", xp: 56200 },
  su142: { tier: 8, pred: "s51", xp: 127700 },
  su101: { tier: 8, pred: "su100m1", xp: 91000 },
  isu: { tier: 8, pred: "su152", xp: 75000 },
  is3: { tier: 8, pred: "is", xp: 77000 },
  ism: { tier: 8, pred: "is", xp: 58000 },
  kv4: { tier: 8, pred: "kv3", xp: 53000 },
  is2ii: { tier: 8, pred: "kv3", xp: 51300 },
  t44: { tier: 8, pred: "t43", xp: 93653 },
  obj416: { tier: 8, pred: "a44", xp: 104600 },
  lt432: { tier: 8, pred: "ltg", xp: 96700, name: "ЛТТБ" },
  obj212: { tier: 9, pred: "su142", xp: 217500 },
  obj263: { tier: 9, pred: "su101", xp: 152800 },
  obj704: { tier: 9, pred: "isu", xp: 192500 },
  t10: { tier: 9, pred: "is3", xp: 164700 },
  obj257: { tier: 9, pred: "is3", xp: 142700 },
  obj705: { tier: 9, pred: "ism", xp: 144900 },
  sti: { tier: 9, pred: "kv4", xp: 166000 },
  is3ii: { tier: 9, pred: "is2ii", xp: 165400 },
  obj430: { tier: 9, pred: "t44", xp: 142950 },
  t54: { tier: 9, pred: "t44", xp: 142000 },
  obj430ii: { tier: 9, pred: "obj416", xp: 150500 },
  t54lt: { tier: 9, pred: "lt432", xp: 193200 },
  obj261: { tier: 10, pred: "obj212", xp: 273000 },
  obj2684: { tier: 10, pred: "obj263", xp: 215300 },
  obj268: { tier: 10, pred: "obj704", xp: 239000 },
  is7: { tier: 10, pred: "t10", xp: 191500 },
  obj277: { tier: 10, pred: "obj257", xp: 220800 },
  obj705a: { tier: 10, pred: "obj705", xp: 162300 },
  is4: { tier: 10, pred: "sti", xp: 189000 },
  stii: { tier: 10, pred: "is3ii", xp: 217000 },
  obj430u: { tier: 10, pred: "obj430", xp: 287000 },
  obj140: { tier: 10, pred: "t54", xp: 206000 },
  k91: { tier: 10, pred: "obj430ii", xp: 252700 },
  t100lt: { tier: 10, pred: "t54lt", xp: 279800 },
}

/** Коллекционки / премы — в дереве не показываем. */
const COLLECTOR = new Set([
  "t26", "t46", "t80", "t50", "at1", "su85b", "su18", "su26", "su5", "su14",
  "kv85", "kv13", "t62a",
])

const MISSING: Vehicle[] = [
  tank({
    id: "t60", name: "Т-60", country: "ussr", tier: 2, type: "light", role: "scout",
    hp: 250, speed: 44, hull: [20, 15, 15], turret: [25, 15, 15], casemate: false,
    gun: "20 мм", caliber: 20, reload: 2.4, dispersion: 0.5, aim: 1.8,
    view: 300, camo: 0.32, mass: 6, power: 20, traverse: 42, repair: 320,
    xp: 270, cost: 3300, pred: "ms1", shells: guns([12, 28], [12, 48], [16, 14]),
  }),
  tank({
    id: "bt5", name: "БТ-5", country: "ussr", tier: 3, type: "light", role: "scout",
    hp: 320, speed: 62, hull: [13, 13, 10], turret: [15, 13, 13], casemate: false,
    gun: "45 мм", caliber: 45, reload: 3.1, dispersion: 0.44, aim: 1.8,
    view: 310, camo: 0.3, mass: 12, power: 28, traverse: 44, repair: 520,
    xp: 1500, cost: 37000, pred: "bt2", shells: guns([47, 51], [47, 84], [62, 23]),
  }),
  tank({
    id: "kv2", name: "КВ-2", country: "ussr", tier: 6, type: "heavy", role: "assault",
    hp: 1060, speed: 34, hull: [75, 75, 70], turret: [110, 75, 75], casemate: false,
    gun: "152 мм", caliber: 152, reload: 18, dispersion: 0.6, aim: 3.6,
    view: 310, camo: 0.06, mass: 52, power: 12, traverse: 20, repair: 4200,
    xp: 26700, cost: 920000, pred: "kv1", shells: guns([700, 86], [700, 136], [910, 86]),
  }),
  tank({
    id: "a43", name: "А-43", country: "ussr", tier: 6, type: "medium", role: "flank",
    hp: 900, speed: 55, hull: [60, 45, 40], turret: [70, 50, 45], casemate: false,
    gun: "76 мм", caliber: 76, reload: 6.4, dispersion: 0.4, aim: 2.1,
    view: 350, camo: 0.14, mass: 30, power: 18, traverse: 40, repair: 3600,
    xp: 29660, cost: 920000, pred: "t34", shells: guns([160, 125], [160, 165], [280, 38]),
  }),
  tank({
    id: "a44", name: "А-44", country: "ussr", tier: 7, type: "medium", role: "assault",
    hp: 1100, speed: 50, hull: [90, 60, 45], turret: [100, 80, 60], casemate: false,
    gun: "107 мм", caliber: 107, reload: 9.2, dispersion: 0.42, aim: 2.6,
    view: 360, camo: 0.12, mass: 36, power: 16, traverse: 34, repair: 5600,
    xp: 56200, cost: 1500000, pred: "a43", shells: guns([300, 167], [300, 219], [360, 54]),
  }),
  tank({
    id: "obj416", name: "Объект 416", country: "ussr", tier: 8, type: "medium", role: "sniper",
    hp: 1300, speed: 52, hull: [110, 70, 45], turret: [120, 80, 50], casemate: false,
    gun: "100 мм", caliber: 100, reload: 7.4, dispersion: 0.34, aim: 2.1,
    view: 380, camo: 0.14, mass: 32, power: 18, traverse: 36, repair: 9000,
    xp: 104600, cost: 2600000, pred: "a44", shells: guns([320, 219], [320, 270], [420, 50]),
  }),
  tank({
    id: "obj430", name: "Объект 430", country: "ussr", tier: 9, type: "medium", role: "assault",
    hp: 1700, speed: 55, hull: [120, 80, 45], turret: [230, 160, 65], casemate: false,
    gun: "100 мм", caliber: 100, reload: 6.8, dispersion: 0.32, aim: 1.9,
    view: 400, camo: 0.12, mass: 36, power: 18, traverse: 42, repair: 13000,
    xp: 142950, cost: 3600000, pred: "t44", shells: guns([320, 246], [320, 300], [420, 50]),
  }),
  tank({
    id: "obj430ii", name: "Объект 430 II", country: "ussr", tier: 9, type: "medium", role: "assault",
    hp: 1700, speed: 50, hull: [120, 90, 50], turret: [220, 150, 60], casemate: false,
    gun: "100 мм", caliber: 100, reload: 7, dispersion: 0.34, aim: 2,
    view: 390, camo: 0.12, mass: 38, power: 16, traverse: 38, repair: 13000,
    xp: 150500, cost: 3600000, pred: "obj416", shells: guns([320, 246], [320, 300], [420, 50]),
  }),
  tank({
    id: "obj430u", name: "Объект 430У", country: "ussr", tier: 10, type: "medium", role: "assault",
    hp: 1950, speed: 50, hull: [160, 100, 50], turret: [250, 180, 70], casemate: false,
    gun: "122 мм", caliber: 122, reload: 9.5, dispersion: 0.36, aim: 2.4,
    view: 400, camo: 0.1, mass: 42, power: 16, traverse: 36, repair: 17000,
    xp: 287000, cost: 6100000, pred: "obj430", shells: guns([390, 258], [390, 310], [530, 68]),
  }),
  tank({
    id: "k91", name: "К-91", country: "ussr", tier: 10, type: "medium", role: "sniper",
    hp: 1800, speed: 55, hull: [100, 70, 40], turret: [220, 140, 55], casemate: false,
    gun: "100 мм", caliber: 100, reload: 6.4, dispersion: 0.3, aim: 1.8,
    view: 410, camo: 0.14, mass: 34, power: 20, traverse: 44, repair: 16000,
    xp: 252700, cost: 6100000, pred: "obj430ii", shells: guns([320, 264], [320, 330], [420, 50]),
  }),
  tank({
    id: "ism", name: "ИС-М", country: "ussr", tier: 8, type: "heavy", role: "assault",
    hp: 1500, speed: 36, hull: [120, 90, 60], turret: [200, 140, 90], casemate: false,
    gun: "122 мм", caliber: 122, reload: 11.2, dispersion: 0.42, aim: 2.9,
    view: 350, camo: 0.06, mass: 50, power: 14, traverse: 26, repair: 9000,
    xp: 58000, cost: 2600000, pred: "is", shells: guns([390, 225], [390, 265], [530, 61]),
  }),
  tank({
    id: "obj257", name: "Объект 257", country: "ussr", tier: 9, type: "heavy", role: "breach",
    hp: 1850, speed: 40, hull: [140, 100, 70], turret: [250, 160, 100], casemate: false,
    gun: "122 мм", caliber: 122, reload: 11, dispersion: 0.38, aim: 2.7,
    view: 370, camo: 0.05, mass: 52, power: 14, traverse: 28, repair: 13000,
    xp: 142700, cost: 3600000, pred: "is3", shells: guns([440, 248], [440, 290], [540, 68]),
  }),
  tank({
    id: "obj277", name: "Объект 277", country: "ussr", tier: 10, type: "heavy", role: "breach",
    hp: 2200, speed: 50, hull: [140, 120, 80], turret: [290, 180, 100], casemate: false,
    gun: "130 мм", caliber: 130, reload: 11.5, dispersion: 0.36, aim: 2.6,
    view: 390, camo: 0.04, mass: 55, power: 16, traverse: 28, repair: 18000,
    xp: 220800, cost: 6100000, pred: "obj257", shells: guns([490, 258], [490, 310], [640, 68]),
  }),
  tank({
    id: "obj705", name: "Объект 705", country: "ussr", tier: 9, type: "heavy", role: "assault",
    hp: 1900, speed: 38, hull: [160, 120, 80], turret: [280, 160, 100], casemate: false,
    gun: "130 мм", caliber: 130, reload: 12, dispersion: 0.4, aim: 2.9,
    view: 370, camo: 0.04, mass: 58, power: 14, traverse: 24, repair: 13500,
    xp: 144900, cost: 3600000, pred: "ism", shells: guns([490, 248], [490, 300], [640, 68]),
  }),
  tank({
    id: "obj705a", name: "Объект 705А", country: "ussr", tier: 10, type: "heavy", role: "assault",
    hp: 2400, speed: 36, hull: [180, 140, 90], turret: [300, 180, 120], casemate: false,
    gun: "152 мм", caliber: 152, reload: 14, dispersion: 0.42, aim: 3,
    view: 380, camo: 0.03, mass: 65, power: 12, traverse: 22, repair: 18500,
    xp: 162300, cost: 6100000, pred: "obj705", shells: guns([650, 258], [650, 310], [950, 90]),
  }),
  tank({
    id: "is2ii", name: "ИС-2-II", country: "ussr", tier: 8, type: "heavy", role: "assault",
    hp: 1500, speed: 34, hull: [120, 90, 60], turret: [200, 140, 90], casemate: false,
    gun: "122 мм", caliber: 122, reload: 11.4, dispersion: 0.42, aim: 2.9,
    view: 350, camo: 0.06, mass: 50, power: 14, traverse: 24, repair: 9000,
    xp: 51300, cost: 2600000, pred: "kv3", shells: guns([390, 225], [390, 265], [530, 61]),
  }),
  tank({
    id: "is3ii", name: "ИС-3-II", country: "ussr", tier: 9, type: "heavy", role: "assault",
    hp: 1850, speed: 36, hull: [130, 100, 70], turret: [250, 160, 100], casemate: false,
    gun: "122 мм", caliber: 122, reload: 11.2, dispersion: 0.4, aim: 2.8,
    view: 370, camo: 0.05, mass: 52, power: 14, traverse: 24, repair: 13000,
    xp: 165400, cost: 3600000, pred: "is2ii", shells: guns([440, 248], [440, 290], [540, 68]),
  }),
  tank({
    id: "stii", name: "СТ-II", country: "ussr", tier: 10, type: "heavy", role: "assault",
    hp: 2500, speed: 34, hull: [160, 140, 100], turret: [280, 200, 140], casemate: false,
    gun: "122 мм", caliber: 122, reload: 10.8, dispersion: 0.38, aim: 2.7,
    view: 380, camo: 0.03, mass: 62, power: 14, traverse: 22, repair: 18500,
    xp: 217000, cost: 6100000, pred: "is3ii", shells: guns([440, 258], [440, 310], [540, 68]),
  }),
]

export { LINK as USSR_LINK, MISSING as USSR_MISSING, COLLECTOR as USSR_COLLECTOR }

/** Собрать каталог с актуальным деревом СССР. */
export function mergeUssrTree(list: Vehicle[]): Vehicle[] {
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
