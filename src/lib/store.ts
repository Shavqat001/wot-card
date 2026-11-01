import type { Database, SqlJsStatic } from "sql.js"
import { catalogStale, seedCatalog } from "./catalog"
import { emptyDepot, freshSave, loadSave, SAVE_KEY, type Save } from "./garage"
import { cleanNick, nickError, nickKey } from "./nick"
import type { ShellKind } from "./types"
import schema from "./schema"

export const PLAYER = "local"
const IDB_NAME = "angar"
const IDB_STORE = "sqlite"
const SESSION_KEY = "angar.who"

let sql: SqlJsStatic | null = null
let db: Database | null = null
let activeId = PLAYER
let wasmFile = typeof location === "undefined"
  ? `${import.meta.env.BASE_URL}sql-wasm.wasm`
  : new URL("sql-wasm.wasm", location.href).href

export function setWasmFile(path: string) {
  wasmFile = path
}

function asInit(value: unknown): ((opts: { locateFile: (file: string) => string }) => Promise<SqlJsStatic>) | null {
  return typeof value === "function" ? value as (opts: { locateFile: (file: string) => string }) => Promise<SqlJsStatic> : null
}

async function engine(): Promise<SqlJsStatic> {
  if (!sql) {
    const mod = await import("sql.js") as { default?: { default?: unknown } }
    const init = asInit(mod.default) ?? asInit(mod.default?.default) ?? asInit(mod)
    if (!init) throw new Error("sql.js")
    sql = await init({
      locateFile: (file: string) => {
        if (typeof location === "undefined") return wasmFile
        const name = file.endsWith(".wasm") && file.includes("browser") ? "sql-wasm-browser.wasm" : file.endsWith(".wasm") ? "sql-wasm.wasm" : file
        return new URL(name, location.href).href
      },
    })
  }
  return sql
}

const DROP = [
  "meta", "sortie", "room", "seat",
  "shop_gold", "shop_xp", "shop_silver", "shop_shell", "tier_price",
]

function applySchema(base: Database) {
  base.exec(schema)
  if (!catalogStale(base)) return
  for (const name of DROP) base.run(`DROP TABLE IF EXISTS ${name}`)
  seedCatalog(base)
}

function row(base: Database, query: string, params: (string | number)[] = []) {
  const stmt = base.prepare(query)
  stmt.bind(params)
  const found = stmt.step() ? stmt.getAsObject() : null
  stmt.free()
  return found
}

function rows(base: Database, query: string, params: (string | number)[] = []) {
  const stmt = base.prepare(query)
  stmt.bind(params)
  const out: Record<string, unknown>[] = []
  while (stmt.step()) out.push(stmt.getAsObject())
  stmt.free()
  return out
}

export function saveFromDb(base: Database, playerId = activeId): Save | null {
  const player = row(base, "SELECT silver, gold, bonds, free_xp, selected FROM player WHERE id = ?", [playerId])
  if (!player) return null
  const owned = rows(base, "SELECT vehicle_id, xp FROM garage WHERE player_id = ?", [playerId])
  if (!owned.length) return null
  const xp: Record<string, number> = {}
  const ids: string[] = []
  for (const item of owned) {
    const id = String(item.vehicle_id)
    ids.push(id)
    xp[id] = Number(item.xp) || 0
  }
  const gear: Record<string, string[]> = {}
  for (const item of rows(base, "SELECT vehicle_id, slot, gear_id FROM gear_slot WHERE player_id = ?", [playerId])) {
    const id = String(item.vehicle_id)
    const slots = gear[id] ?? ["", "", ""]
    const slot = Number(item.slot)
    if (slot >= 0 && slot <= 2) slots[slot] = String(item.gear_id)
    gear[id] = slots
  }
  const selected = String(player.selected)
  const depot = emptyDepot()
  for (const item of rows(base, "SELECT gear_id, qty FROM depot_gear WHERE player_id = ?", [playerId])) {
    const id = String(item.gear_id)
    const qty = Number(item.qty) || 0
    if (id && qty > 0) depot.gear[id] = qty
  }
  for (const item of rows(base, "SELECT kind, qty FROM depot_shell WHERE player_id = ?", [playerId])) {
    const kind = String(item.kind) as ShellKind
    const qty = Number(item.qty) || 0
    if ((kind === "ap" || kind === "apcr" || kind === "he") && qty > 0) depot.shells[kind] = qty
  }
  return {
    v: 2,
    silver: Number(player.silver) || 0,
    gold: Number(player.gold) || 0,
    bonds: Number(player.bonds) || 0,
    freeXp: Number(player.free_xp) || 0,
    owned: ids,
    xp,
    selected: ids.includes(selected) ? selected : ids[0],
    gear,
    depot,
  }
}

