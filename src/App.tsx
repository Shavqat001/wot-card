import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import { settle } from "./lib/battle"
import { fit } from "./lib/gear"
import {
  applyReward, buy, buyGear, buyGold, buyShells, canBuy, goldToSilver, goldToXp,
  hasOpenSuccessor, scrapDepotGear, scrapGear, setGear, spendShells, type Save,
} from "./lib/garage"
import { bootStore, grantAlvares, logoutAccount, putSave } from "./lib/store"
import { MODE_NAME, MODE_SIZE } from "./lib/modes"
import { shellPrice, type Reward } from "./lib/reward"
import { COUNTRY_LABEL, dec, fmt, ROLE_LABEL, roman, SHELL_LABEL, TYPE_LABEL } from "./lib/text"
import type { Battle, BattleStats, Country, FoeNote, Mode, Outcome, Role, VehType, Vehicle } from "./lib/types"
import { byId, fork, gunArcText, successors, VEHICLES } from "./lib/vehicles"
import type { ChatLine, Lobby } from "./lib/wire"
import { Auth } from "./ui/Auth"
import { Chat } from "./ui/Chat"
import { Chrome } from "./ui/Chrome"
import { armClicks, playBegin, startMusic, startTheme, stopMusic } from "./ui/sound"
import { BattleScreen } from "./ui/BattleScreen"
import { DepotScreen } from "./ui/Depot"
import { Dock, type Hub } from "./ui/Dock"
import { FilterPop } from "./ui/FilterPop"
import { GearBar } from "./ui/GearBar"
import { Gate, NetJoin, RoomLobby } from "./ui/NetRoom"
import { Purse } from "./ui/Purse"
import { Research } from "./ui/Research"
import { ShopScreen } from "./ui/Shop"
import { TankArt } from "./ui/TankArt"
import { TankStats } from "./ui/TankStats"
import { useNet } from "./ui/useNet"

const HUBS: Hub[] = ["hangar", "depot", "research", "shop"]

const MODES: Mode[] = ["duel", "platoon", "company"]

function Atmosphere() {
  return (
    <>
      <div className="lamp" />
      <div className="grain" />
      {Array.from({ length: 9 }, (_, i) => (
        <i
          key={i}
          className="mote"
          style={{
            left: `${6 + i * 10}%`,
            animationDelay: `${-i * 1.4}s`,
            animationDuration: `${11 + (i % 4) * 2.2}s`,
          }}
        />
      ))}
    </>
  )
}

function useCount(n: number): number {
  const [v, setV] = useState(0)
  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 720)
      const e = 1 - (1 - k) ** 3
      setV(Math.round(n * e))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [n])
  return v
}

