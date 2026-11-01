import { useState } from "react"
import type { Save } from "../lib/garage"
import { GOLD_PACKS, GOLD_TO_SILVER, GOLD_TO_XP, SHELL_PACKS, SHOP_GEAR, SILVER_OFFERS, XP_OFFERS, shellPackPrice } from "../lib/shop"
import { SHELL_LABEL, fmt } from "../lib/text"
import type { ShellKind } from "../lib/types"
import { Purse } from "./Purse"

type Ask =
  | { kind: "gear"; id: string }
  | { kind: "shells"; ammo: ShellKind; qty: number }
  | { kind: "gold"; pack: number }
  | { kind: "silver"; gold: number }
  | { kind: "xp"; gold: number }

export function ShopScreen({
  save,
  onBuyGear,
  onBuyShells,
  onBuyGold,
  onGoldSilver,
  onGoldXp,
}: {
  save: Save
  onBuyGear: (id: string) => void
  onBuyShells: (kind: (typeof SHELL_PACKS)[number]["kind"], qty: number) => void
  onBuyGold: (pack: number) => void
  onGoldSilver: (gold: number) => void
  onGoldXp: (gold: number) => void
}) {
  const [ask, setAsk] = useState<Ask | null>(null)

  function line(q: Ask): string {
    if (q.kind === "gear") {
      const g = SHOP_GEAR.find((item) => item.id === q.id)!
      return `купить ${g.name} за ${fmt(g.cost)}?`
    }
    if (q.kind === "shells") {
      return `купить ${SHELL_LABEL[q.ammo]} ×${q.qty} за ${fmt(shellPackPrice(q.ammo, q.qty))}?`
    }
    if (q.kind === "gold") {
      const pack = GOLD_PACKS[q.pack]
      return `купить ${fmt(pack.gold)} золота за ${fmt(pack.silver)}?`
    }
    if (q.kind === "silver") {
      return `обменять ${fmt(q.gold)} золота на ${fmt(q.gold * GOLD_TO_SILVER)} серебра?`
    }
    return `обменять ${fmt(q.gold)} золота на ${fmt(q.gold * GOLD_TO_XP)} опыта?`
  }

  function go(q: Ask) {
    if (q.kind === "gear") onBuyGear(q.id)
    else if (q.kind === "shells") onBuyShells(q.ammo, q.qty)
    else if (q.kind === "gold") onBuyGold(q.pack)
    else if (q.kind === "silver") onGoldSilver(q.gold)
    else onGoldXp(q.gold)
    setAsk(null)
  }

  return (
    <main className="sheet shop">
      <header className="top">
        <h1>Магазин</h1>
        <Purse save={save} />
      </header>

      <p className="gearhead">оборудование</p>
      <div className="shopgrid">
        {SHOP_GEAR.map((g) => {
          const poor = save.silver < g.cost
          return (
            <button key={g.id} type="button" className={poor ? "full" : ""} onClick={() => { if (!poor) setAsk({ kind: "gear", id: g.id }) }}>
              <img src={`${import.meta.env.BASE_URL}gear/${g.id}.png`} alt="" />
              <b>{g.name}</b>
              <small>{g.line}</small>
              <span className={poor ? "sum poor" : "sum"}>{fmt(g.cost)}</span>
            </button>
          )
        })}
      </div>

      <p className="gearhead">снаряды</p>
      <div className="shopgrid">
        {SHELL_PACKS.map((pack) => {
          const price = shellPackPrice(pack.kind, pack.qty)
          const poor = save.silver < price
          return (
            <button key={pack.kind} type="button" className={poor ? "full" : ""} onClick={() => { if (!poor) setAsk({ kind: "shells", ammo: pack.kind, qty: pack.qty }) }}>
              <b>{SHELL_LABEL[pack.kind]}</b>
              <small>×{pack.qty}</small>
              <span className={poor ? "sum poor" : "sum"}>{fmt(price)}</span>
            </button>
          )
        })}
      </div>

      <p className="gearhead">золото</p>
      <div className="shopgrid">
        {GOLD_PACKS.map((pack, i) => {
          const poor = save.silver < pack.silver
          return (
            <button key={pack.gold} type="button" className={poor ? "full" : ""} onClick={() => { if (!poor) setAsk({ kind: "gold", pack: i }) }}>
              <b>{fmt(pack.gold)}</b>
              <small>золото</small>
              <span className={poor ? "sum poor" : "sum"}>{fmt(pack.silver)}</span>
            </button>
          )
        })}
      </div>

      <p className="gearhead">обмен</p>
      <div className="shopgrid">
        {SILVER_OFFERS.map((offer) => {
          const poor = save.gold < offer.gold
          return (
            <button key={`s${offer.gold}`} type="button" className={poor ? "full" : ""} onClick={() => { if (!poor) setAsk({ kind: "silver", gold: offer.gold }) }}>
              <b>{fmt(offer.silver)}</b>
              <small>серебро за {fmt(offer.gold)} золота</small>
            </button>
          )
        })}
        {XP_OFFERS.map((offer) => {
          const poor = save.gold < offer.gold
          return (
            <button key={`x${offer.gold}`} type="button" className={poor ? "full" : ""} onClick={() => { if (!poor) setAsk({ kind: "xp", gold: offer.gold }) }}>
              <b>{fmt(offer.xp)}</b>
              <small>опыт за {fmt(offer.gold)} золота</small>
            </button>
          )
        })}
      </div>

      {ask && (
        <div className="modal" onClick={() => setAsk(null)}>
          <div className="modalbox askbox" onClick={(e) => e.stopPropagation()}>
            <p>{line(ask)}</p>
            <div className="confirm">
              <button type="button" onClick={() => go(ask)}>да</button>
              <button type="button" onClick={() => setAsk(null)}>нет</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
