import { useState } from "react"
import { MODE_HINT, MODE_NAME } from "../lib/modes"
import type { Mode, Vehicle } from "../lib/types"
import type { Lobby } from "../lib/wire"

const MODES: Mode[] = ["duel", "platoon", "company"]

export function Gate({
  tank,
  onBack,
  onBots,
  onNet,
  onOnline,
}: {
  tank: Vehicle
  onBack: () => void
  onBots: () => void
  onNet: () => void
  onOnline: () => void
}) {
  return (
    <main className="modes">
      <button type="button" className="back" onClick={onBack}>назад</button>
      <p className="going">{tank.name}</p>
      <button type="button" className="hatch" onClick={onBots}>
        <b>Против ботов</b>
        <small>свои не слушаются</small>
      </button>
      <button type="button" className="hatch" onClick={onNet}>
        <b>По сети</b>
        <small>этот компьютер, код</small>
      </button>
      <button type="button" className="hatch" onClick={onOnline}>
        <b>Онлайн</b>
        <small>интернет, тот же код</small>
      </button>
    </main>
  )
}

export function NetJoin({
  tank,
  up,
  error,
  wan,
  onBack,
  onCreate,
  onJoin,
}: {
  tank: Vehicle
  up: boolean
  error: string | null
  wan?: boolean
  onBack: () => void
  onCreate: (mode: Mode) => void
  onJoin: (code: string) => void
}) {
  const [code, setCode] = useState("")
  return (
    <main className="modes">
      <button type="button" className="back" onClick={onBack}>назад</button>
      <p className="going">{tank.name}</p>
      <form
        className="codebox"
        onSubmit={(e) => {
          e.preventDefault()
          if (code.trim().length >= 4) onJoin(code.trim().toUpperCase())
        }}
      >
        <input
          value={code}
          maxLength={4}
          autoCapitalize="characters"
          placeholder="код"
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4))}
        />
        <button type="submit">войти</button>
      </form>
      <p className="going">{wan ? "интернет" : (typeof location !== "undefined" ? location.host : "")}</p>
      {!up && <p className="note">нет связи</p>}
      {error && <p className="note">{error}</p>}
      {MODES.map((m, i) => (
        <button key={m} type="button" className="hatch" style={{ animationDelay: `${i * 70}ms` }} onClick={() => onCreate(m)}>
          <b>{MODE_NAME[m]}</b>
          <small>{MODE_HINT[m]} · создать</small>
        </button>
      ))}
    </main>
  )
}

export function RoomLobby({
  lobby,
  error,
  wan,
  onBack,
  onStart,
}: {
  lobby: Lobby
  error: string | null
  wan?: boolean
  onBack: () => void
  onStart: () => void
}) {
  const mine = lobby.seats.find((s) => s.you)?.side
  return (
    <main className="modes">
      <button type="button" className="back" onClick={onBack}>назад</button>
      <p className="roomcode">{lobby.code}</p>
      <p className="going">{MODE_NAME[lobby.mode]} · {wan ? "онлайн" : (typeof location !== "undefined" ? location.host : "")}</p>
      <ul className="seats">
        {lobby.seats.map((s, i) => (
          <li key={`${s.name}-${i}`} className={s.you ? "you" : ""}>
            <span>{s.name}</span>
            <small>{s.side === mine ? "свои" : "против"}</small>
          </li>
        ))}
      </ul>
      {error && <p className="note">{error}</p>}
      {lobby.host ? (
        <button type="button" className="lever" onClick={onStart}>В бой</button>
      ) : (
        <p className="going">жди старта</p>
      )}
    </main>
  )
}
