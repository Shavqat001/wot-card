export type Hub = "hangar" | "depot" | "research" | "shop"

const ITEMS: { id: Hub; label: string }[] = [
  { id: "hangar", label: "Ангар" },
  { id: "depot", label: "Склад" },
  { id: "research", label: "Исследование" },
  { id: "shop", label: "Магазин" },
]

export function Dock({ current, onGo }: { current: Hub; onGo: (id: Hub) => void }) {
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
    </nav>
  )
}