export function writeSave(base: Database, save: Save, playerId = activeId) {
  base.run("BEGIN")
  try {
    base.run(
      "INSERT OR REPLACE INTO player (id, silver, gold, bonds, free_xp, selected) VALUES (?, ?, ?, ?, ?, ?)",
      [playerId, save.silver, save.gold, save.bonds, save.freeXp, save.selected],
    )
    base.run("DELETE FROM garage WHERE player_id = ?", [playerId])
    const tank = base.prepare("INSERT INTO garage (player_id, vehicle_id, xp) VALUES (?, ?, ?)")
    for (const id of save.owned) {
      tank.run([playerId, id, save.xp[id] ?? 0])
    }
    tank.free()
    base.run("DELETE FROM gear_slot WHERE player_id = ?", [playerId])
    const slot = base.prepare("INSERT INTO gear_slot (player_id, vehicle_id, slot, gear_id) VALUES (?, ?, ?, ?)")
    for (const [id, list] of Object.entries(save.gear)) {
      list.forEach((gearId, i) => {
        if (gearId) slot.run([playerId, id, i, gearId])
      })
    }
    slot.free()
    base.run("DELETE FROM depot_gear WHERE player_id = ?", [playerId])
    const stash = base.prepare("INSERT INTO depot_gear (player_id, gear_id, qty) VALUES (?, ?, ?)")
    for (const [id, qty] of Object.entries(save.depot?.gear ?? {})) {
      if (qty > 0) stash.run([playerId, id, qty])
    }
    stash.free()
    base.run("DELETE FROM depot_shell WHERE player_id = ?", [playerId])
    const ammo = base.prepare("INSERT INTO depot_shell (player_id, kind, qty) VALUES (?, ?, ?)")
    for (const [kind, qty] of Object.entries(save.depot?.shells ?? {})) {
      if (qty > 0) ammo.run([playerId, kind, qty])
    }
    ammo.free()
    base.run("COMMIT")
  } catch (err) {
    base.run("ROLLBACK")
    throw err
  }
}

export async function openMemory(bytes?: Uint8Array): Promise<Database> {
  const SQL = await engine()
  const base = bytes?.length ? new SQL.Database(bytes) : new SQL.Database()
  applySchema(base)
  return base
}

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function loadFile(): Promise<Uint8Array | null> {
  if (typeof indexedDB === "undefined") return null
  const conn = await idb()
  try {
    return await new Promise<Uint8Array | null>((resolve, reject) => {
      const req = conn.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get("file")
      req.onsuccess = () => {
        const value = req.result
        resolve(value instanceof Uint8Array ? value : null)
      }
      req.onerror = () => reject(req.error)
    })
  } finally {
    conn.close()
  }
}

async function saveFile(bytes: Uint8Array) {
  if (typeof indexedDB === "undefined") return
  const conn = await idb()
  try {
    await new Promise<void>((resolve, reject) => {
      const req = conn.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).put(bytes, "file")
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } finally {
    conn.close()
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null
let persistWaiters: Array<() => void> = []
let lastSnap = ""
let hideHook = false

function watchHide() {
  if (hideHook || typeof document === "undefined") return
  hideHook = true
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushPersist()
  })
}

function snapOf(save: Save): string {
  return JSON.stringify(save)
}

export function persist(): Promise<void> {
  if (!db || typeof indexedDB === "undefined") return Promise.resolve()
  return new Promise((resolve) => {
    persistWaiters.push(resolve)
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      persistTimer = null
      const done = persistWaiters
      persistWaiters = []
      const base = db
      if (!base) {
        done.forEach((fn) => fn())
        return
      }
      void saveFile(base.export()).then(
        () => done.forEach((fn) => fn()),
        () => done.forEach((fn) => fn()),
      )
    }, 160)
  })
}

