const BROKER = "wss://broker.hivemq.com:8884/mqtt"

function remain(n: number): number[] {
  const out: number[] = []
  do {
    let enc = n % 128
    n = Math.floor(n / 128)
    if (n) enc |= 128
    out.push(enc)
  } while (n)
  return out
}

function pack(type: number, flags: number, payload: Uint8Array): Uint8Array {
  const rh = remain(payload.length)
  const out = new Uint8Array(1 + rh.length + payload.length)
  out[0] = (type << 4) | flags
  out.set(rh, 1)
  out.set(payload, 1 + rh.length)
  return out
}

function u16(n: number): Uint8Array {
  return new Uint8Array([n >> 8, n & 255])
}

function str(s: string): Uint8Array {
  const raw = new TextEncoder().encode(s)
  const out = new Uint8Array(2 + raw.length)
  out.set(u16(raw.length))
  out.set(raw, 2)
  return out
}

function cat(...parts: Uint8Array[]): Uint8Array {
  const n = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(n)
  let i = 0
  for (const p of parts) {
    out.set(p, i)
    i += p.length
  }
  return out
}

function readRemain(buf: Uint8Array, start: number): { len: number; size: number } | null {
  let len = 0
  let mul = 1
  for (let i = 0; i < 4; i++) {
    if (start + i >= buf.length) return null
    const b = buf[start + i]
    len += (b & 127) * mul
    if ((b & 128) === 0) return { len, size: i + 1 }
    mul *= 128
  }
  return null
}

export class Mqtt {
  private ws: WebSocket | null = null
  private ping = 0
  private packet = 1
  onUp = () => {}
  onDown = () => {}
  onNote = (_topic: string, _text: string) => {}

  connect(id: string) {
    this.close()
    const ws = new WebSocket(BROKER)
    ws.binaryType = "arraybuffer"
    this.ws = ws
    ws.onopen = () => {
      const proto = str("MQTT")
      const rest = cat(
        proto,
        new Uint8Array([4, 2, 0, 30]),
        str(id),
      )
      ws.send(pack(1, 0, rest))
    }
    ws.onmessage = (ev) => {
      const buf = new Uint8Array(ev.data as ArrayBuffer)
      this.eat(buf)
    }
    ws.onclose = () => {
      this.clearPing()
      this.onDown()
    }
  }

  sub(topic: string) {
    const id = this.packet++ & 65535
    const payload = cat(u16(id), str(topic), new Uint8Array([0]))
    this.ws?.send(pack(8, 2, payload))
  }

  pub(topic: string, text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    const payload = cat(str(topic), new TextEncoder().encode(text))
    this.ws.send(pack(3, 0, payload))
  }

  close() {
    this.clearPing()
    this.ws?.close()
    this.ws = null
  }

  private clearPing() {
    if (this.ping) window.clearInterval(this.ping)
    this.ping = 0
  }

  private eat(buf: Uint8Array) {
    let i = 0
    while (i < buf.length) {
      const type = buf[i] >> 4
      const rem = readRemain(buf, i + 1)
      if (!rem) return
      const start = i + 1 + rem.size
      const end = start + rem.len
      if (end > buf.length) return
      const body = buf.subarray(start, end)
      if (type === 2) {
        this.clearPing()
        this.ping = window.setInterval(() => this.ws?.send(pack(12, 0, new Uint8Array())), 20000)
        this.onUp()
      } else if (type === 3) {
        const tlen = (body[0] << 8) | body[1]
        const topic = new TextDecoder().decode(body.subarray(2, 2 + tlen))
        const qos = ((buf[i] >> 1) & 3)
        const skip = qos ? 2 : 0
        const text = new TextDecoder().decode(body.subarray(2 + tlen + skip))
        this.onNote(topic, text)
      }
      i = end
    }
  }
}