export default function App() {
  const [save, setSave] = useState<Save | null>(null)
  const [nick, setNick] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [hint, setHint] = useState(() => localStorage.getItem("angar.hint") !== "1")
  const [screen, setScreen] = useState<"hangar" | "depot" | "research" | "shop" | "dossier" | "modes" | "bots" | "net" | "lobby" | "battle" | "result">("hangar")
  const [from, setFrom] = useState<"hangar" | "research">("hangar")
  const [dossierId, setDossierId] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("duel")
  const [bout, setBout] = useState(0)
  const [reward, setReward] = useState<Reward | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [personal, setPersonal] = useState<string | null>(null)
  const [report, setReport] = useState<BattleStats | null>(null)
  const [openLines, setOpenLines] = useState(false)
  const [online, setOnline] = useState(false)
  const [wan, setWan] = useState(false)
  const [opening, setOpening] = useState<Battle | null>(null)
  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [netErr, setNetErr] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatUnread, setChatUnread] = useState(0)
  const screenRef = useRef(screen)
  const feed = useRef<((battle: Battle) => void) | null>(null)
  const fail = useRef<((text: string) => void) | null>(null)
  const chatPush = useRef<(line: ChatLine) => void>(() => {})
  const net = useNet()
  const inHub = (HUBS as readonly string[]).includes(screen)
  screenRef.current = screen
  net.handlers.current = {
    battle(next) {
      if (next.played > 0 && screenRef.current === "battle" && feed.current) feed.current(next)
      else {
        setOpening(next)
        setOnline(true)
        setMode(next.mode)
        setBout((n) => n + 1)
        setScreen("battle")
      }
    },
    lobby(next) {
      setLobby(next)
      setNetErr(null)
      if (screenRef.current !== "battle") setScreen("lobby")
    },
    error(text) {
      if (screenRef.current === "battle" && fail.current) fail.current(text)
      else setNetErr(text)
    },
    bye() {
      setLobby(null)
      setNetErr("комната закрыта")
      if (screenRef.current !== "hangar") setScreen("net")
    },
    chat(line) {
      chatPush.current(line)
    },
  }

  useEffect(() => {
    armClicks()
  }, [])

  useEffect(() => {
    const signed = Boolean(nick && save)
    const go = () => {
      if (signed) startMusic()
      else startTheme()
    }
    window.addEventListener("pointerdown", go)
    window.addEventListener("keydown", go)
    document.addEventListener("visibilitychange", go)
    return () => {
      window.removeEventListener("pointerdown", go)
      window.removeEventListener("keydown", go)
      document.removeEventListener("visibilitychange", go)
    }
  }, [nick, save])

  useEffect(() => {
    let live = true
    bootStore().then((boot) => {
      if (!live) return
      setSave(boot.save)
      setNick(boot.nick)
      setReady(true)
      if (boot.rebuilt) setNote("Ангар собран заново.")
    }).catch(() => {
      if (!live) return
      setReady(true)
    })
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    if (!save || !nick) return
    const gifted = grantAlvares(save, nick)
    if (gifted !== save) setSave(gifted)
  }, [save, nick])

  useEffect(() => {
    if (save) void putSave(save)
  }, [save])

  async function signOut() {
    if (save) await putSave(save)
    await logoutAccount()
    setSave(null)
    setNick(null)
    setScreen("hangar")
    setLobby(null)
    setOnline(false)
    stopMusic()
    startTheme()
  }

  function patch(next: (s: Save) => Save) {
    setSave((s) => (s ? next(s) : s))
  }

  function openDossier(id: string, origin: "hangar" | "research" = "hangar") {
    setFrom(origin)
    setDossierId(id)
    setScreen("dossier")
  }

  function finish(b: Battle) {
    if (!save) return
    const spent = spendShells(save, b.stats.shells)
    const gained = settle(b, hasOpenSuccessor(spent.save, spent.save.selected), {
      billed: spent.billed,
      taken: spent.taken,
    })
    if (gained) {
      setReward(gained)
      patch(() => {
        return applyReward(spent.save, spent.save.selected, gained)
      })
    } else {
      setReward(null)
      patch(() => spent.save)
    }
    const u = b.units[b.playerIndex]
    setPersonal(!u.alive ? "подбита" : u.alive && !u.present ? "ушла" : null)
    setReport(b.stats)
    setOutcome(b.outcome)
    setOpenLines(false)
    setScreen("result")
  }

  if (!ready || !save || !nick) {
    return (
      <div className="app">
        <Atmosphere />
        {ready && (
          <Auth
            onOk={(ok) => {
              setSave(ok.save)
              setNick(ok.nick)
              setScreen("hangar")
              startMusic()
            }}
          />
        )}
      </div>
    )
  }

  const selected = byId(save.selected)

  return (
    <div className="app signed">
      <Atmosphere />
      <Chrome nick={nick} save={save} onExit={() => void signOut()} />
      {screen === "hangar" && (
        <Hangar
          save={save}
          selected={selected}
          hint={hint}
          note={note}
          onOpen={openDossier}
          onSelect={(id) => patch((s) => ({ ...s, selected: id }))}
          onSortie={() => setScreen("modes")}
          onHint={() => {
            localStorage.setItem("angar.hint", "1")
            setHint(false)
          }}
          onNote={() => setNote(null)}
          onGear={(index, id) => patch((s) => setGear(s, s.selected, index, id))}
          onBuyGear={(index, id) => patch((s) => {
            const bought = buyGear(s, id)
            return bought ? setGear(bought, s.selected, index, id) : s
          })}
          onScrap={(index) => patch((s) => scrapGear(s, s.selected, index))}
        />
      )}
      {screen === "depot" && (
        <DepotScreen
          save={save}
          onMount={(gearId, slot) => patch((s) => setGear(s, s.selected, slot, gearId))}
          onScrap={(gearId) => patch((s) => scrapDepotGear(s, gearId))}
        />
      )}
      {screen === "shop" && (
        <ShopScreen
          save={save}
          onBuyGear={(id) => patch((s) => buyGear(s, id) ?? s)}
          onBuyShells={(kind, qty) => patch((s) => buyShells(s, kind, qty) ?? s)}
          onBuyGold={(pack) => patch((s) => buyGold(s, pack) ?? s)}
          onGoldSilver={(gold) => patch((s) => goldToSilver(s, gold) ?? s)}
          onGoldXp={(gold) => patch((s) => goldToXp(s, gold) ?? s)}
        />
      )}
      {screen === "dossier" && dossierId && (
        <Dossier
          save={save}
          id={dossierId}
          onBack={() => setScreen(from)}
          onOpen={(id) => openDossier(id, from)}
          onBuy={(id) => {
            const next = buy(save, id)
            if (next) setSave(next)
          }}
          onGear={(index, gearId) => patch((s) => setGear(s, dossierId, index, gearId))}
          onBuyGear={(index, id) => patch((s) => {
            const bought = buyGear(s, id)
            return bought ? setGear(bought, dossierId, index, id) : s
          })}
          onScrap={(index) => patch((s) => scrapGear(s, dossierId, index))}
        />
      )}
      {screen === "research" && (
        <Research save={save} onBack={() => setScreen("hangar")} onOpen={(id) => openDossier(id, "research")} />
      )}
      {screen === "modes" && (
        <Gate
          tank={selected}
          onBack={() => setScreen("hangar")}
          onBots={() => setScreen("bots")}
          onNet={() => {
            setWan(false)
            net.goLocal()
            setNetErr(null)
            setScreen("net")
          }}
          onOnline={() => {
            setWan(true)
            net.goOnline()
            setNetErr(null)
            setScreen("net")
          }}
        />
      )}
      {screen === "bots" && (
        <Modes
          tank={selected}
          onBack={() => setScreen("modes")}
          onPick={(m) => {
            playBegin()
            setOnline(false)
            setOpening(null)
            setMode(m)
            setBout((n) => n + 1)
            setScreen("battle")
          }}
        />
      )}
      {screen === "net" && (
        <NetJoin
          tank={selected}
          up={net.up}
          error={netErr}
          wan={wan}
          onBack={() => {
            net.goLocal()
            setScreen("modes")
          }}
          onCreate={(m) => net.send({ t: "create", mode: m, vehicleId: save.selected, gear: save.gear[save.selected] ?? [] })}
          onJoin={(code) => net.send({ t: "join", code, vehicleId: save.selected, gear: save.gear[save.selected] ?? [] })}
        />
      )}
      {screen === "lobby" && lobby && (
        <RoomLobby
          lobby={lobby}
          error={netErr}
          wan={wan}
          onBack={() => {
            net.send({ t: "leave" })
            setLobby(null)
            setScreen("hangar")
          }}
          onStart={() => net.send({ t: "start" })}
        />
      )}
      {screen === "battle" && (
        <BattleScreen
          key={bout}
          vehicleId={save.selected}
          mode={mode}
          gear={save.gear[save.selected] ?? []}
          online={online}
          opening={opening}
          bind={(push, err) => {
            feed.current = push
            fail.current = err
          }}
          sendOrder={(order) => net.send({ t: "order", order })}
          onFinished={finish}
          onLeave={() => {
            if (online) net.send({ t: "leave" })
            setScreen("hangar")
          }}
        />
      )}
      {screen === "result" && outcome && (
        <Result
          outcome={outcome}
          personal={personal}
          reward={reward}
          report={report}
          open={openLines}
          onToggle={() => setOpenLines((v) => !v)}
          onAgain={() => {
            if (online) net.send({ t: "back" })
            else {
              playBegin()
              setBout((n) => n + 1)
              setScreen("battle")
            }
          }}
          onHangar={() => setScreen("hangar")}
        />
      )}
      {inHub && (
        <Dock
          current={screen as Hub}
          onGo={(id) => { setChatOpen(false); setScreen(id) }}
          chatOpen={chatOpen}
          chatUnread={chatUnread}
          onChat={() => setChatOpen((v) => !v)}
        />
      )}
      <Chat
        nick={nick}
        open={chatOpen}
        onOpenChange={setChatOpen}
        showToggle={!inHub}
        lift={inHub}
        top={screen === "battle"}
        bind={chatPush}
        onSend={(id, text) => net.send({ t: "say", id, nick, text })}
        onUnread={setChatUnread}
      />
    </div>
  )
}

