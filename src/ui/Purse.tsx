import { fmt } from "../lib/text"
import type { Save } from "../lib/garage"

const ICONS = {
  silver: "icons/silver.jpg",
  gold: "icons/gold.png",
  bonds: "icons/bon.png",
  xp: "icons/free_xp.png",
} as const

function Coin({ src, value, label }: { src: string; value: number; label: string }) {
  return (
    <span className="coin" title={label}>
      <img src={`${import.meta.env.BASE_URL}${src}`} alt="" />
      <b>{fmt(value)}</b>
    </span>
  )
}

export function Purse({ save }: { save: Save }) {
  return (
    <div className="purse" aria-label="кошелёк">
      <Coin src={ICONS.silver} value={save.silver} label="серебро" />
      <Coin src={ICONS.gold} value={save.gold} label="золото" />
      <Coin src={ICONS.bonds} value={save.bonds} label="боны" />
      <Coin src={ICONS.xp} value={save.freeXp} label="свободный опыт" />
    </div>
  )
}
