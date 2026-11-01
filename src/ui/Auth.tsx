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
      <h1>Стальной ангар</h1>
      <div className="tabs">
        <button
          type="button"
          className={tab === "in" ? "on" : ""}
          onClick={() => { setTab("in"); setErr(null) }}
        >
          вход
        </button>
        <button
          type="button"
          className={tab === "up" ? "on" : ""}
          onClick={() => { setTab("up"); setErr(null) }}
        >
          регистрация
        </button>
      </div>
      <form onSubmit={(e) => void submit(e)}>
        <input
          name="nick"
          autoComplete="username"
          maxLength={16}
          placeholder="ник"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
        />
        <input
          name="pass"
          type="password"
          autoComplete={tab === "up" ? "new-password" : "current-password"}
          placeholder="пароль"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        {tab === "up" && (
          <input
            name="again"
            type="password"
            autoComplete="new-password"
            placeholder="ещё раз"
            value={again}
            onChange={(e) => setAgain(e.target.value)}
          />
        )}
        {err && <p className="note">{err}</p>}
        <button type="submit" className="go" disabled={busy}>
          {tab === "up" ? "создать" : "войти"}
        </button>
      </form>
    </main>
  )
}