function Hangar({
  save, selected, hint, note,
  onOpen, onSelect, onSortie, onHint, onNote, onGear, onBuyGear, onScrap,
}: {
  save: Save
  selected: Vehicle
  hint: boolean
  note: string | null
  onOpen: (id: string) => void
  onSelect: (id: string) => void
  onSortie: () => void
  onHint: () => void
  onNote: () => void
  onGear: (index: number, id: string | null) => void
  onBuyGear: (index: number, id: string) => void
  onScrap: (index: number) => void
}) {
  const [country, setCountry] = useState<Country | null>(null)
  const [kind, setKind] = useState<VehType | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [tier, setTier] = useState<number | null>(null)
  const [rows, setRows] = useState(() => (localStorage.getItem("angar.rows") === "2" ? 2 : 1))
  const [filters, setFilters] = useState(false)
  const filterBtn = useRef<HTMLButtonElement>(null)
  const filtered = country || kind || role || tier
  const worn = fit(selected, save.gear[selected.id] ?? [])
  const have = useMemo(() => new Set(save.owned), [save.owned])
  const owned = useMemo(() => VEHICLES.filter((v) =>
    have.has(v.id)
    && (!country || v.country === country)
    && (!kind || v.type === kind)
    && (!role || v.role === role)
    && (!tier || v.tier === tier)
  ), [have, country, kind, role, tier])
  return (
    <main className="hangar">
      <header className="top">
        <h1>Ангар</h1>
        <Purse save={save} />
      </header>
      <button type="button" className="tobattle" onClick={onSortie}>В бой!</button>
      {note && <button type="button" className="note" onClick={onNote}>{note}</button>}
      {hint && (
        <button type="button" className="hint" onClick={onHint}>
          Одна машина. Одно действие за раунд.
        </button>
      )}
      <button type="button" className={`hero c-${selected.country}`} onClick={() => onOpen(selected.id)}>
        <TankArt id={selected.id} size="lg" />
        <strong>{selected.name}</strong>
        <em>{TYPE_LABEL[selected.type]} · {ROLE_LABEL[selected.role]}</em>
        <span className="nums">
          <i><b>{worn.hp}</b><small>прочность</small></i>
          <i><b>{selected.shells[0].damage}</b><small>удар</small></i>
          <i><b>{selected.shells[0].pen}</b><small>пробитие</small></i>
          <i><b>{worn.speed}</b><small>км/ч</small></i>
          <i><b>{dec(worn.reload)}</b><small>перезарядка</small></i>
          <i><b>{dec(worn.aim)}</b><small>сведение</small></i>
          <i><b>{dec(worn.dispersion, 2)}</b><small>разброс</small></i>
          <i><b>{gunArcText(selected)}</b><small>УВН</small></i>
        </span>
      </button>
      <button type="button" className="quiet block" onClick={() => onOpen(selected.id)}>подробные характеристики</button>
      {save.owned.includes(selected.id) && (
        <GearBar
          ids={save.gear[selected.id] ?? []}
          stock={save.depot?.gear ?? {}}
          silver={save.silver}
          onChange={onGear}
          onBuy={onBuyGear}
          onScrap={onScrap}
        />
      )}
      <div className="strip-tools">
        <button
          ref={filterBtn}
          type="button"
          className={filtered ? "chip on" : "chip"}
          aria-expanded={filters}
          onClick={() => setFilters((open) => !open)}
        >
          фильтр
        </button>
        <button type="button" className={rows === 1 ? "chip on" : "chip"} onClick={() => { setRows(1); localStorage.setItem("angar.rows", "1") }}>1 ряд</button>
        <button type="button" className={rows === 2 ? "chip on" : "chip"} onClick={() => { setRows(2); localStorage.setItem("angar.rows", "2") }}>2 ряда</button>
      </div>
      <TankStrip owned={owned} selectedId={selected.id} rows={rows} onSelect={onSelect} />
      {owned.length === 0 && <p className="empty">пусто</p>}
      {filters && (
        <FilterPop
          anchor={filterBtn.current}
          shown={owned.length}
          total={save.owned.length}
          country={country}
          kind={kind}
          role={role}
          tier={tier}
          onCountry={setCountry}
          onKind={setKind}
          onRole={setRole}
          onTier={setTier}
          onReset={() => { setCountry(null); setKind(null); setRole(null); setTier(null) }}
          onClose={() => setFilters(false)}
        />
      )}
    </main>
  )
}

