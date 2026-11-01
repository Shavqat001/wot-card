import { useEffect, useRef, useState } from "react"
import type { Battle } from "../lib/types"
import type { ClientMsg, Lobby, ServerMsg } from "../lib/wire"

export function useNet() {
  const sock = useRef<WebSocket | null>(null)
  const [up, setUp] = useState(false)
  const handlers = useRef({
    battle: (_battle: Battle) => {},
    lobby: (_lobby: Lobby) => {},
    error: (_text: string) => {},
    bye: () => {},
  })

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
        setUp(true)
        delay = 400
      }
      ws.onclose = () => {
        setUp(false)
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
        if (msg.t === "battle") handlers.current.battle(msg.battle)
        else if (msg.t === "lobby") handlers.current.lobby(msg)
        else if (msg.t === "error") handlers.current.error(msg.text)
        else if (msg.t === "bye") handlers.current.bye()
      }
    }
    open()
    return () => {
      stop = true
      window.clearTimeout(timer)
      ws?.close()
    }
  }, [])

  function send(msg: ClientMsg) {
    const ws = sock.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      handlers.current.error("нет связи")
      return
    }
    ws.send(JSON.stringify(msg))
  }

  return { up, send, handlers }
}
