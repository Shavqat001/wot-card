import { useEffect, useRef, useState } from "react"
import { Mqtt } from "../lib/mqtt"
import type { Battle } from "../lib/types"
import type { ClientMsg, Lobby, ServerMsg } from "../lib/wire"
import { Online } from "./online"

export function useNet() {
  const sock = useRef<WebSocket | null>(null)
  const wan = useRef<Online | null>(null)
  const via = useRef<"local" | "online">("local")
  const [up, setUp] = useState(false)
  const [onlineUp, setOnlineUp] = useState(false)
  const handlers = useRef({
    battle: (_battle: Battle) => {},
    lobby: (_lobby: Lobby) => {},
    error: (_text: string) => {},
    bye: () => {},
    chat: (_msg: Extract<ServerMsg, { t: "chat" }>) => {},
  })
  const hall = useRef<Mqtt | null>(null)

  function take(msg: ServerMsg) {
    if (msg.t === "battle") handlers.current.battle(msg.battle)
    else if (msg.t === "lobby") handlers.current.lobby(msg)
    else if (msg.t === "error") handlers.current.error(msg.text)
    else if (msg.t === "bye") handlers.current.bye()
    else if (msg.t === "chat") handlers.current.chat(msg)
  }

  useEffect(() => {
    let ws: WebSocket | null = null
    let stop = false
    let delay = 400
    let timer = 0
    const open = () => {
      const proto = location.protocol === "https:" ? "wss" : "ws"
      ws = new WebSocket(`${proto}//${location.host}/ws`)
      sock.current = ws
      ws.onopen = () => {
        if (via.current === "local") setUp(true)
        delay = 400
      }
      ws.onclose = () => {
        if (via.current === "local") setUp(false)
        if (stop) return
        timer = window.setTimeout(open, delay)
        delay = Math.min(4000, delay * 2)
      }
      ws.onmessage = (ev) => {
        let msg: ServerMsg
        try {
          msg = JSON.parse(String(ev.data)) as ServerMsg
        } catch {
          return
        }
        if (via.current === "local") take(msg)
      }
    }
    open()
    const link = new Mqtt()
    hall.current = link
    link.onUp = () => link.sub("steelhangar/hall")
    link.onNote = (topic, text) => {
      if (!topic.endsWith("/hall")) return
      try {
        const pack = JSON.parse(text) as { body?: ServerMsg }
        if (pack.body?.t === "chat") take(pack.body)
      } catch {
        /* чужой пакет */
      }
    }
    const bytes = crypto.getRandomValues(new Uint8Array(4))
    const hallId = [...bytes].map((n) => n.toString(16).padStart(2, "0")).join("")
    link.connect(`angar-hall-${hallId}`)
    return () => {
      stop = true
      window.clearTimeout(timer)
      ws?.close()
      wan.current?.close()
      link.close()
      hall.current = null
    }
  }, [])

  function goOnline() {
    via.current = "online"
    if (!wan.current) {
      const link = new Online()
      link.onMsg = take
      link.onUp = (ok) => {
        if (via.current === "online") setUp(ok)
        setOnlineUp(ok)
      }
      wan.current = link
    }
    setUp(onlineUp)
  }

  function goLocal() {
    via.current = "local"
    wan.current?.drop()
    setUp(Boolean(sock.current && sock.current.readyState === WebSocket.OPEN))
  }

  function send(msg: ClientMsg) {
    if (msg.t === "say") {
      const ws = sock.current
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
      hall.current?.pub("steelhangar/hall", JSON.stringify({
        from: "hall",
        body: { t: "chat", id: msg.id, nick: msg.nick, text: msg.text },
      }))
      return
    }
    if (via.current === "online") {
      if (!wan.current) goOnline()
      void wan.current?.send(msg)
      return
    }
    const ws = sock.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      handlers.current.error("нет связи")
      return
    }
    ws.send(JSON.stringify(msg))
  }

  return { up, send, handlers, goOnline, goLocal }
}