function TankStrip({
  owned, selectedId, rows, onSelect,
}: {
  owned: Vehicle[]
  selectedId: string
  rows: number
  onSelect: (id: string) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const pan = useRef<{ id: number; x: number; left: number; moved: boolean } | null>(null)
  const skip = useRef(false)

  function grab(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    const el = box.current
    if (!el) return
    skip.current = false
    pan.current = { id: e.pointerId, x: e.clientX, left: el.scrollLeft, moved: false }
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* нет захвата */
    }
  }

  function drag(e: PointerEvent<HTMLDivElement>) {
    const el = box.current
    const hold = pan.current
    if (!el || !hold || e.pointerId !== hold.id) return
    const dx = e.clientX - hold.x
    if (!hold.moved && dx * dx < 64) return
    hold.moved = true
    el.classList.add("grabbing")
    el.scrollLeft = hold.left - dx
  }

  function drop(e: PointerEvent<HTMLDivElement>) {
    const hold = pan.current
    if (!hold || e.pointerId !== hold.id) return
    const moved = hold.moved
    skip.current = moved
    pan.current = null
    const el = box.current
    el?.classList.remove("grabbing")
    if (moved) return
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest("button[data-id]")
    const id = hit?.getAttribute("data-id")
    if (id) onSelect(id)
  }

  return (
    <div
      ref={box}
      className={rows === 2 ? "strip rows-2" : "strip"}
      onPointerDown={grab}
      onPointerMove={drag}
      onPointerUp={drop}
      onPointerCancel={drop}
    >
      {owned.map((v) => (
        <button
          key={v.id}
          type="button"
          data-id={v.id}
          className={v.id === selectedId ? `on c-${v.country}` : `c-${v.country}`}
          aria-label={v.name}
          onClick={() => {
            if (skip.current) {
              skip.current = false
              return
            }
            onSelect(v.id)
          }}
        >
          <TankArt id={v.id} size="sm" />
          <small>{v.name}</small>
        </button>
      ))}
    </div>
  )
}

