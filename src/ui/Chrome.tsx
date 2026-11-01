import { useEffect, useRef, useState } from "react"
import type { Save } from "../lib/garage"
import { byId } from "../lib/vehicles"
import { musicEnabled, setMusic, setSfx, sfxEnabled } from "./sound"

type Pane = "menu" | "profile" | "game"

export function Chrome({
  nick, save, onExit,
}: {
  nick: string
  save: Save
  onExit: () => void
}) {
  const [pane, setPane] = useState<Pane | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const tank = byId(save.selected)

  useEffect(() => {
    if (!pane) return
    function hide(e: PointerEvent) {
      if (box.current?.contains(e.target as Node)) return
      setPane(null)
    }
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") setPane(null)
    }
    document.addEventListener("pointerdown", hide)
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("pointerdown", hide)
      document.removeEventListener("keydown", key)
    }
  }, [pane])

  return (
    <>
      <div className="chrome" ref={box}>
        <span className="who">{nick}</span>
        <button
          type="button"
          className={pane ? "cog on" : "cog"}
          aria-expanded={Boolean(pane)}
          onClick={() => setPane((open) => (open ? null : "menu"))}
        >
          настройки
        </button>
        {pane === "menu" && (
          <nav className="cogmenu" aria-label="настройки">
            <button type="button" onClick={() => setPane("profile")}>профиль</button>
            <button type="button" onClick={() => setPane("game")}>игра</button>
            <button type="button" onClick={onExit}>выход</button>
          </nav>
        )}
        {pane === "profile" && (
          <div className="cogpane">
            <button type="button" className="quiet" onClick={() => setPane("menu")}>назад</button>
            <p><small>ник</small><b>{nick}</b></p>
            <p><small>техники</small><b>{save.owned.length}</b></p>
            <p><small>выбрана</small><b>{tank.name}</b></p>
          </div>
        )}
        {pane === "game" && <GamePane onBack={() => setPane("menu")} />}
      </div>
      <div className="chrome-gap" aria-hidden />
    </>
  )
}

function GamePane({ onBack }: { onBack: () => void }) {
  const [, bump] = useState(0)
  return (
    <div className="cogpane">
      <button type="button" className="quiet" onClick={onBack}>назад</button>
      <div className="cogtoggles">
        <button
          type="button"
          className={musicEnabled() ? "chip on" : "chip"}
          aria-pressed={musicEnabled()}
          onClick={() => { setMusic(!musicEnabled()); bump((n) => n + 1) }}
        >
          музыка
        </button>
        <button
          type="button"
          className={sfxEnabled() ? "chip on" : "chip"}
          aria-pressed={sfxEnabled()}
          onClick={() => { setSfx(!sfxEnabled()); bump((n) => n + 1) }}
        >
          звуки
        </button>
      </div>
    </div>
  )
}
