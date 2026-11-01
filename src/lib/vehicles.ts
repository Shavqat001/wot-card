import type { Shell, Vehicle, VehType } from "./types"
import { EXTRA } from "./vehiclesExtra"
import { NATIONS } from "./vehiclesNations"

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

export const VEHICLES: Vehicle[] = [
  tank({
    id: "bt7", name: "БТ-7", country: "ussr", tier: 4, type: "light", role: "scout",
    hp: 420, speed: 72, hull: [20, 13, 13], turret: [20, 15, 15], casemate: false,
    gun: "45 мм", caliber: 45, reload: 3.4, dispersion: 0.48, aim: 1.8,
    view: 340, camo: 0.3, mass: 14, power: 36, traverse: 46, repair: 600,
    xp: 0, cost: 0, pred: null, shells: guns([70, 75], [70, 112], [85, 22]),
  }),
  tank({
    id: "t50", name: "Т-50", country: "ussr", tier: 5, type: "light", role: "scout",
    hp: 560, speed: 60, hull: [37, 25, 25], turret: [37, 37, 15], casemate: false,
    gun: "45 мм", caliber: 45, reload: 3.6, dispersion: 0.45, aim: 1.9,
    view: 360, camo: 0.26, mass: 14, power: 30, traverse: 44, repair: 1400,
    xp: 1400, cost: 9000, pred: "bt7", shells: guns([75, 90], [75, 130], [95, 24]),
  }),
  tank({
    id: "mt25", name: "МТ-25", country: "ussr", tier: 6, type: "light", role: "flank",
    hp: 720, speed: 62, hull: [45, 30, 30], turret: [45, 40, 30], casemate: false,
    gun: "57 мм", caliber: 57, reload: 4.2, dispersion: 0.42, aim: 2,
    view: 370, camo: 0.22, mass: 18, power: 28, traverse: 42, repair: 2800,
    xp: 2600, cost: 20000, pred: "t50", shells: guns([110, 112], [110, 160], [150, 30]),
  }),
  tank({
    id: "ltg", name: "ЛТГ", country: "ussr", tier: 7, type: "light", role: "flank",
    hp: 900, speed: 64, hull: [50, 32, 25], turret: [70, 40, 30], casemate: false,
    gun: "85 мм", caliber: 85, reload: 5.2, dispersion: 0.4, aim: 1.9,
    view: 380, camo: 0.2, mass: 20, power: 26, traverse: 42, repair: 4400,
    xp: 5000, cost: 44000, pred: "mt25", shells: guns([180, 180], [180, 240], [300, 44]),
  }),
  tank({
    id: "lt432", name: "ЛТ-432", country: "ussr", tier: 8, type: "light", role: "flank",
    hp: 1100, speed: 68, hull: [70, 40, 30], turret: [90, 50, 40], casemate: false,
    gun: "100 мм", caliber: 100, reload: 6.8, dispersion: 0.38, aim: 1.8,
    view: 390, camo: 0.18, mass: 22, power: 26, traverse: 44, repair: 7200,
    xp: 8600, cost: 72000, pred: "ltg", shells: guns([250, 190], [250, 247], [330, 50]),
  }),
  tank({
    id: "t54lt", name: "Т-54 облегч.", country: "ussr", tier: 9, type: "light", role: "flank",
    hp: 1300, speed: 70, hull: [80, 45, 35], turret: [180, 120, 60], casemate: false,
    gun: "100 мм", caliber: 100, reload: 6.6, dispersion: 0.36, aim: 1.7,
    view: 400, camo: 0.18, mass: 24, power: 28, traverse: 44, repair: 11000,
    xp: 15000, cost: 125000, pred: "lt432", shells: guns([320, 219], [320, 270], [420, 50]),
  }),
  tank({
    id: "t100lt", name: "Т-100 ЛТ", country: "ussr", tier: 10, type: "light", role: "flank",
    hp: 1450, speed: 72, hull: [90, 50, 40], turret: [200, 140, 65], casemate: false,
    gun: "100 мм", caliber: 100, reload: 6.2, dispersion: 0.34, aim: 1.6,
    view: 410, camo: 0.16, mass: 26, power: 30, traverse: 46, repair: 15000,
    xp: 25000, cost: 210000, pred: "t54lt", shells: guns([320, 246], [320, 300], [420, 50]),
  }),
  tank({
    id: "t34", name: "Т-34", country: "ussr", tier: 5, type: "medium", role: "flank",
    hp: 820, speed: 54, hull: [45, 40, 40], turret: [52, 52, 45], casemate: false,
    gun: "Ф-34", caliber: 76, reload: 6.6, dispersion: 0.46, aim: 2.3,
    view: 330, camo: 0.16, mass: 29, power: 17, traverse: 36, repair: 3900,
    xp: 0, cost: 0, pred: null, shells: guns([160, 125], [160, 165], [280, 38]),
  }),
  tank({
    id: "t3485", name: "Т-34-85", country: "ussr", tier: 6, type: "medium", role: "flank",
    hp: 980, speed: 54, hull: [45, 45, 40], turret: [90, 75, 52], casemate: false,
    gun: "ЗИС-С-53", caliber: 85, reload: 7, dispersion: 0.38, aim: 2.2,
    view: 360, camo: 0.14, mass: 32, power: 16, traverse: 38, repair: 4200,
    xp: 2400, cost: 18000, pred: "t34", shells: guns([200, 144], [200, 194], [300, 44]),
  }),
  tank({
    id: "t44", name: "Т-44", country: "ussr", tier: 7, type: "medium", role: "flank",
    hp: 1200, speed: 56, hull: [90, 75, 45], turret: [120, 90, 75], casemate: false,
    gun: "ЛБ-1", caliber: 100, reload: 7.4, dispersion: 0.36, aim: 2.1,
    view: 370, camo: 0.14, mass: 32, power: 18, traverse: 40, repair: 5600,
    xp: 4800, cost: 42000, pred: "t3485", shells: guns([250, 190], [250, 240], [330, 50]),
  }),
  tank({
    id: "t54", name: "Т-54", country: "ussr", tier: 8, type: "medium", role: "assault",
    hp: 1500, speed: 56, hull: [120, 80, 45], turret: [200, 160, 65], casemate: false,
    gun: "Д-10", caliber: 100, reload: 7.6, dispersion: 0.34, aim: 2,
    view: 380, camo: 0.12, mass: 36, power: 18, traverse: 42, repair: 8200,
    xp: 8600, cost: 72000, pred: "t44", shells: guns([320, 219], [320, 270], [420, 50]),
  }),
  tank({
    id: "t62a", name: "Т-62А", country: "ussr", tier: 9, type: "medium", role: "assault",
    hp: 1750, speed: 50, hull: [100, 80, 45], turret: [240, 160, 65], casemate: false,
    gun: "100 мм", caliber: 100, reload: 7, dispersion: 0.32, aim: 1.9,
    view: 400, camo: 0.12, mass: 37, power: 18, traverse: 42, repair: 12000,
    xp: 15000, cost: 125000, pred: "t54", shells: guns([320, 246], [320, 300], [420, 50]),
  }),
  tank({
    id: "obj140", name: "Объект 140", country: "ussr", tier: 10, type: "medium", role: "assault",
    hp: 1900, speed: 55, hull: [100, 80, 45], turret: [240, 180, 65], casemate: false,
    gun: "100 мм", caliber: 100, reload: 6.6, dispersion: 0.3, aim: 1.8,
    view: 410, camo: 0.12, mass: 36, power: 20, traverse: 44, repair: 16000,
    xp: 25000, cost: 210000, pred: "t62a", shells: guns([320, 264], [320, 330], [420, 50]),
  }),
  tank({
    id: "kv1", name: "КВ-1", country: "ussr", tier: 5, type: "heavy", role: "breach",
    hp: 960, speed: 34, hull: [90, 75, 70], turret: [90, 75, 75], casemate: false,
    gun: "ЗИС-5", caliber: 76, reload: 7.8, dispersion: 0.46, aim: 2.6,
    view: 310, camo: 0.08, mass: 48, power: 12, traverse: 24, repair: 3200,
    xp: 450, cost: 14000, pred: null, shells: guns([160, 120], [160, 160], [280, 38]),
  }),
  tank({
    id: "kv85", name: "КВ-85", country: "ussr", tier: 6, type: "heavy", role: "assault",
    hp: 1120, speed: 34, hull: [75, 60, 60], turret: [100, 90, 90], casemate: false,
    gun: "Д-5Т", caliber: 85, reload: 8.2, dispersion: 0.42, aim: 2.6,
    view: 320, camo: 0.07, mass: 46, power: 13, traverse: 26, repair: 4400,
    xp: 2800, cost: 24000, pred: "kv1", shells: guns([200, 144], [200, 194], [300, 44]),
  }),
  tank({
    id: "is", name: "ИС", country: "ussr", tier: 7, type: "heavy", role: "breach",
    hp: 1380, speed: 37, hull: [120, 90, 60], turret: [100, 90, 90], casemate: false,
    gun: "Д-25Т", caliber: 122, reload: 10.5, dispersion: 0.46, aim: 2.9,
    view: 330, camo: 0.07, mass: 46, power: 14, traverse: 28, repair: 6400,
    xp: 5200, cost: 46000, pred: "kv85", shells: guns([390, 175], [390, 217], [530, 61]),
  }),
  tank({
    id: "is3", name: "ИС-3", country: "ussr", tier: 8, type: "heavy", role: "breach",
    hp: 1550, speed: 38, hull: [110, 90, 60], turret: [220, 150, 90], casemate: false,
    gun: "Д-25Т", caliber: 122, reload: 11, dispersion: 0.4, aim: 2.9,
    view: 340, camo: 0.06, mass: 49, power: 14, traverse: 28, repair: 9000,
    xp: 9000, cost: 76000, pred: "is", shells: guns([390, 225], [390, 265], [530, 61]),
  }),
  tank({
    id: "t10", name: "Т-10", country: "ussr", tier: 9, type: "heavy", role: "breach",
    hp: 1850, speed: 42, hull: [120, 90, 60], turret: [250, 170, 90], casemate: false,
    gun: "122 мм", caliber: 122, reload: 11.4, dispersion: 0.38, aim: 2.8,
    view: 360, camo: 0.05, mass: 50, power: 14, traverse: 28, repair: 13000,
    xp: 15000, cost: 125000, pred: "is3", shells: guns([440, 248], [440, 290], [540, 68]),
  }),
  tank({
    id: "is7", name: "ИС-7", country: "ussr", tier: 10, type: "heavy", role: "breach",
    hp: 2150, speed: 50, hull: [150, 150, 100], turret: [240, 185, 94], casemate: false,
    gun: "130 мм", caliber: 130, reload: 12.2, dispersion: 0.38, aim: 2.9,
    view: 370, camo: 0.04, mass: 68, power: 15, traverse: 26, repair: 18000,
    xp: 25000, cost: 210000, pred: "t10", shells: guns([490, 258], [490, 310], [640, 68]),
  }),
  tank({
    id: "su85", name: "СУ-85", country: "ussr", tier: 5, type: "td", role: "sniper",
    hp: 640, speed: 44, hull: [45, 45, 40], turret: [45, 45, 40], casemate: true,
    gun: "Д-5С", caliber: 85, reload: 6.8, dispersion: 0.38, aim: 2.1,
    view: 300, camo: 0.22, mass: 29, power: 16, traverse: 32, repair: 2200,
    xp: 450, cost: 14000, pred: null, shells: guns([200, 144], [200, 194], [300, 44]),
  }),
  tank({
    id: "su100", name: "СУ-100", country: "ussr", tier: 6, type: "td", role: "sniper",
    hp: 780, speed: 50, hull: [75, 45, 45], turret: [75, 45, 45], casemate: true,
    gun: "Д-10С", caliber: 100, reload: 8.4, dispersion: 0.38, aim: 2.3,
    view: 320, camo: 0.2, mass: 31, power: 16, traverse: 34, repair: 3800,
    xp: 2800, cost: 24000, pred: "su85", shells: guns([250, 175], [250, 235], [330, 50]),
  }),
  tank({
    id: "su152", name: "СУ-152", country: "ussr", tier: 7, type: "td", role: "assault",
    hp: 1040, speed: 43, hull: [75, 60, 60], turret: [75, 60, 60], casemate: true,
    gun: "МЛ-20", caliber: 152, reload: 14.5, dispersion: 0.5, aim: 3.2,
    view: 310, camo: 0.12, mass: 46, power: 13, traverse: 26, repair: 6000,
    xp: 5200, cost: 46000, pred: "su100", shells: guns([700, 135], [700, 250], [950, 86]),
  }),
  tank({
    id: "isu", name: "ИСУ-152", country: "ussr", tier: 8, type: "td", role: "ambush",
    hp: 1400, speed: 38, hull: [90, 90, 60], turret: [90, 90, 60], casemate: true,
    gun: "БЛ-10", caliber: 152, reload: 18.5, dispersion: 0.58, aim: 3.4,
    view: 320, camo: 0.1, mass: 46, power: 14, traverse: 24, repair: 10000,
    xp: 9000, cost: 78000, pred: "su152", shells: guns([750, 260], [750, 300], [1100, 90]),
  }),
  tank({
    id: "obj704", name: "Объект 704", country: "ussr", tier: 9, type: "td", role: "ambush",
    hp: 1600, speed: 40, hull: [120, 90, 60], turret: [120, 90, 60], casemate: true,
    gun: "БЛ-10", caliber: 152, reload: 17.5, dispersion: 0.52, aim: 3.2,
    view: 340, camo: 0.1, mass: 47, power: 14, traverse: 24, repair: 13000,
    xp: 15000, cost: 125000, pred: "isu", shells: guns([750, 286], [750, 329], [1100, 90]),
  }),
  tank({
    id: "obj268", name: "Объект 268", country: "ussr", tier: 10, type: "td", role: "ambush",
    hp: 1850, speed: 48, hull: [187, 100, 50], turret: [187, 100, 50], casemate: true,
    gun: "152 мм", caliber: 152, reload: 16.5, dispersion: 0.48, aim: 3,
    view: 360, camo: 0.08, mass: 50, power: 15, traverse: 26, repair: 17000,
    xp: 25000, cost: 210000, pred: "obj704", shells: guns([850, 303], [850, 360], [1100, 90]),
  }),
  tank({
    id: "su122", name: "СУ-122", country: "ussr", tier: 5, type: "spg", role: "support",
    hp: 420, speed: 32, hull: [30, 20, 16], turret: [20, 12, 12], casemate: true,
    gun: "М-30", caliber: 122, reload: 12.5, dispersion: 0.7, aim: 4.2,
    view: 270, camo: 0.18, mass: 24, power: 12, traverse: 22, repair: 1800,
    xp: 450, cost: 14000, pred: null, shells: guns([450, 40], [450, 60], [700, 48]),
  }),
  tank({
    id: "su14", name: "СУ-14", country: "ussr", tier: 6, type: "spg", role: "support",
    hp: 480, speed: 30, hull: [30, 20, 16], turret: [20, 12, 12], casemate: true,
    gun: "Б-4", caliber: 152, reload: 14, dispersion: 0.74, aim: 4.6,
    view: 270, camo: 0.12, mass: 42, power: 10, traverse: 16, repair: 3200,
    xp: 2600, cost: 22000, pred: "su122", shells: guns([600, 48], [600, 70], [900, 60]),
  }),
  tank({
    id: "s51", name: "С-51", country: "ussr", tier: 7, type: "spg", role: "support",
    hp: 520, speed: 30, hull: [30, 20, 16], turret: [16, 10, 10], casemate: true,
    gun: "Б-4", caliber: 203, reload: 16, dispersion: 0.8, aim: 5,
    view: 270, camo: 0.08, mass: 50, power: 10, traverse: 14, repair: 4800,
    xp: 5000, cost: 44000, pred: "su14", shells: guns([750, 50], [750, 70], [1200, 70]),
  }),
  tank({
    id: "luchs", name: "Luchs", country: "germany", tier: 4, type: "light", role: "scout",
    hp: 400, speed: 60, hull: [30, 20, 20], turret: [30, 20, 20], casemate: false,
    gun: "5 cm", caliber: 50, reload: 3.2, dispersion: 0.44, aim: 1.8,
    view: 360, camo: 0.28, mass: 12, power: 30, traverse: 44, repair: 550,
    xp: 450, cost: 12000, pred: null, shells: guns([70, 85], [70, 120], [90, 25]),
  }),
  tank({
    id: "vk1602", name: "VK 16.02", country: "germany", tier: 5, type: "light", role: "scout",
    hp: 540, speed: 60, hull: [50, 30, 20], turret: [50, 30, 20], casemate: false,
    gun: "5 cm", caliber: 50, reload: 3.5, dispersion: 0.42, aim: 1.9,
    view: 370, camo: 0.24, mass: 16, power: 26, traverse: 40, repair: 1500,
    xp: 1600, cost: 11000, pred: "luchs", shells: guns([75, 100], [75, 140], [100, 25]),
  }),
  tank({
    id: "vk2801", name: "VK 28.01", country: "germany", tier: 6, type: "light", role: "flank",
    hp: 740, speed: 64, hull: [50, 30, 30], turret: [50, 30, 30], casemate: false,
    gun: "7,5 cm", caliber: 75, reload: 5.2, dispersion: 0.4, aim: 2,
    view: 380, camo: 0.2, mass: 22, power: 24, traverse: 38, repair: 3000,
    xp: 2800, cost: 22000, pred: "vk1602", shells: guns([135, 150], [135, 194], [175, 38]),
  }),
  tank({
    id: "spahpz", name: "Spähpanzer SP I C", country: "germany", tier: 7, type: "light", role: "flank",
    hp: 900, speed: 68, hull: [30, 20, 20], turret: [30, 20, 20], casemate: false,
    gun: "9 cm", caliber: 90, reload: 6.4, dispersion: 0.38, aim: 1.9,
    view: 390, camo: 0.2, mass: 18, power: 26, traverse: 40, repair: 4600,
    xp: 5000, cost: 44000, pred: "vk2801", shells: guns([220, 180], [220, 240], [270, 44]),
  }),
  tank({
    id: "ru251", name: "Ru 251", country: "germany", tier: 8, type: "light", role: "flank",
    hp: 1100, speed: 72, hull: [25, 20, 16], turret: [30, 20, 20], casemate: false,
    gun: "9 cm", caliber: 90, reload: 6, dispersion: 0.36, aim: 1.8,
    view: 400, camo: 0.18, mass: 20, power: 28, traverse: 42, repair: 7400,
    xp: 8800, cost: 74000, pred: "spahpz", shells: guns([240, 212], [240, 268], [320, 45]),
  }),
  tank({
    id: "hwk12", name: "HWK 12", country: "germany", tier: 9, type: "light", role: "flank",
    hp: 1280, speed: 70, hull: [30, 22, 18], turret: [40, 25, 20], casemate: false,
    gun: "9 cm", caliber: 90, reload: 5.8, dispersion: 0.34, aim: 1.7,
    view: 410, camo: 0.18, mass: 21, power: 28, traverse: 42, repair: 11000,
    xp: 15000, cost: 125000, pred: "ru251", shells: guns([240, 232], [240, 292], [320, 45]),
  }),
  tank({
    id: "rhmwpz", name: "Rheinmetall Panzerwagen", country: "germany", tier: 10, type: "light", role: "flank",
    hp: 1440, speed: 75, hull: [35, 25, 20], turret: [50, 30, 25], casemate: false,
    gun: "10,5 cm", caliber: 105, reload: 7.2, dispersion: 0.32, aim: 1.6,
    view: 420, camo: 0.16, mass: 24, power: 30, traverse: 44, repair: 15000,
    xp: 25000, cost: 210000, pred: "hwk12", shells: guns([320, 268], [320, 330], [420, 50]),
  }),
  tank({
    id: "pz4", name: "Pz.IV H", country: "germany", tier: 5, type: "medium", role: "flank",
    hp: 840, speed: 40, hull: [80, 30, 20], turret: [50, 30, 30], casemate: false,
    gun: "7,5 cm", caliber: 75, reload: 6.2, dispersion: 0.42, aim: 2.2,
    view: 340, camo: 0.14, mass: 25, power: 16, traverse: 36, repair: 2400,
    xp: 450, cost: 14000, pred: null, shells: guns([160, 110], [160, 158], [280, 38]),
  }),
  tank({
    id: "vk3002", name: "VK 30.02 M", country: "germany", tier: 6, type: "medium", role: "sniper",
    hp: 1000, speed: 50, hull: [80, 40, 40], turret: [100, 60, 60], casemate: false,
    gun: "7,5 cm", caliber: 75, reload: 5.4, dispersion: 0.36, aim: 2.1,
    view: 370, camo: 0.14, mass: 34, power: 18, traverse: 36, repair: 4000,
    xp: 2600, cost: 22000, pred: "pz4", shells: guns([160, 150], [160, 194], [240, 38]),
  }),
  tank({
    id: "panther", name: "Panther", country: "germany", tier: 7, type: "medium", role: "sniper",
    hp: 1280, speed: 55, hull: [85, 50, 40], turret: [120, 60, 60], casemate: false,
    gun: "7,5 cm KwK", caliber: 75, reload: 4.6, dispersion: 0.34, aim: 2,
    view: 380, camo: 0.12, mass: 45, power: 15, traverse: 34, repair: 6200,
    xp: 5000, cost: 44000, pred: "vk3002", shells: guns([135, 198], [135, 244], [175, 38]),
  }),
  tank({
    id: "panther2", name: "Panther II", country: "germany", tier: 8, type: "medium", role: "sniper",
    hp: 1500, speed: 55, hull: [100, 60, 40], turret: [150, 80, 80], casemate: false,
    gun: "8,8 cm", caliber: 88, reload: 6.4, dispersion: 0.34, aim: 2.2,
    view: 390, camo: 0.1, mass: 47, power: 16, traverse: 34, repair: 8600,
    xp: 8800, cost: 74000, pred: "panther", shells: guns([240, 203], [240, 237], [295, 44]),
  }),
  tank({
    id: "e50", name: "E 50", country: "germany", tier: 9, type: "medium", role: "sniper",
    hp: 1750, speed: 60, hull: [150, 80, 80], turret: [185, 80, 80], casemate: false,
    gun: "10,5 cm", caliber: 105, reload: 8.2, dispersion: 0.32, aim: 2.1,
    view: 400, camo: 0.1, mass: 62, power: 16, traverse: 32, repair: 12500,
    xp: 15000, cost: 125000, pred: "panther2", shells: guns([360, 248], [360, 303], [440, 60]),
  }),
  tank({
    id: "e50m", name: "E 50 Ausf. M", country: "germany", tier: 10, type: "medium", role: "sniper",
    hp: 1950, speed: 60, hull: [150, 80, 80], turret: [185, 80, 80], casemate: false,
    gun: "10,5 cm", caliber: 105, reload: 7.8, dispersion: 0.3, aim: 2,
    view: 410, camo: 0.1, mass: 62, power: 17, traverse: 34, repair: 16500,
    xp: 25000, cost: 210000, pred: "e50", shells: guns([390, 270], [390, 330], [480, 60]),
  }),
  tank({
    id: "vk3001", name: "VK 30.01 H", country: "germany", tier: 5, type: "heavy", role: "assault",
    hp: 900, speed: 35, hull: [70, 50, 50], turret: [80, 60, 60], casemate: false,
    gun: "7,5 cm", caliber: 75, reload: 6.8, dispersion: 0.42, aim: 2.3,
    view: 330, camo: 0.08, mass: 32, power: 15, traverse: 28, repair: 2600,
    xp: 450, cost: 14000, pred: null, shells: guns([160, 110], [160, 158], [280, 38]),
  }),
  tank({
    id: "vk3601", name: "VK 36.01 H", country: "germany", tier: 6, type: "heavy", role: "assault",
    hp: 1180, speed: 34, hull: [100, 60, 60], turret: [100, 80, 80], casemate: false,
    gun: "8,8 cm", caliber: 88, reload: 7.6, dispersion: 0.38, aim: 2.5,
    view: 340, camo: 0.07, mass: 40, power: 14, traverse: 26, repair: 4600,
    xp: 3000, cost: 26000, pred: "vk3001", shells: guns([220, 165], [220, 203], [280, 44]),
  }),
  tank({
    id: "tiger", name: "Tiger", country: "germany", tier: 7, type: "heavy", role: "breach",
    hp: 1500, speed: 40, hull: [100, 80, 80], turret: [100, 80, 80], casemate: false,
    gun: "8,8 cm", caliber: 88, reload: 7.2, dispersion: 0.36, aim: 2.3,
    view: 360, camo: 0.06, mass: 57, power: 12, traverse: 24, repair: 6800,
    xp: 5400, cost: 48000, pred: "vk3601", shells: guns([240, 203], [240, 237], [295, 44]),
  }),
  tank({
    id: "tiger2", name: "Tiger II", country: "germany", tier: 8, type: "heavy", role: "breach",
    hp: 1650, speed: 38, hull: [150, 80, 80], turret: [185, 80, 80], casemate: false,
    gun: "10,5 cm", caliber: 105, reload: 9.2, dispersion: 0.36, aim: 2.5,
    view: 370, camo: 0.05, mass: 68, power: 11, traverse: 22, repair: 9800,
    xp: 9200, cost: 80000, pred: "tiger", shells: guns([320, 225], [320, 265], [420, 60]),
  }),
  tank({
    id: "e75", name: "E 75", country: "germany", tier: 9, type: "heavy", role: "breach",
    hp: 1920, speed: 40, hull: [160, 80, 80], turret: [215, 150, 80], casemate: false,
    gun: "12,8 cm", caliber: 128, reload: 12, dispersion: 0.36, aim: 2.6,
    view: 380, camo: 0.04, mass: 88, power: 10, traverse: 20, repair: 13500,
    xp: 15000, cost: 125000, pred: "tiger2", shells: guns([490, 246], [490, 311], [630, 65]),
  }),
  tank({
    id: "e100", name: "E 100", country: "germany", tier: 10, type: "heavy", role: "breach",
    hp: 2440, speed: 30, hull: [200, 120, 150], turret: [240, 150, 150], casemate: false,
    gun: "15 cm", caliber: 150, reload: 16.5, dispersion: 0.38, aim: 2.8,
    view: 390, camo: 0.03, mass: 130, power: 9, traverse: 16, repair: 19000,
    xp: 25000, cost: 210000, pred: "e75", shells: guns([750, 235], [750, 295], [950, 85]),
  }),
  tank({
    id: "stug", name: "StuG III", country: "germany", tier: 5, type: "td", role: "ambush",
    hp: 760, speed: 40, hull: [80, 30, 30], turret: [80, 30, 30], casemate: true,
    gun: "7,5 cm", caliber: 75, reload: 6.4, dispersion: 0.36, aim: 1.8,
    view: 310, camo: 0.24, mass: 24, power: 16, traverse: 34, repair: 2100,
    xp: 0, cost: 0, pred: null, shells: guns([160, 150], [160, 194], [280, 38]),
  }),
  tank({
    id: "jp4", name: "Jagdpanzer IV", country: "germany", tier: 6, type: "td", role: "ambush",
    hp: 860, speed: 40, hull: [80, 40, 30], turret: [80, 40, 30], casemate: true,
    gun: "7,5 cm", caliber: 75, reload: 5.6, dispersion: 0.34, aim: 1.8,
    view: 330, camo: 0.22, mass: 25, power: 16, traverse: 34, repair: 3600,
    xp: 2400, cost: 20000, pred: "stug", shells: guns([160, 150], [160, 194], [240, 38]),
  }),
  tank({
    id: "jpanther", name: "Jagdpanther", country: "germany", tier: 7, type: "td", role: "sniper",
    hp: 1100, speed: 46, hull: [120, 50, 40], turret: [120, 50, 40], casemate: true,
    gun: "8,8 cm", caliber: 88, reload: 7.4, dispersion: 0.34, aim: 2,
    view: 350, camo: 0.16, mass: 45, power: 15, traverse: 30, repair: 6000,
    xp: 5000, cost: 44000, pred: "jp4", shells: guns([240, 203], [240, 237], [295, 44]),
  }),
  tank({
    id: "ferd", name: "Ferdinand", country: "germany", tier: 8, type: "td", role: "assault",
    hp: 1400, speed: 30, hull: [200, 80, 80], turret: [200, 80, 80], casemate: true,
    gun: "12,8 cm", caliber: 128, reload: 12, dispersion: 0.38, aim: 2.6,
    view: 340, camo: 0.08, mass: 65, power: 10, traverse: 20, repair: 9600,
    xp: 9000, cost: 78000, pred: "jpanther", shells: guns([490, 246], [490, 311], [630, 65]),
  }),
  tank({
    id: "jagdtiger", name: "Jagdtiger", country: "germany", tier: 9, type: "td", role: "assault",
    hp: 1700, speed: 28, hull: [250, 80, 80], turret: [250, 80, 80], casemate: true,
    gun: "12,8 cm", caliber: 128, reload: 11.4, dispersion: 0.36, aim: 2.5,
    view: 360, camo: 0.06, mass: 72, power: 10, traverse: 18, repair: 13000,
    xp: 15000, cost: 125000, pred: "ferd", shells: guns([560, 276], [560, 352], [700, 65]),
  }),
  tank({
    id: "jgpze100", name: "JagdPz. E 100", country: "germany", tier: 10, type: "td", role: "assault",
    hp: 2100, speed: 30, hull: [250, 120, 80], turret: [250, 120, 80], casemate: true,
    gun: "17 cm", caliber: 170, reload: 18, dispersion: 0.38, aim: 2.7,
    view: 370, camo: 0.04, mass: 90, power: 10, traverse: 16, repair: 17500,
    xp: 25000, cost: 210000, pred: "jagdtiger", shells: guns([850, 299], [850, 380], [1100, 85]),
  }),
  tank({
    id: "grille", name: "Grille", country: "germany", tier: 5, type: "spg", role: "support",
    hp: 400, speed: 35, hull: [20, 14, 12], turret: [12, 8, 8], casemate: true,
    gun: "15 cm", caliber: 150, reload: 13, dispersion: 0.72, aim: 4.4,
    view: 280, camo: 0.16, mass: 16, power: 14, traverse: 24, repair: 1700,
    xp: 450, cost: 14000, pred: null, shells: guns([500, 42], [500, 60], [750, 50]),
  }),
  tank({
    id: "hummel", name: "Hummel", country: "germany", tier: 6, type: "spg", role: "support",
    hp: 460, speed: 42, hull: [30, 16, 16], turret: [14, 10, 10], casemate: true,
    gun: "15 cm", caliber: 150, reload: 14.2, dispersion: 0.74, aim: 4.6,
    view: 280, camo: 0.12, mass: 24, power: 12, traverse: 20, repair: 3000,
    xp: 2600, cost: 22000, pred: "grille", shells: guns([600, 48], [600, 70], [900, 60]),
  }),
  tank({
    id: "gwp", name: "G.W. Panther", country: "germany", tier: 7, type: "spg", role: "support",
    hp: 520, speed: 46, hull: [30, 20, 16], turret: [16, 10, 10], casemate: true,
    gun: "15 cm", caliber: 150, reload: 15, dispersion: 0.7, aim: 4.4,
    view: 290, camo: 0.1, mass: 35, power: 14, traverse: 22, repair: 4600,
    xp: 5000, cost: 44000, pred: "hummel", shells: guns([680, 50], [680, 72], [1000, 64]),
  }),
  tank({
    id: "gwtiger", name: "G.W. Tiger", country: "germany", tier: 8, type: "spg", role: "support",
    hp: 580, speed: 35, hull: [30, 20, 16], turret: [16, 10, 10], casemate: true,
    gun: "21 cm", caliber: 210, reload: 17, dispersion: 0.76, aim: 5.2,
    view: 300, camo: 0.08, mass: 45, power: 12, traverse: 16, repair: 7200,
    xp: 8800, cost: 74000, pred: "gwp", shells: guns([800, 52], [800, 74], [1200, 70]),
  }),
  tank({
    id: "gwtigerp", name: "G.W. Tiger P", country: "germany", tier: 9, type: "spg", role: "support",
    hp: 640, speed: 35, hull: [40, 24, 16], turret: [16, 10, 10], casemate: true,
    gun: "21 cm", caliber: 210, reload: 17.5, dispersion: 0.74, aim: 5,
    view: 310, camo: 0.06, mass: 50, power: 12, traverse: 16, repair: 11000,
    xp: 15000, cost: 125000, pred: "gwtiger", shells: guns([900, 55], [900, 78], [1350, 74]),
  }),
  tank({
    id: "gwe100", name: "G.W. E 100", country: "germany", tier: 10, type: "spg", role: "support",
    hp: 700, speed: 40, hull: [50, 30, 20], turret: [20, 12, 12], casemate: true,
    gun: "21 cm", caliber: 210, reload: 18, dispersion: 0.7, aim: 4.8,
    view: 320, camo: 0.05, mass: 58, power: 12, traverse: 18, repair: 15000,
    xp: 25000, cost: 210000, pred: "gwtigerp", shells: guns([1000, 58], [1000, 82], [1500, 78]),
  }),
  tank({
    id: "m5", name: "M5", country: "usa", tier: 5, type: "light", role: "scout",
    hp: 520, speed: 58, hull: [29, 25, 25], turret: [38, 25, 25], casemate: false,
    gun: "37 мм", caliber: 37, reload: 2.8, dispersion: 0.42, aim: 1.7,
    view: 360, camo: 0.26, mass: 15, power: 28, traverse: 42, repair: 1400,
    xp: 450, cost: 14000, pred: null, shells: guns([40, 90], [40, 125], [50, 20]),
  }),
  tank({
    id: "chaffee", name: "Chaffee", country: "usa", tier: 6, type: "light", role: "scout",
    hp: 700, speed: 64, hull: [25, 25, 19], turret: [25, 25, 25], casemate: false,
    gun: "75 мм", caliber: 75, reload: 5.4, dispersion: 0.42, aim: 2,
    view: 390, camo: 0.22, mass: 18, power: 24, traverse: 40, repair: 2800,
    xp: 2400, cost: 20000, pred: "m5", shells: guns([160, 120], [160, 160], [240, 38]),
  }),
  tank({
    id: "t37", name: "T37", country: "usa", tier: 7, type: "light", role: "flank",
    hp: 920, speed: 66, hull: [25, 25, 19], turret: [25, 25, 25], casemate: false,
    gun: "76 мм", caliber: 76, reload: 5.8, dispersion: 0.4, aim: 2,
    view: 400, camo: 0.2, mass: 20, power: 24, traverse: 40, repair: 4200,
    xp: 4600, cost: 40000, pred: "chaffee", shells: guns([170, 150], [170, 190], [250, 40]),
  }),
  tank({
    id: "m41bulldog", name: "M41 Walker Bulldog", country: "usa", tier: 8, type: "light", role: "flank",
    hp: 1100, speed: 68, hull: [25, 25, 19], turret: [25, 25, 25], casemate: false,
    gun: "76 мм", caliber: 76, reload: 5.4, dispersion: 0.38, aim: 1.8,
    view: 400, camo: 0.18, mass: 22, power: 24, traverse: 42, repair: 7200,
    xp: 8600, cost: 72000, pred: "t37", shells: guns([170, 175], [170, 230], [250, 40]),
  }),
  tank({
    id: "t49", name: "T49", country: "usa", tier: 9, type: "light", role: "flank",
    hp: 1280, speed: 70, hull: [32, 25, 19], turret: [32, 25, 25], casemate: false,
    gun: "90 мм", caliber: 90, reload: 6.2, dispersion: 0.36, aim: 1.8,
    view: 410, camo: 0.16, mass: 24, power: 24, traverse: 42, repair: 11000,
    xp: 15000, cost: 125000, pred: "m41bulldog", shells: guns([240, 210], [240, 268], [320, 45]),
  }),
  tank({
    id: "sheridan", name: "XM551 Sheridan", country: "usa", tier: 10, type: "light", role: "flank",
    hp: 1440, speed: 65, hull: [32, 25, 19], turret: [32, 25, 25], casemate: false,
    gun: "105 мм", caliber: 105, reload: 8, dispersion: 0.38, aim: 2,
    view: 420, camo: 0.16, mass: 16, power: 28, traverse: 40, repair: 15000,
    xp: 25000, cost: 210000, pred: "t49", shells: guns([390, 248], [390, 310], [480, 53]),
  }),
  tank({
    id: "sherman", name: "Sherman", country: "usa", tier: 5, type: "medium", role: "flank",
    hp: 800, speed: 48, hull: [51, 38, 38], turret: [76, 51, 51], casemate: false,
    gun: "75 мм", caliber: 75, reload: 6, dispersion: 0.44, aim: 2.1,
    view: 340, camo: 0.14, mass: 30, power: 16, traverse: 36, repair: 2300,
    xp: 450, cost: 14000, pred: null, shells: guns([160, 110], [160, 158], [280, 38]),
  }),
  tank({
    id: "e8", name: "Easy 8", country: "usa", tier: 6, type: "medium", role: "flank",
    hp: 980, speed: 48, hull: [64, 38, 38], turret: [76, 51, 51], casemate: false,
    gun: "76 мм", caliber: 76, reload: 6.4, dispersion: 0.4, aim: 2.2,
    view: 360, camo: 0.14, mass: 32, power: 16, traverse: 36, repair: 4000,
    xp: 2600, cost: 22000, pred: "sherman", shells: guns([170, 149], [170, 190], [250, 40]),
  }),
  tank({
    id: "t20", name: "T20", country: "usa", tier: 7, type: "medium", role: "flank",
    hp: 1240, speed: 56, hull: [64, 38, 38], turret: [89, 64, 64], casemate: false,
    gun: "76 мм", caliber: 76, reload: 5.8, dispersion: 0.38, aim: 2,
    view: 380, camo: 0.14, mass: 30, power: 18, traverse: 38, repair: 5600,
    xp: 4800, cost: 42000, pred: "e8", shells: guns([170, 160], [170, 210], [250, 40]),
  }),
  tank({
    id: "pershing", name: "Pershing", country: "usa", tier: 8, type: "medium", role: "assault",
    hp: 1520, speed: 48, hull: [102, 76, 51], turret: [127, 76, 76], casemate: false,
    gun: "90 мм", caliber: 90, reload: 7.6, dispersion: 0.36, aim: 2.2,
    view: 380, camo: 0.1, mass: 42, power: 15, traverse: 34, repair: 8400,
    xp: 8600, cost: 72000, pred: "t20", shells: guns([240, 190], [240, 268], [320, 45]),
  }),
  tank({
    id: "m46", name: "M46 Patton", country: "usa", tier: 9, type: "medium", role: "assault",
    hp: 1750, speed: 48, hull: [102, 76, 51], turret: [127, 76, 76], casemate: false,
    gun: "105 мм", caliber: 105, reload: 8.4, dispersion: 0.36, aim: 2.1,
    view: 400, camo: 0.1, mass: 44, power: 16, traverse: 36, repair: 12000,
    xp: 15000, cost: 125000, pred: "pershing", shells: guns([320, 218], [320, 265], [420, 53]),
  }),
  tank({
    id: "m48", name: "M48 Patton", country: "usa", tier: 10, type: "medium", role: "assault",
    hp: 2000, speed: 45, hull: [110, 76, 35], turret: [178, 76, 51], casemate: false,
    gun: "105 мм", caliber: 105, reload: 7.8, dispersion: 0.34, aim: 2,
    view: 410, camo: 0.1, mass: 47, power: 16, traverse: 36, repair: 16000,
    xp: 25000, cost: 210000, pred: "m46", shells: guns([390, 258], [390, 330], [480, 53]),
  }),
  tank({
    id: "t1", name: "T1", country: "usa", tier: 5, type: "heavy", role: "assault",
    hp: 940, speed: 35, hull: [83, 44, 41], turret: [102, 83, 83], casemate: false,
    gun: "76 мм", caliber: 76, reload: 6.8, dispersion: 0.44, aim: 2.3,
    view: 320, camo: 0.07, mass: 58, power: 12, traverse: 24, repair: 2800,
    xp: 450, cost: 14000, pred: null, shells: guns([160, 128], [160, 177], [240, 38]),
  }),
  tank({
    id: "m6", name: "M6", country: "usa", tier: 6, type: "heavy", role: "assault",
    hp: 1160, speed: 35, hull: [102, 44, 41], turret: [102, 83, 83], casemate: false,
    gun: "90 мм", caliber: 90, reload: 8, dispersion: 0.4, aim: 2.4,
    view: 330, camo: 0.06, mass: 57, power: 13, traverse: 24, repair: 4400,
    xp: 2800, cost: 24000, pred: "t1", shells: guns([240, 160], [240, 243], [320, 45]),
  }),
  tank({
    id: "t29", name: "T29", country: "usa", tier: 7, type: "heavy", role: "breach",
    hp: 1400, speed: 35, hull: [102, 76, 51], turret: [279, 127, 102], casemate: false,
    gun: "105 мм", caliber: 105, reload: 9.4, dispersion: 0.4, aim: 2.5,
    view: 360, camo: 0.06, mass: 64, power: 12, traverse: 24, repair: 6600,
    xp: 5200, cost: 46000, pred: "m6", shells: guns([320, 198], [320, 245], [420, 53]),
  }),
  tank({
    id: "t32", name: "T32", country: "usa", tier: 8, type: "heavy", role: "breach",
    hp: 1600, speed: 35, hull: [127, 76, 51], turret: [298, 152, 152], casemate: false,
    gun: "105 мм", caliber: 105, reload: 9.6, dispersion: 0.4, aim: 2.5,
    view: 370, camo: 0.05, mass: 54, power: 14, traverse: 24, repair: 9400,
    xp: 9000, cost: 78000, pred: "t29", shells: guns([320, 218], [320, 265], [420, 53]),
  }),
  tank({
    id: "m103", name: "M103", country: "usa", tier: 9, type: "heavy", role: "breach",
    hp: 1850, speed: 34, hull: [127, 51, 51], turret: [254, 127, 70], casemate: false,
    gun: "120 мм", caliber: 120, reload: 11.2, dispersion: 0.38, aim: 2.6,
    view: 380, camo: 0.04, mass: 58, power: 13, traverse: 24, repair: 13000,
    xp: 15000, cost: 125000, pred: "t32", shells: guns([400, 248], [400, 300], [515, 60]),
  }),
  tank({
    id: "t110e5", name: "T110E5", country: "usa", tier: 10, type: "heavy", role: "breach",
    hp: 2200, speed: 37, hull: [254, 76, 38], turret: [203, 127, 70], casemate: false,
    gun: "120 мм", caliber: 120, reload: 10.5, dispersion: 0.36, aim: 2.5,
    view: 390, camo: 0.04, mass: 54, power: 14, traverse: 26, repair: 17500,
    xp: 25000, cost: 210000, pred: "m103", shells: guns([400, 258], [400, 340], [515, 60]),
  }),
  tank({
    id: "m10", name: "M10", country: "usa", tier: 5, type: "td", role: "sniper",
    hp: 620, speed: 48, hull: [51, 19, 19], turret: [57, 25, 25], casemate: false,
    gun: "76 мм", caliber: 76, reload: 6.2, dispersion: 0.4, aim: 2,
    view: 340, camo: 0.18, mass: 29, power: 16, traverse: 32, repair: 2000,
    xp: 450, cost: 14000, pred: null, shells: guns([170, 128], [170, 177], [240, 38]),
  }),
  tank({
    id: "hellcat", name: "Hellcat", country: "usa", tier: 6, type: "td", role: "flank",
    hp: 760, speed: 72, hull: [13, 13, 13], turret: [16, 13, 13], casemate: false,
    gun: "76 мм", caliber: 76, reload: 6, dispersion: 0.4, aim: 1.8,
    view: 360, camo: 0.24, mass: 17, power: 28, traverse: 36, repair: 3200,
    xp: 2400, cost: 20000, pred: "m10", shells: guns([170, 160], [170, 210], [240, 38]),
  }),
  tank({
    id: "t25at", name: "T25 AT", country: "usa", tier: 7, type: "td", role: "sniper",
    hp: 980, speed: 56, hull: [76, 38, 25], turret: [76, 38, 25], casemate: true,
    gun: "90 мм", caliber: 90, reload: 7.2, dispersion: 0.36, aim: 1.9,
    view: 350, camo: 0.18, mass: 30, power: 18, traverse: 34, repair: 5400,
    xp: 4800, cost: 42000, pred: "hellcat", shells: guns([240, 190], [240, 268], [320, 45]),
  }),
  tank({
    id: "t28", name: "T28", country: "usa", tier: 8, type: "td", role: "assault",
    hp: 1500, speed: 18, hull: [254, 51, 51], turret: [254, 51, 51], casemate: true,
    gun: "105 мм", caliber: 105, reload: 8.8, dispersion: 0.38, aim: 2.2,
    view: 340, camo: 0.06, mass: 59, power: 8, traverse: 14, repair: 10000,
    xp: 8800, cost: 76000, pred: "t25at", shells: guns([320, 248], [320, 300], [420, 60]),
  }),
  tank({
    id: "t95", name: "T95", country: "usa", tier: 9, type: "td", role: "assault",
    hp: 1800, speed: 13, hull: [305, 152, 51], turret: [305, 152, 51], casemate: true,
    gun: "155 мм", caliber: 155, reload: 16, dispersion: 0.4, aim: 2.6,
    view: 350, camo: 0.04, mass: 86, power: 7, traverse: 10, repair: 13500,
    xp: 15000, cost: 125000, pred: "t28", shells: guns([750, 276], [750, 342], [950, 90]),
  }),
  tank({
    id: "t110e3", name: "T110E3", country: "usa", tier: 10, type: "td", role: "assault",
    hp: 2050, speed: 24, hull: [305, 76, 38], turret: [305, 76, 38], casemate: true,
    gun: "155 мм", caliber: 155, reload: 15, dispersion: 0.38, aim: 2.4,
    view: 370, camo: 0.05, mass: 66, power: 10, traverse: 16, repair: 17500,
    xp: 25000, cost: 210000, pred: "t95", shells: guns([750, 295], [750, 375], [950, 90]),
  }),
  tank({
    id: "priest", name: "Priest", country: "usa", tier: 5, type: "spg", role: "support",
    hp: 400, speed: 38, hull: [25, 13, 13], turret: [13, 8, 8], casemate: true,
    gun: "105 мм", caliber: 105, reload: 11.5, dispersion: 0.68, aim: 4,
    view: 280, camo: 0.16, mass: 23, power: 16, traverse: 24, repair: 1600,
    xp: 450, cost: 14000, pred: null, shells: guns([360, 40], [360, 55], [550, 42]),
  }),
  tank({
    id: "m40", name: "M40", country: "usa", tier: 6, type: "spg", role: "support",
    hp: 460, speed: 38, hull: [25, 13, 13], turret: [13, 8, 8], casemate: true,
    gun: "155 мм", caliber: 155, reload: 14, dispersion: 0.76, aim: 4.8,
    view: 280, camo: 0.1, mass: 37, power: 12, traverse: 18, repair: 3000,
    xp: 2600, cost: 22000, pred: "priest", shells: guns([650, 48], [650, 70], [1000, 60]),
  }),
  tank({
    id: "m53", name: "M53", country: "usa", tier: 7, type: "spg", role: "support",
    hp: 540, speed: 40, hull: [25, 13, 13], turret: [13, 8, 8], casemate: true,
    gun: "155 мм", caliber: 155, reload: 15.2, dispersion: 0.72, aim: 4.6,
    view: 290, camo: 0.08, mass: 40, power: 14, traverse: 20, repair: 4600,
    xp: 5000, cost: 44000, pred: "m40", shells: guns([700, 52], [700, 74], [1100, 64]),
  }),
  tank({
    id: "m55", name: "M55", country: "usa", tier: 8, type: "spg", role: "support",
    hp: 580, speed: 38, hull: [25, 13, 13], turret: [13, 8, 8], casemate: true,
    gun: "203 мм", caliber: 203, reload: 16.5, dispersion: 0.74, aim: 4.8,
    view: 300, camo: 0.08, mass: 42, power: 14, traverse: 18, repair: 7200,
    xp: 8600, cost: 72000, pred: "m53", shells: guns([800, 52], [800, 74], [1200, 70]),
  }),
  tank({
    id: "t92a", name: "T92 HMC", country: "usa", tier: 9, type: "spg", role: "support",
    hp: 640, speed: 32, hull: [25, 13, 13], turret: [13, 8, 8], casemate: true,
    gun: "240 мм", caliber: 240, reload: 18, dispersion: 0.78, aim: 5.2,
    view: 310, camo: 0.06, mass: 58, power: 12, traverse: 16, repair: 11000,
    xp: 15000, cost: 125000, pred: "m55", shells: guns([950, 55], [950, 78], [1400, 74]),
  }),
  tank({
    id: "t92", name: "T92", country: "usa", tier: 10, type: "spg", role: "support",
    hp: 700, speed: 32, hull: [25, 13, 13], turret: [13, 8, 8], casemate: true,
    gun: "240 мм", caliber: 240, reload: 19, dispersion: 0.76, aim: 5,
    view: 320, camo: 0.05, mass: 58, power: 12, traverse: 16, repair: 15000,
    xp: 25000, cost: 210000, pred: "t92a", shells: guns([1100, 58], [1100, 82], [1600, 78]),
  }),
  ...EXTRA,
  ...NATIONS,
]

