import { Hub, type OrderResult } from "../server/rooms"
import { Mqtt } from "../lib/mqtt"
import type { ClientMsg, ServerMsg } from "../lib/wire"

const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

type Pack = { from: string; to?: string; body: ClientMsg | ServerMsg }

function nid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return [...bytes].map((n) => n.toString(16).padStart(2, "0")).join("")
}

function codeOf(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return [...bytes].map((n) => ABC[n % ABC.length]).join("")
}

export class Online {
  private mqtt = new Mqtt()
  private me = nid()
  private hub: Hub | null = null
  private code = ""
  private you = ""
  private guests = new Map<string, string>()
  private ready = false
  private waiters: Array<() => void> = []
  onMsg: (msg: ServerMsg) => void = () => {}
  onUp: (up: boolean) => void = () => {}

  constructor() {
    this.mqtt.onUp = () => {
      this.ready = true
      this.onUp(true)
      this.waiters.splice(0).forEach((fn) => fn())
    }
    this.mqtt.onDown = () => {
      this.ready = false
      this.onUp(false)
    }
    this.mqtt.onNote = (_topic, text) => this.hear(text)
    this.mqtt.connect(`angar-${this.me}`)
  }

  async send(msg: ClientMsg) {
    await this.whenUp()
    if (msg.t === "create") {
      this.becomeHost(msg)
      return
    }
    if (msg.t === "join") {
      this.code = msg.code.trim().toUpperCase()
      this.mqtt.sub(`steelhangar/${this.code}`)
      this.say({ from: this.me, body: msg })
      window.setTimeout(() => {
        if (!this.you && this.code === msg.code.trim().toUpperCase()) {
          this.say({ from: this.me, body: msg })
        }
      }, 700)
      return
    }
    if (this.hub) this.asHost(msg)
    else this.say({ from: this.me, body: msg })
  }

  drop() {
    if (this.hub && this.code) this.asHost({ t: "leave" })
    else if (this.code) this.say({ from: this.me, body: { t: "leave" } })
    this.hub = null
    this.code = ""
    this.you = ""
    this.guests.clear()
  }

  close() {
    this.drop()
    this.mqtt.close()
  }

  private whenUp(): Promise<void> {
    if (this.ready) return Promise.resolve()
    return new Promise((resolve) => this.waiters.push(resolve))
  }

  private becomeHost(msg: Extract<ClientMsg, { t: "create" }>) {
    const hub = new Hub()
    const code = codeOf()
    const made = hub.create(msg.mode, msg.vehicleId, msg.gear, code)
    if ("error" in made) {
      this.onMsg({ t: "error", text: made.error })
      return
    }
    this.hub = hub
    this.code = made.code
    this.you = made.you
    this.guests.clear()
    this.mqtt.sub(`steelhangar/${this.code}`)
    this.pushLobby()
  }

  private hear(text: string) {
    let pack: Pack
    try {
      pack = JSON.parse(text) as Pack
    } catch {
      return
    }
    if (!pack?.from || !pack.body) return
    if (pack.from === this.me) return
    if (this.hub) {
      if (pack.to) return
      this.asHost(pack.body as ClientMsg, pack.from)
      return
    }
    if (pack.to && pack.to !== this.me) return
    const body = pack.body as ServerMsg
    if (body.t === "lobby") this.you = body.you
    if (body.t === "lobby" || body.t === "battle" || body.t === "error" || body.t === "wait" || body.t === "bye") {
      this.onMsg(body)
    }
  }

  private asHost(msg: ClientMsg, from = "") {
    const hub = this.hub
    if (!hub) return
    if (msg.t === "join") {
      if (from && this.guests.has(from)) {
        this.pushLobby()
        return
      }
      const made = hub.join(this.code, msg.vehicleId, msg.gear)
      if ("error" in made) {
        this.out(from, { t: "error", text: made.error })
        return
      }
      this.guests.set(from, made.you)
      this.pushLobby()
      return
    }
    const you = from ? this.guests.get(from) : this.you
    if (!you) {
      if (from) this.out(from, { t: "error", text: "нет комнаты" })
      return
    }
    if (msg.t === "start") this.take(hub.start(this.code, you), from)
    else if (msg.t === "order") this.take(hub.order(this.code, you, msg.order), from)
    else if (msg.t === "back") {
      const lobby = hub.back(this.code, you)
      if (lobby) this.out(from || this.me, { t: "lobby", ...lobby })
    } else if (msg.t === "leave") {
      hub.leave(this.code, you)
      if (from) {
        this.guests.delete(from)
        this.out(from, { t: "bye" })
        this.pushLobby()
      } else {
        for (const [id] of this.guests) this.out(id, { t: "bye" })
        this.hub = null
        this.guests.clear()
      }
    }
  }

  private take(res: OrderResult, from: string) {
    if (res.kind === "error") {
      if (from) this.out(from, { t: "error", text: res.text })
      else this.onMsg({ t: "error", text: res.text })
      return
    }
    if (res.kind === "wait") {
      if (from) this.out(from, { t: "wait" })
      else this.onMsg({ t: "wait" })
      return
    }
    for (const view of res.views) {
      const mqttId = this.whoMqtt(view.you)
      const body: ServerMsg = { t: "battle", battle: view.battle }
      if (mqttId) this.out(mqttId, body)
      else this.onMsg(body)
    }
  }

  private pushLobby() {
    const hub = this.hub
    if (!hub) return
    const hostLobby = hub.lobby(this.code, this.you)
    if (hostLobby) this.onMsg({ t: "lobby", ...hostLobby })
    for (const [mqttId, you] of this.guests) {
      const lobby = hub.lobby(this.code, you)
      if (lobby) this.out(mqttId, { t: "lobby", ...lobby })
    }
  }

  private whoMqtt(you: string): string | null {
    if (you === this.you) return null
    for (const [id, seat] of this.guests) if (seat === you) return id
    return null
  }

  private out(to: string, body: ServerMsg) {
    this.say({ from: this.me, to, body })
  }

  private say(pack: Pack) {
    if (!this.code) return
    this.mqtt.pub(`steelhangar/${this.code}`, JSON.stringify(pack))
  }
}
