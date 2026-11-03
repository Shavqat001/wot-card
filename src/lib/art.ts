import { byId, successors, VEHICLES } from "./vehicles"
import { TANK_FILES } from "./tankFiles"

const FALLBACK: Record<string, string> = {
  ms1: "bt7",
  t26: "bt7",
  t46: "t50",
  bt2: "bt7",
  a20: "bt7",
  t70: "t50",
  t80: "t50",
  t28m: "t34",
  t43: "t3485",
  t150: "kv1",
  kv1s: "kv1",
  kv3: "kv85",
  kv13: "is",
  kv4: "is3",
  at1: "su85",
  su76: "su85",
  su85b: "su85",
  su100m1: "su100",
  su101: "su100",
  su18: "su122",
  su26: "su122",
  su5: "su122",
  su8: "su14",
  su142: "s51",
  ltr: "luchs",
  pzi: "luchs",
  pz2: "luchs",
  pz38t: "luchs",
  pz3: "pz4",
  dw2: "vk3001",
  vk3001p: "vk3001",
  tigerp: "tiger",
  marder: "stug",
  hetzer: "stug",
  nashorn: "jpanther",
  bison: "grille",
  wespe: "grille",
  bison15: "grille",
  t1c: "m5",
  m2lt: "m5",
  m3st: "m5",
  m2med: "sherman",
  m3lee: "sherman",
  m7: "sherman",
  t21: "chaffee",
  t18: "m10",
  t82: "m10",
  m8a1: "m10",
  m37: "priest",
  m41spg: "priest",
  ltg: "mt25",
  lt432: "mt25",
  spahpz: "vk2801",
  ru251: "vk2801",
  gwtiger: "gwp",
  m41bulldog: "t37",
  m55: "m53",
  vk4502a: "tiger",
}

const HAVE = new Set(TANK_FILES)
const memo = new Map<string, string>()

function nearest(start: string): string | null {
  const seen = new Set<string>()
  const queue = [start]
  while (queue.length) {
    const cur = queue.shift()
    if (!cur || seen.has(cur)) continue
    seen.add(cur)
    if (HAVE.has(cur)) return cur
    const mapped = FALLBACK[cur]
    if (mapped && HAVE.has(mapped)) return mapped
    try {
      const pred = byId(cur).pred
      if (pred) queue.push(pred)
    } catch {
      /* нет такой машины */
    }
    try {
      for (const kid of successors(cur)) queue.push(kid.id)
    } catch {
      /* нет ветки */
    }
  }
  return null
}

function nationAnchor(id: string): string | null {
  let country: string
  let type: string
  try {
    const v = byId(id)
    country = v.country
    type = v.type
  } catch {
    return null
  }
  const sameType = VEHICLES.find((v) => v.country === country && v.type === type && HAVE.has(v.id))
  if (sameType) return sameType.id
  return VEHICLES.find((v) => v.country === country && HAVE.has(v.id))?.id ?? null
}

/** Свой файл, иначе ближайший портрет ветки, иначе машина той же нации. */
export function artId(id: string, _type?: string): string {
  const hit = memo.get(id)
  if (hit) return hit
  const found = nearest(id) ?? nationAnchor(id) ?? (HAVE.has("t34") ? "t34" : id)
  memo.set(id, found)
  return found
}