function Dossier({
  save, id, onBack, onOpen, onBuy, onGear, onBuyGear, onScrap,
}: {
  save: Save
  id: string
  onBack: () => void
  onOpen: (id: string) => void
  onBuy: (id: string) => void
  onGear: (index: number, gearId: string | null) => void
  onBuyGear: (index: number, id: string) => void
  onScrap: (index: number) => void
}) {
  const v = byId(id)
  const worn = fit(v, save.gear[id] ?? [])
  const owned = save.owned.includes(id)
  const affordable = canBuy(save, id)
  const from = v.pred ? byId(v.pred) : null
  const next = successors(id)
  return (
    <main className="sheet">
      <button type="button" className="back" onClick={onBack}>назад</button>
      <header className={`hero slim c-${v.country}`}>
        <TankArt id={v.id} size="lg" />
        <strong>{v.name}</strong>
        <em>{roman(v.tier)} · {COUNTRY_LABEL[v.country]} · {ROLE_LABEL[v.role]}</em>
      </header>
      {owned && (
        <GearBar
          ids={save.gear[id] ?? []}
          stock={save.depot?.gear ?? {}}
          silver={save.silver}
          onChange={onGear}
          onBuy={onBuyGear}
          onScrap={onScrap}
          readOnly
        />
      )}
      <p className="gunline">{v.gun} · {v.caliber} мм</p>
      <TankStats tank={worn} />
      <div className="shelltable">
        <span />
        <span>урон</span>
        <span>пробитие</span>
        <span>вилка</span>
        <span>серебро</span>
        {v.shells.map((s) => {
          const [lo, hi] = fork(s.pen)
          return (
            <div key={s.kind}>
              <b>{SHELL_LABEL[s.kind]}</b>
              <span>{s.damage}</span>
              <span>{s.pen}</span>
              <span>{lo}–{hi}</span>
              <span>{fmt(shellPrice(s.kind, v.tier))}</span>
            </div>
          )
        })}
      </div>
      {owned && next.length > 0 && (
        <div className="nexts">
          {next.map((n) => {
            const have = save.xp[id] ?? 0
            const pct = Math.max(0, Math.min(100, (have / n.xp) * 100))
            return (
              <button key={n.id} type="button" onClick={() => onOpen(n.id)}>
                <span>{n.name}</span>
                <i><i style={{ width: `${pct}%` }} /></i>
              </button>
            )
          })}
        </div>
      )}
      {!owned && (affordable ? (
        <button type="button" className="lever" onClick={() => onBuy(id)}>Открыть</button>
      ) : (
        <p className="price">
          {fmt(v.xp)} {v.pred ? `с ${from?.name ?? ""}` : "свободных"}
          <br />
          {fmt(v.cost)}
          <small>не хватает</small>
        </p>
      ))}
    </main>
  )
}

