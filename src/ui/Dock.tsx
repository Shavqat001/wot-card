import { ChatIcon } from "./Chat"

export type Hub = "hangar" | "depot" | "research" | "shop"

const ITEMS: { id: Hub; label: string }[] = [
  { id: "hangar", label: "Ангар" },
  { id: "depot", label: "Склад" },
  { id: "research", label: "Исследование" },
  { id: "shop", label: "Магазин" },
]

export function Dock({
  current,
  onGo,
  chatOpen,
  chatUnread,
  onChat,
}: {
  current: Hub
  onGo: (id: Hub) => void
  chatOpen: boolean
  chatUnread: number
  onChat: () => void
}) {
  return (
    <nav className="dock" aria-label="разделы">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={current === item.id ? "on" : ""}
          aria-current={current === item.id ? "page" : undefined}
          onClick={() => onGo(item.id)}
        >
          {item.label}
        </button>
      ))}
      <button
        type="button"
        className={chatOpen ? "dock-chat on" : "dock-chat"}
        aria-label={chatUnread > 0 ? `чат, ${chatUnread}` : "чат"}
        aria-expanded={chatOpen}
        onClick={onChat}
      >
        <ChatIcon />
        {chatUnread > 0 && !chatOpen && (
          <em className="chat-badge">{chatUnread > 9 ? "9+" : chatUnread}</em>
        )}
      </button>
    </nav>
  )
}
