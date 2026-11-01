import type { IncomingMessage, ServerResponse } from "node:http"
import { bootAccounts, loginAccount, registerAccount } from "./accounts"

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8")
        resolve(raw ? JSON.parse(raw) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on("error", reject)
  })
}

function send(res: ServerResponse, body: unknown) {
  res.statusCode = 200
  res.setHeader("content-type", "application/json; charset=utf-8")
  res.end(JSON.stringify(body))
}

export function attachAuth(use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void) {
  const ready = bootAccounts()
  use((req, res, next) => {
    const url = (req.url ?? "").split("?")[0]
    if (req.method !== "POST" || (url !== "/api/register" && url !== "/api/login")) {
      next()
      return
    }
    void ready.then(() => readJson(req)).then((body) => {
      const data = body && typeof body === "object" ? body as Record<string, unknown> : {}
      const result = url === "/api/register"
        ? registerAccount(data.nick, data.pass, data.again)
        : loginAccount(data.nick, data.pass)
      send(res, result)
    }).catch(() => send(res, { ok: false, error: "сбой" }))
  })
}
