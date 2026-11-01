import type { Country, Role, ShellKind, VehType } from "./types"

export const TYPE_LABEL: Record<VehType, string> = {
  light: "лёгкий",
  medium: "средний",
  heavy: "тяжёлый",
  td: "ПТ",
  spg: "САУ",
}

export const ROLE_LABEL: Record<Role, string> = {
  scout: "разведчик",
  flank: "фланговый",
  sniper: "снайпер",
  assault: "штурмовик",
  breach: "прорыва",
  support: "поддержка",
  ambush: "засадный",
}

export const ROLES: Role[] = ["scout", "flank", "sniper", "assault", "breach", "support", "ambush"]

export const TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export const COUNTRIES: Country[] = [
  "ussr", "germany", "usa", "france", "uk", "czech", "china", "japan", "poland", "sweden", "italy",
]

export const COUNTRY_LABEL: Record<Country, string> = {
  ussr: "СССР",
  germany: "Германия",
  usa: "США",
  france: "Франция",
  uk: "Великобритания",
  czech: "Чехословакия",
  china: "Китай",
  japan: "Япония",
  poland: "Польша",
  sweden: "Швеция",
  italy: "Италия",
}

export const TECH_TITLE: Record<Country, string> = {
  ussr: "Техника СССР",
  germany: "Техника Германии",
  usa: "Техника США",
  france: "Техника Франции",
  uk: "Техника Великобритании",
  czech: "Техника Чехословакии",
  china: "Техника Китая",
  japan: "Техника Японии",
  poland: "Техника Польши",
  sweden: "Техника Швеции",
  italy: "Техника Италии",
}

export const HOME_COUNTRIES: Country[] = ["ussr", "germany", "usa"]

export const SHELL_LABEL: Record<ShellKind, string> = {
  ap: "ББ",
  apcr: "БП",
  he: "ОФ",
}

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]

export function roman(tier: number): string {
  return ROMAN[tier] ?? String(tier)
}

export function fmt(n: number): string {
  const sign = n < 0 ? "−" : ""
  const abs = Math.abs(Math.round(n))
  return sign + String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

export function dec(n: number, digits = 1): string {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
