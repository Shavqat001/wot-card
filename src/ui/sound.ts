const base = import.meta.env.BASE_URL

const POOLS: Record<string, string[]> = {
  begin: ["battle_begin.MP3"],
  pompom: ["wot_pompom.mp3", "small_shot.mp3", "small_shot2.mp3"],
  mid: ["shot.mp3", "shot2.mp3", "shot3.mp3"],
  midsnipe: ["shot.mp3", "shot2.mp3", "shot3.mp3"],
  big: ["big_shot.mp3", "big_shot2.mp3"],
  bigsnipe: ["big_shot.mp3", "big_shot2.mp3"],
  boom: ["babaha.mp3", "big_shot2.mp3"],
  pen: ["penetration.mp3", "penetration2.mp3"],
  nopen: ["didnt-break-through.mp3", "didnt-break-through2.mp3"],
  ricochet: ["rikoshet.mp3"],
  splash: ["babaha.mp3"],
  kill: ["tank-destroyed.mp3"],
}

const MUSIC = "bg.mp3"
const THEME = "Main_Theme.mp3"

const cache = new Map<string, HTMLAudioElement>()
let ctx: AudioContext | null = null
let bed: HTMLAudioElement | null = null
let theme: HTMLAudioElement | null = null
let warmed = false

function context(): AudioContext | null {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx ??= new Ctx()
    if (ctx.state === "suspended") void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function source(file: string): HTMLAudioElement {
  let el = cache.get(file)
  if (!el) {
    el = new Audio(`${base}sounds/${file}`)
    el.preload = "auto"
    cache.set(file, el)
  }
  return el
}

function warm() {
  if (warmed) return
  warmed = true
  source(MUSIC)
  source(THEME)
  for (const files of Object.values(POOLS)) {
    for (const file of files) source(file)
  }
}

function pick(files: string[]): string {
  return files[Math.floor(Math.random() * files.length)] ?? files[0]
}

function playFile(file: string, volume: number) {
  const el = source(file).cloneNode(true) as HTMLAudioElement
  el.volume = volume
  void el.play().catch(() => {})
}

function bedEl(): HTMLAudioElement {
  if (!bed) {
    bed = source(MUSIC)
    bed.loop = true
  }
  bed.volume = 0.09
  return bed
}

function themeEl(): HTMLAudioElement {
  if (!theme) {
    theme = source(THEME)
    theme.loop = true
  }
  theme.volume = 0.16
  return theme
}

function hush(el: HTMLAudioElement | null) {
  if (el && !el.paused) el.pause()
}

export function startTheme() {
  if (document.visibilityState === "hidden") return
  warm()
  hush(bed)
  const el = themeEl()
  if (el.paused) void el.play().catch(() => {})
}

export function stopTheme() {
  hush(theme)
}

export function startMusic() {
  if (document.visibilityState === "hidden") return
  warm()
  hush(theme)
  const el = bedEl()
  if (el.paused) void el.play().catch(() => {})
}

export function stopMusic() {
  hush(bed)
}

function playPool(key: string, volume: number) {
  const files = POOLS[key]
  if (!files?.length) return
  playFile(pick(files), volume)
}

function tone(freq: number, at: number, dur: number, gain: number, type: OscillatorType) {
  const ac = context()
  if (!ac) return
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  amp.gain.setValueAtTime(0.0001, at)
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.02)
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(amp)
  amp.connect(ac.destination)
  osc.start(at)
  osc.stop(at + dur + 0.02)
}

function shotKey(caliber: number, sniper: boolean, arty: boolean): string {
  if (arty || caliber >= 140) return "boom"
  if (caliber <= 45) return "pompom"
  if (caliber <= 90) return sniper ? "midsnipe" : "mid"
  return sniper ? "bigsnipe" : "big"
}

function hitKey(verb: string): string | null {
  if (verb === "пробил") return "pen"
  if (verb === "рикошет") return "ricochet"
  if (verb === "не пробил") return "nopen"
  if (verb === "осколки") return "splash"
  return null
}

export function playBegin() {
  startMusic()
  playPool("begin", 0.78)
}

export function playShot(caliber: number, sniper = false, arty = false) {
  playPool(shotKey(caliber, sniper, arty), 0.48)
}

export function playHit(verb: string, killed: boolean) {
  const key = hitKey(verb)
  if (key) playPool(key, 0.62)
  if (killed) window.setTimeout(() => playPool("kill", 0.72), 90)
}

/** запас, если файла нет */
export function playCue(name: "vs" | "shot") {
  if (name === "vs") {
    playBegin()
    const ac = context()
    if (!ac) return
    const t = ac.currentTime
    tone(146, t, 0.45, 0.08, "sawtooth")
    return
  }
  playShot(75, false, false)
}
