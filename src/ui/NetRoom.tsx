import { useState } from "react"
import { MODE_NAME, MODE_SIZE } from "../lib/modes"
import type { Mode, Vehicle } from "../lib/types"
import type { Lobby } from "../lib/wire"

const MODES: Mode[] = ["duel", "platoon", "company", "battle"]

export function Gate({
  tank,
  onBack,
  onBots,
  onNet,
}: {
  tank: Vehicle
  onBack: () => void
  onBots: () => void
  onNet: () => void
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
        <small>другие входят по коду</small>
      </button>
    </main>
  )
}

export function NetJoin({
  tank,
  up,
  error,
  onBack,
  onCreate,
  onJoin,
}: {
  tank: Vehicle
  up: boolean
  error: string | null
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
      {!up && <p className="note">нет связи</p>}
      {error && <p className="note">{error}</p>}
      {MODES.map((m, i) => (
        <button key={m} type="button" className="hatch" style={{ animationDelay: `${i * 70}ms` }} onClick={() => onCreate(m)}>
          <b>{MODE_NAME[m]}</b>
          <small>{MODE_SIZE[m]} · создать</small>
        </button>
      ))}
    </main>
  )
}

export function RoomLobby({
  lobby,
  error,
  onBack,
  onStart,
}: {
  lobby: Lobby
  error: string | null
  onBack: () => void
  onStart: () => void
}) {
  const mine = lobby.seats.find((s) => s.you)?.side
  return (
    <main className="modes">
      <button type="button" className="back" onClick={onBack}>назад</button>
      <p className="roomcode">{lobby.code}</p>
      <p className="going">{MODE_NAME[lobby.mode]} · {typeof location !== "undefined" ? location.host : ""}</p>
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
