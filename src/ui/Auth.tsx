import { useEffect, useState, type FormEvent } from "react"
import { loginAccount, registerAccount, type AuthOk } from "../lib/store"
import { startTheme, stopTheme } from "./sound"

export function Auth({ onOk }: { onOk: (ok: AuthOk) => void }) {
  const [tab, setTab] = useState<"in" | "up">("in")
  const [nick, setNick] = useState("")
  const [pass, setPass] = useState("")
  const [again, setAgain] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    startTheme()
    const go = () => startTheme()
    window.addEventListener("pointerdown", go)
    window.addEventListener("keydown", go)
    return () => {
      window.removeEventListener("pointerdown", go)
      window.removeEventListener("keydown", go)
      stopTheme()
    }
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      const result = tab === "up"
        ? await registerAccount(nick, pass, again)
        : await loginAccount(nick, pass)
      if (!result.ok) setErr(result.error)
      else onOk(result)
    } catch {
      setErr("сбой")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth">
      <img className="auth-tank" src={`${import.meta.env.BASE_URL}tanks/t34.png`} alt="" draggable={false} />
      <section className="auth-card">
        <p className="auth-kicker">экипаж на позиции</p>
        <h1>Стальной<br />ангар</h1>
        <p className="auth-lead">Позывной открывает ворота. Техника уже прогрета.</p>
        <div className="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "in"}
            className={tab === "in" ? "on" : ""}
            onClick={() => { setTab("in"); setErr(null) }}
          >
            вход
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "up"}
            className={tab === "up" ? "on" : ""}
            onClick={() => { setTab("up"); setErr(null) }}
          >
            регистрация
          </button>
        </div>
        <form onSubmit={(e) => void submit(e)}>
          <label>
            <span>позывной</span>
            <input
              name="nick"
              autoComplete="username"
              maxLength={16}
              placeholder="ник"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
            />
          </label>
          <label>
            <span>пароль</span>
            <input
              name="pass"
              type="password"
              autoComplete={tab === "up" ? "new-password" : "current-password"}
              placeholder="не короче 4"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </label>
          {tab === "up" && (
            <label>
              <span>ещё раз</span>
              <input
                name="again"
                type="password"
                autoComplete="new-password"
                placeholder="повторите пароль"
                value={again}
                onChange={(e) => setAgain(e.target.value)}
              />
            </label>
          )}
          {err && <p className="note" role="alert">{err}</p>}
          <button type="submit" className="go" disabled={busy}>
            {busy ? "связь…" : tab === "up" ? "заступить" : "в бой"}
          </button>
        </form>
      </section>
    </main>
  )
}
