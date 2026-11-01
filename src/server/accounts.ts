import { createHash, randomBytes } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import type { Database } from "sql.js"
import { cleanNick, nickError, nickKey } from "../lib/nick"
import { openMemory, setWasmFile } from "../lib/store"

export type AuthOk = { ok: true; id: string; nick: string }
export type AuthFail = { ok: false; error: string }

let file = join(process.cwd(), "data", "host.sqlite")
let db: Database | null = null

export function setAccountsFile(path: string) {
  file = path
  db = null
}

function persist() {
  if (!db) return
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, Buffer.from(db.export()))
}

function digest(pass: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${pass}`).digest("hex")
}

function uid(): string {
  return randomBytes(8).toString("hex")
}

function rows(base: Database) {
  const stmt = base.prepare("SELECT id, nick, salt, pass, created_at FROM account")
  const out: { id: string; nick: string; salt: string; pass: string }[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    out.push({
      id: String(row.id),
      nick: String(row.nick),
      salt: String(row.salt),
      pass: String(row.pass),
    })
  }
  stmt.free()
  return out
}

function byNick(nick: string) {
  if (!db) return null
  const key = nickKey(nick)
  return rows(db).find((row) => nickKey(row.nick) === key) ?? null
}

function migrateJson(base: Database) {
  const jsonFile = join(dirname(file), "accounts.json")
  if (!existsSync(jsonFile)) return
  try {
    const raw = JSON.parse(readFileSync(jsonFile, "utf8")) as unknown
    if (!Array.isArray(raw)) return
    const put = base.prepare("INSERT OR IGNORE INTO account (id, nick, salt, pass, created_at) VALUES (?, ?, ?, ?, ?)")
    for (const item of raw) {
      if (!item || typeof item !== "object") continue
      const row = item as Record<string, unknown>
      if (typeof row.id !== "string" || typeof row.nick !== "string" || typeof row.salt !== "string" || typeof row.pass !== "string") continue
      put.run([row.id, row.nick, row.salt, row.pass, Number(row.created_at) || Date.now()])
    }
    put.free()
    renameSync(jsonFile, `${jsonFile}.bak`)
  } catch {
    /* старый файл не читается */
  }
}

export async function bootAccounts() {
  if (typeof location === "undefined") {
    setWasmFile(createRequire(import.meta.url).resolve("sql.js/dist/sql-wasm.wasm"))
  }
  const bytes = existsSync(file) ? new Uint8Array(readFileSync(file)) : undefined
  db = await openMemory(bytes)
  migrateJson(db)
  persist()
}

export function registerAccount(nickRaw: unknown, pass: unknown, again: unknown): AuthOk | AuthFail {
  if (!db) return { ok: false, error: "сбой" }
  if (typeof nickRaw !== "string" || typeof pass !== "string" || typeof again !== "string") {
    return { ok: false, error: "сбой" }
  }
  const nick = cleanNick(nickRaw)
  const bad = nickError(nick)
  if (bad) return { ok: false, error: bad }
  if (pass.length < 4) return { ok: false, error: "короткий пароль" }
  if (pass !== again) return { ok: false, error: "пароли не сошлись" }
  if (byNick(nick)) return { ok: false, error: "ник занят" }
  const id = uid()
  const salt = uid() + uid()
  db.run("INSERT INTO account (id, nick, salt, pass, created_at) VALUES (?, ?, ?, ?, ?)", [id, nick, salt, digest(pass, salt), Date.now()])
  persist()
  return { ok: true, id, nick }
}

export function loginAccount(nickRaw: unknown, pass: unknown): AuthOk | AuthFail {
  if (!db) return { ok: false, error: "сбой" }
  if (typeof nickRaw !== "string" || typeof pass !== "string") return { ok: false, error: "сбой" }
  const nick = cleanNick(nickRaw)
  const found = byNick(nick)
  if (!found) return { ok: false, error: "нет такого" }
  if (digest(pass, found.salt) !== found.pass) return { ok: false, error: "неверный пароль" }
  return { ok: true, id: found.id, nick: found.nick }
}
