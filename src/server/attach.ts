import type { IncomingMessage } from "http"
import type { Duplex } from "stream"
import { WebSocketServer, type WebSocket } from "ws"
import type { Order } from "../lib/types"
import type { ClientMsg, ServerMsg } from "../lib/wire"
import { Hub, type OrderResult, type View } from "./rooms"

interface Sock {
  you: string
  code: string
}

const MODES = ["duel", "platoon", "company"] as const

export function attachNet(httpServer: {
  on(event: "upgrade", cb: (req: IncomingMessage, socket: Duplex, head: Buffer) => void): void
}): void {
  const wss = new WebSocketServer({ noServer: true })
  const hub = new Hub()
  const sockets = new Map<WebSocket, Sock>()
  const byYou = new Map<string, WebSocket>()
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  httpServer.on("upgrade", (req, socket, head) => {
    const url = req.url ?? ""
    if (!url.startsWith("/ws")) return
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req))
  })

  function send(ws: WebSocket, msg: ServerMsg) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg))
  }

  function sendYou(you: string, msg: ServerMsg) {
    const ws = byYou.get(you)
    if (ws) send(ws, msg)
  }

  function disarm(code: string) {
    const timer = timers.get(code)
    if (timer) clearTimeout(timer)
    timers.delete(code)
  }

  function arm(code: string) {
    disarm(code)
    timers.set(code, setTimeout(() => {
      const res = hub.force(code)
      if (res?.kind === "battle") pushViews(code, res.views, res.over)
    }, 21000))
  }

  function pushViews(code: string, views: View[], over: boolean) {
    for (const view of views) sendYou(view.you, { t: "battle", battle: view.battle })
    if (over) disarm(code)
    else arm(code)
  }

  function pushLobby(code: string) {
    for (const you of hub.seatIds(code)) {
      const lobby = hub.lobby(code, you)
      if (lobby) sendYou(you, { t: "lobby", ...lobby })
    }
  }

  function take(ws: WebSocket, res: OrderResult, code: string) {
    if (res.kind === "error") send(ws, { t: "error", text: res.text })
    else if (res.kind === "wait") send(ws, { t: "wait" })
    else pushViews(code, res.views, res.over)
  }

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (raw) => {
      let msg: ClientMsg
      try {
        msg = JSON.parse(String(raw)) as ClientMsg
      } catch {
        return
      }
      if (msg.t === "say") {
        const text = clip(msg.text, 180)
        const nick = clip(msg.nick, 16)
        const id = clip(msg.id, 40)
        if (!text || !nick || !id) return
        const line: ServerMsg = { t: "chat", id, nick, text }
        for (const client of wss.clients) send(client, line)
        return
      }
      const here = sockets.get(ws)
      if (msg.t === "create" || msg.t === "join") {
        if (here) {
          sockets.delete(ws)
          applyLeave(here.code, here.you)
        }
        const gear = Array.isArray(msg.gear) ? msg.gear.filter((id): id is string => typeof id === "string") : []
        const made = msg.t === "create"
          ? MODES.includes(msg.mode) ? hub.create(msg.mode, String(msg.vehicleId ?? ""), gear) : { error: "нельзя" as const }
          : hub.join(String(msg.code ?? ""), String(msg.vehicleId ?? ""), gear)
        if ("error" in made) {
          send(ws, { t: "error", text: made.error })
          return
        }
        sockets.set(ws, { you: made.you, code: made.code })
        byYou.set(made.you, ws)
        pushLobby(made.code)
        return
      }
      if (!here) {
        send(ws, { t: "error", text: "нет комнаты" })
        return
      }
      if (msg.t === "start") take(ws, hub.start(here.code, here.you), here.code)
      else if (msg.t === "order") take(ws, hub.order(here.code, here.you, orderOf(msg.order)), here.code)
      else if (msg.t === "back") {
        const lobby = hub.back(here.code, here.you)
        if (lobby) send(ws, { t: "lobby", ...lobby })
      } else if (msg.t === "leave") drop(ws)
    })

    ws.on("close", () => drop(ws))
  })

  function applyLeave(code: string, you: string) {
    byYou.delete(you)
    const res = hub.leave(code, you)
    if (res.kind === "closed") {
      disarm(code)
      for (const id of res.ids) sendYou(id, { t: "bye" })
    } else if (res.kind === "empty") disarm(code)
    else if (res.kind === "lobby") pushLobby(code)
    else if (res.kind === "battle") pushViews(code, res.views, res.over)
  }

  function drop(ws: WebSocket) {
    const here = sockets.get(ws)
    if (!here) return
    sockets.delete(ws)
    applyLeave(here.code, here.you)
  }
}

function clip(value: unknown, max: number): string {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim().slice(0, max)
}

function orderOf(value: Order | undefined): Order {
  const kind = value?.kind
  const ok = kind === "attack" || kind === "defend" || kind === "help" || kind === "retreat" || kind === "armor"
  return {
    kind: ok ? kind : "defend",
    target: typeof value?.target === "number" ? value.target : null,
    shell: value?.shell === "ap" || value?.shell === "apcr" || value?.shell === "he" ? value.shell : null,
  }
}