function Modes({ tank, onBack, onPick }: { tank: Vehicle; onBack: () => void; onPick: (m: Mode) => void }) {
  return (
    <main className="modes">
      <button type="button" className="back" onClick={onBack}>назад</button>
      <p className="going">{tank.name}</p>
      {MODES.map((m, i) => (
        <button key={m} type="button" className="hatch" style={{ animationDelay: `${i * 70}ms` }} onClick={() => onPick(m)}>
          <b>{MODE_NAME[m]}</b>
          <small>{MODE_SIZE[m]}</small>
        </button>
      ))}
    </main>
  )
}

function foeLine(f: FoeNote): string {
  const bits: string[] = []
  if (f.pens) bits.push(`пробил ×${f.pens}`)
  if (f.ricochets) bits.push(`рикошет ×${f.ricochets}`)
  if (f.noPens) bits.push(`не пробил ×${f.noPens}`)
  if (f.splashes) bits.push(`осколки ×${f.splashes}`)
  if (f.misses) bits.push(`промах ×${f.misses}`)
  return bits.join(" · ")
}

function Result({
  outcome, personal, reward, report, open, onToggle, onAgain, onHangar,
}: {
  outcome: Outcome
  personal: string | null
  reward: Reward | null
  report: BattleStats | null
  open: boolean
  onToggle: () => void
  onAgain: () => void
  onHangar: () => void
}) {
  const xp = useCount(reward?.xp ?? 0)
  const credits = useCount(reward?.credits ?? 0)
  const word = outcome === "win" ? "Победа" : outcome === "loss" ? "Поражение" : "Ничья"
  const foes = report?.foes ?? []
  return (
    <main className={`result ${outcome}`}>
      <h1>{word}</h1>
      {personal && <p className="ghost">{personal}</p>}
      {reward && (
        <div className="tally">
          <b>{fmt(xp)}</b>
          <small>опыт</small>
          <b className={credits < 0 ? "debt" : ""}>{fmt(credits)}</b>
          <small>серебро</small>
        </div>
      )}
      {report && (
        <div className="foes">
          {foes.map((f) => (
            <div key={f.name}>
              <span>
                <b>{f.name}</b>
                <small>{foeLine(f)}</small>
              </span>
              <em className={f.killed ? "dead" : ""}>{f.killed ? "уничтожен" : "жив"}</em>
              <strong>{fmt(f.damage)}<small>урон</small></strong>
            </div>
          ))}
          <div className="blockrow">
            <span>заблокировано</span>
            <strong>{fmt(report.blocked)}</strong>
          </div>
        </div>
      )}
      <button type="button" className="quiet" onClick={onToggle}>{open ? "скрыть" : "разбор"}</button>
      {open && reward && (
        <div className="lines">
          {reward.xpLines.map((line) => (
            <div key={line.label}><span>{line.label}</span><b>{fmt(line.value)}</b></div>
          ))}
          {reward.creditLines.map((line) => (
            <div key={line.label}><span>{line.label}</span><b>{fmt(line.value)}</b></div>
          ))}
        </div>
      )}
      <button type="button" className="lever again" onClick={onAgain}>Ещё раз</button>
      <button type="button" className="quiet block" onClick={onHangar}>в ангар</button>
    </main>
  )
}
