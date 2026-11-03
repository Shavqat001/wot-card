import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { actionError, autoFinish, createBattle, idleStep, shellOf, step } from "../lib/battle"
import { fit } from "../lib/gear"
import { MODE_NAME } from "../lib/modes"
import { gunWord } from "../lib/shot"
import { mulberry32 } from "../lib/rng"
import type { Battle, Mode, Order, ShellKind } from "../lib/types"
import { byId } from "../lib/vehicles"
import { shellPrice } from "../lib/reward"
import { fmt, SHELL_LABEL } from "../lib/text"
import { TankArt } from "./TankArt"
import { playHit, playShot } from "./sound"

const SHELLS: ShellKind[] = ["ap", "apcr", "he"]

function reduceMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function sparkOf(verb: string, killed: boolean): string {
  if (killed) return "spark-kill"
  if (verb === "промах") return "spark-miss"
  if (verb === "рикошет") return "spark-rico"
  if (verb === "осколки") return "spark-splash"
  if (verb === "не пробил") return "spark-block"
  return "spark-pen"
}

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* нет вибро */
  }
}

export function BattleScreen({
  vehicleId,
  mode,
  gear,
  onFinished,
  onLeave,
  online = false,
  opening = null,
  bind,
  sendOrder,
}: {
  vehicleId: string
  mode: Mode
  gear: string[]
  onFinished: (battle: Battle) => void
  onLeave: () => void
  online?: boolean
  opening?: Battle | null
  bind?: (push: (battle: Battle) => void, fail: (text: string) => void) => void
  sendOrder?: (order: Order) => void
}) {
  const boot = useState(() => {
    if (online && opening) return { rng: mulberry32(1), battle: opening, online: true }
    const rng = mulberry32((Date.now() ^ (Math.random() * 1e9)) >>> 0)
    return { rng, battle: createBattle(vehicleId, mode, rng, gear), online: false }
  })[0]
  const rng = useRef(boot.rng)
  const [battle, setBattle] = useState(boot.battle)
  const [hp, setHp] = useState(boot.battle.units.map((u) => u.hp))
  const [phase, setPhase] = useState<"idle" | "windup" | "volley" | "wreck">("idle")
  const [shell, setShell] = useState<ShellKind>("ap")
  const [sel, setSel] = useState<number | null>(null)
  const [clock, setClock] = useState(10)
  const [bonus, setBonus] = useState(false)
  const [intro, setIntro] = useState(true)
  const [hold, setHold] = useState(false)
  const [warn, setWarn] = useState<string | null>(null)
  const [nudge, setNudge] = useState<"enemy" | null>(null)
  const [shake, setShake] = useState(false)
  const [spots, setSpots] = useState<{ x: number; y: number }[] | null>(null)
  const before = useRef(battle.units.map(() => true))
  const busy = useRef(false)
  const extra = useRef(false)
  const live = useRef(battle)
  const timers = useRef<number[]>([])
  const mounted = useRef(true)
  const fieldRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const playRef = useRef<(next: Battle) => void>(() => {})
  const bindRef = useRef(bind)
  bindRef.current = bind

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (mounted.current) setIntro(false)
    }, reduceMotion() ? 40 : 980)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    mounted.current = true
    cardRefs.current[battle.playerIndex]?.scrollIntoView({ inline: "center", block: "nearest" })
    return () => {
      mounted.current = false
      timers.current.forEach((id) => window.clearTimeout(id))
    }
  }, [battle.playerIndex])

  useEffect(() => {
    const meNow = battle.units[battle.playerIndex]
    if (phase !== "idle" || battle.over || hold || !meNow?.alive || !meNow.present) return
    extra.current = false
    setBonus(false)
    setClock(10)
    const id = window.setInterval(() => setClock((s) => s - 1), 1000)
    return () => window.clearInterval(id)
  }, [phase, battle.played, battle.over, battle.playerIndex, battle.units, hold])

  useEffect(() => {
    if (!boot.online) return
    bindRef.current?.(
      (next) => playRef.current(next),
      (text) => {
        setWarn(text)
        setHold(false)
        busy.current = false
      },
    )
    return () => bindRef.current?.(() => {}, () => {})
  }, [boot.online])

  useEffect(() => {
    const meNow = battle.units[battle.playerIndex]
    if (phase !== "idle" || battle.over || clock > 0 || busy.current || hold || !meNow?.alive || !meNow.present) return
    if (!extra.current) {
      extra.current = true
      setBonus(true)
      setClock(10)
      setWarn("ещё время")
      later(1100, () => setWarn(null))
      return
    }
    if (boot.online) {
      setHold(true)
      setWarn("простой")
      later(1100, () => setWarn(null))
      return
    }
    busy.current = true
    setWarn("простой")
    later(900, () => setWarn(null))
    play(idleStep(live.current, rng.current))
  }, [clock, phase, battle.over, hold])

  function later(ms: number, fn: () => void) {
    const id = window.setTimeout(() => {
      if (mounted.current) fn()
    }, ms)
    timers.current.push(id)
  }

  useLayoutEffect(() => {
    if (phase !== "volley" && phase !== "windup") return
    const field = fieldRef.current
    if (!field) return
    const fr = field.getBoundingClientRect()
    setSpots(battle.units.map((_, i) => {
      const el = cardRefs.current[i]
      if (!el) return { x: 0, y: 0 }
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2 - fr.left, y: r.top + r.height * 0.42 - fr.top }
    }))
  }, [phase, battle])

  function play(next: Battle) {
    before.current = live.current.units.map((u) => u.alive && u.present)
    live.current = next
    setBattle(next)
    setHold(false)
    busy.current = true
    setPhase("windup")
    const fast = reduceMotion()
    const wind = fast ? 40 : 480
    const volley = fast ? 50 : next.beats.length ? 860 : 320
    const changed = next.units.some((u, i) => (u.alive && u.present) !== before.current[i])
    const wreck = fast ? 40 : changed ? 620 : 200
    const hurt = next.beats.some((b) => b.target === next.playerIndex && b.verb !== "промах")
    later(wind, () => {
      setPhase("volley")
      next.beats.forEach((b, i) => later(Math.min(i, 8) * 80, () => {
        const me = next.playerIndex
        const mine = b.shooter === me
        const atMe = b.target === me
        if (!mine && !atMe) return
        playShot(b.caliber || 75, b.sniper, b.arty, mine ? 0.48 : 0.32)
        later(160, () => playHit(b.verb, b.killed))
      }))
      setShake(hurt)
      setHp(next.units.map((u) => u.hp))
      if (hurt) buzz(18)
      else if (next.beats.some((b) => b.shooter === next.playerIndex && b.verb === "пробил")) buzz(10)
      later(volley, () => {
        setPhase("wreck")
        setShake(false)
        later(wreck, () => {
          let done = next
          if (!boot.online) {
            const u = done.units[done.playerIndex]
            if (u && (!u.alive || !u.present) && !done.over) {
              done = autoFinish(done, rng.current)
              live.current = done
              setBattle(done)
              setHp(done.units.map((unit) => unit.hp))
            }
          }
          if (done.over) later(fast ? 30 : 380, () => onFinished(done))
          else {
            busy.current = false
            setHold(false)
            setPhase("idle")
          }
        })
      })
    })
  }
  playRef.current = play

  function act(order: Order) {
    if (busy.current || hold || phase !== "idle" || battle.over) return
    const err = actionError(battle, order)
    if (err) {
      setWarn(err)
      if (err === "выбери цель") setNudge("enemy")
      later(700, () => {
        setWarn(null)
        setNudge(null)
      })
      return
    }
    busy.current = true
    setWarn(null)
    setNudge(null)
    if (boot.online) {
      setHold(true)
      sendOrder?.(order)
      return
    }
    play(step(battle, order, rng.current))
  }

  const me = battle.units[battle.playerIndex]
  const mine = byId(me.vid)
  const worn = me.kit.length ? fit(mine, me.kit) : fit(mine, gear)
  const loaded = me.charge >= worn.reload
  const watching = phase === "windup" || phase === "volley"
  const canAct = phase === "idle" && !hold && me.alive && me.present
  const gun = gunWord(me.charge, worn.reload)
  const showShells = loaded && phase === "idle"

  function tapCard(i: number) {
    const u = battle.units[i]
    if (phase !== "idle" || !u.alive || !u.present || u.player) return
    if (u.side === me.side) return
    setSel(i)
    setWarn(null)
  }

  function lane(side: 0 | 1) {
    return battle.units.map((unit, i) => {
      if (unit.side !== side) return null
      const v = byId(unit.vid)
      const wasUp = before.current[i] !== false
      const pose = watching && wasUp ? unit.action : null
      const hits = phase === "volley" ? battle.beats.filter((b) => b.target === i) : []
      const spark = hits.length
        ? sparkOf(hits.find((b) => b.own)?.verb ?? hits[0].verb, hits.some((b) => b.killed))
        : ""
      const fired = phase === "volley" && battle.beats.some((b) => b.shooter === i)
      const dead = !unit.alive && (!watching || !wasUp)
      const away = unit.alive && !unit.present && (!watching || !wasUp)
      const ratio = Math.max(0, Math.min(1, (hp[i] ?? unit.hp) / unit.maxHp))
      return (
        <div key={i} className="slot" data-dist={unit.distance}>
          <button
            type="button"
            ref={(el) => { cardRefs.current[i] = el }}
            className={[
              "bcard",
              unit.side === 0 ? "side-0" : "side-1",
              `c-${v.country}`,
              unit.player ? "me" : "",
              unit.player && loaded && phase === "idle" ? "ready" : "",
              phase === "idle" && sel === i ? "sel" : "",
              pose ? `pose-${pose}` : "",
              spark,
              fired ? "muzzle-on" : "",
              dead ? "wreck" : "",
              away ? "away" : "",
            ].filter(Boolean).join(" ")}
            onClick={() => tapCard(i)}
            aria-label={unit.player ? `${v.name} ${gun}` : v.name}
          >
            <TankArt id={v.id} />
            <b>{v.name}</b>
            {unit.player && <small className="gun">{gun}</small>}
            <i className={ratio < 0.35 ? "bar low" : "bar"}><i style={{ width: `${ratio * 100}%` }} /></i>
            {fired && <em className="muzzle" />}
          </button>
        </div>
      )
    })
  }

  const ownWords = phase === "volley" && spots
    ? battle.beats.filter((b) => b.own)
    : []

  return (
    <section className="battle">
      <header className="hud">
        <button type="button" className="quiet" onClick={onLeave}>назад</button>
        <span>{MODE_NAME[mode]}{phase === "idle" && <small className={bonus ? "clock bonus" : "clock"}>{clock}</small>}</span>
        <strong key={gun} className={loaded ? "gunhud on" : "gunhud"}>{gun}</strong>
      </header>
      <div
        className={["field", phase === "volley" ? "volley" : "", shake ? "shake" : ""].filter(Boolean).join(" ")}
        ref={fieldRef}
      >
        <div className={nudge === "enemy" ? "lane enemy need" : "lane enemy"}>{lane(1)}</div>
        <div className={intro ? "range dim" : "range"} aria-hidden><span className="vs">VS</span></div>
        {intro && <div className="versus"><span>VS</span></div>}
        <div className="lane ally">{lane(0)}</div>
        {phase === "volley" && spots && (
          <svg className="fx" aria-hidden>
            {battle.beats.map((b, i) => {
              const a = spots[b.shooter]
              const c = spots[b.target]
              if (!a || !c) return null
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={c.x}
                  y2={c.y}
                  className={b.own ? "tracer own" : "tracer"}
                  style={{ animationDelay: `${Math.min(i, 12) * 26}ms` }}
                />
              )
            })}
          </svg>
        )}
        {phase === "volley" && spots && battle.beats.filter((b) => b.own && b.verb !== "промах").map((b, i) => {
          const a = spots[b.shooter]
          const c = spots[b.target]
          if (!a || !c) return null
          const style = {
            animationDelay: `${Math.min(i, 8) * 40}ms`,
            offsetPath: `path("M ${a.x} ${a.y} L ${c.x} ${c.y}")`,
          } as CSSProperties
          return <i key={`fly-${i}`} className="shellfly" style={style} />
        })}
        {ownWords.map((b, i) => {
          const at = spots?.[b.target]
          if (!at) return null
          return (
            <span
              key={`w-${i}`}
              className={`floater ${sparkOf(b.verb, b.killed)}`}
              style={{ left: at.x, top: at.y, animationDelay: `${Math.min(i, 8) * 46}ms` }}
            >
              {b.killed ? "уничтожен" : b.verb}
            </span>
          )
        })}
      </div>
      <p className={warn ? "toast on" : "toast"}>{warn}</p>
      <div className={showShells ? "shells on" : "shells"}>
        {SHELLS.map((kind) => {
          const spec = shellOf(worn, kind)
          return (
            <button
              key={kind}
              type="button"
              className={shell === kind ? "shellkey on" : "shellkey"}
              onClick={() => setShell(kind)}
            >
              <b>{SHELL_LABEL[kind]}</b>
              <small>{spec.pen}</small>
              <em>{fmt(shellPrice(kind, worn.tier))}</em>
            </button>
          )
        })}
      </div>
      <div className="acts">
        <button type="button" disabled={!canAct} onClick={() => act({ kind: "attack", target: sel, shell })}>Атака</button>
        <button type="button" disabled={!canAct} onClick={() => act({ kind: "defend", target: null, shell: null })}>Защита</button>
        <button type="button" disabled={!canAct} onClick={() => act({ kind: "retreat", target: null, shell: null })}>ромб 45°</button>
        <button type="button" disabled={!canAct} onClick={() => act({ kind: "armor", target: loaded ? sel : null, shell: loaded ? shell : null })}>Броня</button>
      </div>
    </section>
  )
}
