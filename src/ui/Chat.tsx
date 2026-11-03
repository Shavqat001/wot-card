import { useEffect, useRef, useState, type FormEvent } from "react"
import type { ChatLine } from "../lib/wire"

export function ChatIcon() {
  return (
    <svg className="chat-ico" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5.2L8 21.5V17H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 4v2h12V8H6zm0 4v2h8v-2H6z"
      />
    </svg>
  )
}

export function Chat({
  nick,
  open,
  onOpenChange,
  showToggle,
  lift,
  top,
  bind,
  onSend,
  onUnread,
}: {
  nick: string
  open: boolean
  onOpenChange: (open: boolean) => void
  showToggle: boolean
  lift: boolean
  top: boolean
  bind: { current: (line: ChatLine) => void }
  onSend: (id: string, text: string) => void
  onUnread: (n: number) => void
}) {
  const [lines, setLines] = useState<ChatLine[]>([])
  const [text, setText] = useState("")
  const [unread, setUnread] = useState(0)
  const openRef = useRef(open)
  const logRef = useRef<HTMLDivElement>(null)
  openRef.current = open

  bind.current = (line) => {
    setLines((prev) => (prev.some((item) => item.id === line.id) ? prev : [...prev, line].slice(-80)))
    if (!openRef.current && line.nick !== nick) {
      setUnread((n) => {
        const next = n + 1
        onUnread(next)
        return next
      })
    }
  }

  useEffect(() => {
    if (!open) return
    setUnread(0)
    onUnread(0)
    const box = logRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [open, lines, onUnread])

  useEffect(() => {
    if (!open) return
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [open, onOpenChange])

  function submit(e: FormEvent) {
    e.preventDefault()
    const clean = text.replace(/\s+/g, " ").trim().slice(0, 180)
    if (!clean) return
    const id = crypto.randomUUID()
    bind.current({ id, nick, text: clean })
    onSend(id, clean)
    setText("")
  }

  return (
    <div className={["chat", lift ? "lift" : "", top ? "top" : ""].filter(Boolean).join(" ")}>
      {open && (
        <form className="chat-panel" onSubmit={submit}>
          <header>
            <b>радио</b>
            <button type="button" className="quiet" onClick={() => onOpenChange(false)}>закрыть</button>
          </header>
          <div className="chat-log" ref={logRef}>
            {lines.length === 0 && <p>Эфир чист. Напишите первым.</p>}
            {lines.map((line) => (
              <p key={line.id} className={line.nick === nick ? "mine" : ""}>
                <b>{line.nick}</b>
                <span>{line.text}</span>
              </p>
            ))}
          </div>
          <div className="chat-row">
            <input
              value={text}
              maxLength={180}
              placeholder="сообщение"
              aria-label="сообщение"
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" disabled={!text.trim()}>слать</button>
          </div>
        </form>
      )}
      {showToggle && (
        <button
          type="button"
          className={open ? "chat-toggle on" : "chat-toggle"}
          aria-label={unread > 0 ? `чат, ${unread}` : "чат"}
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
        >
          <ChatIcon />
          {unread > 0 && !open && <em className="chat-badge">{unread > 9 ? "9+" : unread}</em>}
        </button>
      )}
    </div>
  )
}