export async function flushPersist() {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  const done = persistWaiters
  persistWaiters = []
  if (db && typeof indexedDB !== "undefined") await saveFile(db.export())
  done.forEach((fn) => fn())
}

type Session = { id: string; nick: string }

function sessionGet(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    if (raw.startsWith("{")) {
      const parsed = JSON.parse(raw) as Session
      if (parsed?.id && parsed.nick) return parsed
      return null
    }
    return { id: raw, nick: "" }
  } catch {
    return null
  }
}

function sessionSet(session: Session | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* нет хранилища */
  }
}

function onHost(): boolean {
  return typeof location !== "undefined" && Boolean(location.host)
}

async function postAuth(kind: "register" | "login", body: Record<string, string>): Promise<{ ok: true; id: string; nick: string } | AuthFail> {
  try {
    const res = await fetch(`/api/${kind}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json() as { ok?: unknown; id?: unknown; nick?: unknown; error?: unknown }
    if (data?.ok === true && typeof data.id === "string" && typeof data.nick === "string") {
      return { ok: true, id: data.id, nick: data.nick }
    }
    if (data?.ok === false && typeof data.error === "string") return { ok: false, error: data.error }
    return { ok: false, error: "сбой" }
  } catch {
    return { ok: false, error: "нет связи" }
  }
}

function uid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return [...bytes].map((n) => n.toString(16).padStart(2, "0")).join("")
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((n) => n.toString(16).padStart(2, "0")).join("")
}

async function digest(pass: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pass}`)
  return hex(await crypto.subtle.digest("SHA-256", data))
}

function accountByNick(base: Database, nick: string) {
  const key = nickKey(nick)
  for (const acc of rows(base, "SELECT id, nick, salt, pass FROM account")) {
    if (nickKey(String(acc.nick)) === key) return acc
  }
  return null
}

function accountById(base: Database, id: string) {
  return row(base, "SELECT id, nick FROM account WHERE id = ?", [id])
}

function accountCount(base: Database): number {
  const found = row(base, "SELECT COUNT(*) AS n FROM account")
  return Number(found?.n) || 0
}

function movePlayer(base: Database, from: string, to: string) {
  base.run("UPDATE player SET id = ? WHERE id = ?", [to, from])
  base.run("UPDATE garage SET player_id = ? WHERE player_id = ?", [to, from])
  base.run("UPDATE gear_slot SET player_id = ? WHERE player_id = ?", [to, from])
  base.run("UPDATE depot_gear SET player_id = ? WHERE player_id = ?", [to, from])
  base.run("UPDATE depot_shell SET player_id = ? WHERE player_id = ?", [to, from])
}

function loadOrSeed(base: Database, id: string): { save: Save; rebuilt: boolean } {
  const have = saveFromDb(base, id)
  if (have) return { save: have, rebuilt: false }
  const migrated = loadSave(typeof localStorage === "undefined" ? null : localStorage.getItem(SAVE_KEY))
  writeSave(base, migrated.save, id)
  return { save: migrated.save, rebuilt: migrated.rebuilt }
}

const GIFT_NICK = "alvares"
const GIFT_TANKS = ["t34", "kv1", "sherman"]

export function grantAlvares(save: Save, nick: string): Save {
  if (nickKey(nick) !== GIFT_NICK) return save
  if (save.owned.length <= GIFT_TANKS.length) return save
  const owned = [...GIFT_TANKS]
  const xp: Record<string, number> = {}
  const gear: Record<string, string[]> = {}
  for (const id of owned) {
    xp[id] = save.xp[id] ?? 0
    if (save.gear[id]) gear[id] = save.gear[id]
  }
  return {
    ...save,
    silver: 100000,
    gold: 100,
    bonds: 500,
    owned,
    xp,
    selected: owned.includes(save.selected) ? save.selected : owned[0],
    gear,
  }
}

function enterWithGift(id: string, nick: string): AuthOk {
  const loaded = loadOrSeed(db!, id)
  const save = grantAlvares(loaded.save, nick)
  if (save !== loaded.save) writeSave(db!, save, id)
  lastSnap = snapOf(save)
  void persist()
  return { ok: true, save, nick }
}

export type AuthOk = { ok: true; save: Save; nick: string }
export type AuthFail = { ok: false; error: string }

function enter(id: string, nick: string): AuthOk {
  if (accountCount(db!) === 1 && saveFromDb(db!, PLAYER) && id !== PLAYER) movePlayer(db!, PLAYER, id)
  else if (accountCount(db!) === 0 && saveFromDb(db!, PLAYER)) movePlayer(db!, PLAYER, id)
  activeId = id
  sessionSet({ id, nick })
  return enterWithGift(id, nick)
}

export async function registerAccount(nickRaw: string, pass: string, again: string): Promise<AuthOk | AuthFail> {
  try {
    if (!db) db = await openMemory()
    const nick = cleanNick(nickRaw)
    const bad = nickError(nick)
    if (bad) return { ok: false, error: bad }
    if (pass.length < 4) return { ok: false, error: "короткий пароль" }
    if (pass !== again) return { ok: false, error: "пароли не сошлись" }
    if (onHost()) {
      const remote = await postAuth("register", { nick, pass, again })
      if (!remote.ok) return remote
      return enter(remote.id, remote.nick)
    }
    if (accountByNick(db, nick)) return { ok: false, error: "ник занят" }
    const id = uid()
    const salt = uid() + uid()
    const hashed = await digest(pass, salt)
    db.run("INSERT INTO account (id, nick, salt, pass, created_at) VALUES (?, ?, ?, ?, ?)", [id, nick, salt, hashed, Date.now()])
    return enter(id, nick)
  } catch {
    return { ok: false, error: "сбой" }
  }
}

export async function loginAccount(nickRaw: string, pass: string): Promise<AuthOk | AuthFail> {
  try {
    if (!db) db = await openMemory()
    const nick = cleanNick(nickRaw)
    if (onHost()) {
      const remote = await postAuth("login", { nick, pass })
      if (!remote.ok) return remote
      return enter(remote.id, remote.nick)
    }
    const found = accountByNick(db, nick)
    if (!found) return { ok: false, error: "нет такого" }
    const hashed = await digest(pass, String(found.salt))
    if (hashed !== String(found.pass)) return { ok: false, error: "неверный пароль" }
    return enter(String(found.id), String(found.nick))
  } catch {
    return { ok: false, error: "сбой" }
  }
}

export async function logoutAccount() {
  await flushPersist()
  lastSnap = ""
  activeId = PLAYER
  sessionSet(null)
}

export async function bootStore(): Promise<{ save: Save | null; nick: string | null; rebuilt: boolean }> {
  watchHide()
  const file = await loadFile()
  db = await openMemory(file ?? undefined)
  activeId = PLAYER
  const sid = sessionGet()
  if (sid) {
    const acc = accountById(db, sid.id)
    const nick = acc ? String(acc.nick) : sid.nick
    if (nick) {
      activeId = sid.id
      const loaded = loadOrSeed(db, sid.id)
      const save = grantAlvares(loaded.save, nick)
      if (save !== loaded.save) writeSave(db, save, sid.id)
      lastSnap = snapOf(save)
      await flushPersist()
      return { save, nick, rebuilt: loaded.rebuilt }
    }
    sessionSet(null)
  }
  return { save: null, nick: null, rebuilt: false }
}

export async function putSave(save: Save) {
  if (!db) db = await openMemory()
  const snap = snapOf(save)
  if (snap === lastSnap) return
  lastSnap = snap
  writeSave(db, save)
  await persist()
}

export async function wipeStore(): Promise<Save> {
  const save = freshSave()
  db = await openMemory()
  lastSnap = snapOf(save)
  writeSave(db, save)
  await flushPersist()
  return save
}

export function currentDb(): Database | null {
  return db
}