const EMPTY: Vehicle[] = []
const index = new Map<string, Vehicle>()
const kids = new Map<string, Vehicle[]>()
const typed = new Map<VehType, Vehicle[]>()

function rebuild() {
  index.clear()
  kids.clear()
  typed.clear()
  for (const v of VEHICLES) {
    index.set(v.id, v)
    if (v.pred) {
      const list = kids.get(v.pred)
      if (list) list.push(v)
      else kids.set(v.pred, [v])
    }
    const bucket = typed.get(v.type)
    if (bucket) bucket.push(v)
    else typed.set(v.type, [v])
  }
}

rebuild()

export function adoptVehicles(list: Vehicle[]) {
  VEHICLES.splice(0, VEHICLES.length, ...list)
  rebuild()
}

export function byId(id: string): Vehicle {
  const v = index.get(id)
  if (!v) throw new Error(`нет машины ${id}`)
  return v
}

export function successors(id: string): Vehicle[] {
  return kids.get(id) ?? EMPTY
}

export function ofType(type: VehType): Vehicle[] {
  return typed.get(type) ?? EMPTY
}

export function dpm(v: Vehicle): number {
  return Math.round((v.shells[0].damage * 60) / v.reload)
}

/** УВН: вниз / вверх. */
export function gunArc(v: Vehicle): [number, number] {
  if (v.type === "spg") return [-3, 45]
  if (v.casemate) return [-5, 12]
  if (v.type === "heavy") return [-6, 15]
  if (v.type === "td") return [-8, 14]
  if (v.type === "light") return [-6, 20]
  return [-6, 17]
}

export function gunArcText(v: Vehicle): string {
  const [down, up] = gunArc(v)
  return `${down}/+${up}`
}

export function fork(nominal: number): [number, number] {
  return [Math.round(nominal * 0.75), Math.round(nominal * 1.25)]
}

export const STARTERS = ["t34", "bt7", "stug"] as const
