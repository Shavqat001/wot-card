const base = import.meta.env.BASE_URL

const POOLS: Record<string, string[]> = {
  begin: ["cues/battle_begin.MP3"],
  pompom: ["shots/wot_pompom.mp3", "shots/small_shot.mp3", "shots/small_shot2.mp3"],
  mid: ["shots/shot.mp3", "shots/shot2.mp3", "shots/shot3.mp3"],
  midsnipe: ["shots/shot.mp3", "shots/shot2.mp3", "shots/shot3.mp3"],
  big: ["shots/big_shot.mp3", "shots/big_shot2.mp3"],
  bigsnipe: ["shots/big_shot.mp3", "shots/big_shot2.mp3"],
  boom: ["shots/babaha.mp3", "shots/big_shot2.mp3"],
  pen: ["hits/penetration.mp3", "hits/penetration2.mp3"],
  nopen: ["hits/didnt-break-through.mp3", "hits/didnt-break-through2.mp3"],
  ricochet: ["hits/rikoshet.mp3"],
  splash: ["shots/babaha.mp3"],
  kill: ["hits/tank-destroyed.mp3"],
  click: ["clicks/click.wav", "clicks/click2.wav", "clicks/click3.wav", "clicks/click4.wav"],
}

const MUSIC = "music/battle-music1.mp3"
const THEME = "music/Main_Theme.mp3"
const PREF_KEY = "angar.opt"

const cache = new Map<string, HTMLAudioElement>()
let ctx: AudioContext | null = null
let bed: HTMLAudioElement | null = null
let theme: HTMLAudioElement | null = null
let warmed = false
const pref = readPref()

function readPref() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREF_KEY) ?? "null") as { music?: boolean; sfx?: boolean } | null
    return { music: raw?.music !== false, sfx: raw?.sfx !== false }
  } catch {
    return { music: true, sfx: true }
  }
}

function savePref() {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(pref))
  } catch {
    /* нет записи */
  }
}

export function musicEnabled() {
  return pref.music
}

export function sfxEnabled() {
  return pref.sfx
}

export function setMusic(on: boolean) {
  pref.music = on
  savePref()
  if (on) startMusic()
  else {
    stopMusic()
    stopTheme()
  }
}

export function setSfx(on: boolean) {
  pref.sfx = on
  savePref()
}

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
  if (!pref.sfx) return
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
  if (!pref.music || document.visibilityState === "hidden") return
  warm()
  hush(bed)
  const el = themeEl()
  if (el.paused) void el.play().catch(() => {})
}

export function stopTheme() {
  hush(theme)
}

export function startMusic() {
  if (!pref.music || document.visibilityState === "hidden") return
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
  if (!pref.sfx) return
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

export function playShot(caliber: number, sniper = false, arty = false, volume = 0.48) {
  playPool(shotKey(caliber, sniper, arty), volume)
}

let clicksArmed = false

export function playClick() {
  playPool("click", 0.42)
}

/** Случайный клик из public/sounds/clicks на кнопках и прочих нажимаемых элементах. */
export function armClicks() {
  if (clicksArmed || typeof document === "undefined") return
  clicksArmed = true
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return
    const node = e.target instanceof Element ? e.target : null
    const el = node?.closest("button, a, label, select, summary, input, textarea, [role='button']")
    if (!el) return
    if ((el instanceof HTMLButtonElement || el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.disabled) return
    if (el.getAttribute("aria-disabled") === "true") return
    playClick()
  }, true)
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
