import { gearById } from "../lib/gear"
import type { Save } from "../lib/garage"
import { SHELL_LABEL, fmt } from "../lib/text"
import type { ShellKind } from "../lib/types"
import { Purse } from "./Purse"

const KINDS: ShellKind[] = ["ap", "apcr", "he"]

export function DepotScreen({
  save,
  onMount,
  onScrap,
}: {
  save: Save
  onMount: (gearId: string, slot: number) => void
  onScrap: (gearId: string) => void
}) {
  const gear = Object.entries(save.depot.gear).filter(([, n]) => n > 0)
  return (
    <main className="sheet stash">
      <header className="top">
        <h1>Склад</h1>
        <Purse save={save} />
      </header>
      <p className="gearhead">оборудование</p>
      {gear.length === 0 && <p className="empty">пусто</p>}
      <div className="stashgrid">
        {gear.map(([id, n]) => {
          const g = gearById(id)
          if (!g) return null
          return (
            <article key={id} className="stashcard">
              <img src={`${import.meta.env.BASE_URL}gear/${g.id}.png`} alt="" />
              <b>{g.name}</b>
              <small>×{n}</small>
              <div className="stashacts">
                <button type="button" onClick={() => onMount(id, 0)}>слот 1</button>
                <button type="button" onClick={() => onMount(id, 1)}>слот 2</button>
                <button type="button" onClick={() => onMount(id, 2)}>слот 3</button>
                <button type="button" className="danger" onClick={() => onScrap(id)}>уничтожить</button>
              </div>
            </article>
          )
        })}
      </div>
      <p className="gearhead">снаряды</p>
      <div className="stashgrid shells">
        {KINDS.map((kind) => (
          <article key={kind} className="stashcard">
            <b>{SHELL_LABEL[kind]}</b>
            <small>×{fmt(save.depot.shells[kind] ?? 0)}</small>
          </article>
        ))}
      </div>
    </main>
  )
}
