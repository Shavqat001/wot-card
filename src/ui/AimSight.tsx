import { useEffect, useRef, useState } from "react"
import { TankArt } from "./TankArt"

export type AimPoint = { x: number; y: number; zone: "turret" | "hull" | "lower" }

/** Случайное блуждание прицела по силуэту спереди. */
export function AimSight({
  vehicleId,
  name,
  ratio,
  firing,
  onPoint,
}: {
  vehicleId: string
  name: string
  ratio: number
  firing: boolean
  onPoint: (point: AimPoint) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 50, y: 42 })
  const aim = useRef({ x: 50, y: 42, tx: 58, ty: 38, t: 0 })
  const pointRef = useRef(onPoint)
  pointRef.current = onPoint

  useEffect(() => {
    let alive = true
    let frame = 0
    const tick = (now: number) => {
      if (!alive) return
      const a = aim.current
      if (now > a.t) {
        a.t = now + 280 + Math.random() * 520
        /* корпус / башня / низ — разные зоны силуэта */
        const roll = Math.random()
        if (roll < 0.38) {
          a.tx = 32 + Math.random() * 36
          a.ty = 18 + Math.random() * 22
        } else if (roll < 0.78) {
          a.tx = 22 + Math.random() * 56
          a.ty = 42 + Math.random() * 28
        } else {
          a.tx = 28 + Math.random() * 44
          a.ty = 72 + Math.random() * 16
        }
      }
      const ease = 0.08
      a.x += (a.tx - a.x) * ease
      a.y += (a.ty - a.y) * ease
      const next = { x: a.x, y: a.y }
      setPos(next)
      const zone: AimPoint["zone"] = next.y < 40 ? "turret" : next.y > 70 ? "lower" : "hull"
      pointRef.current({ x: next.x, y: next.y, zone })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(frame)
    }
  }, [vehicleId])

  return (
    <div className={firing ? "aimsight fire" : "aimsight"} ref={box}>
      <p className="aimsight-name">{name}</p>
      <div className="aimsight-stage">
        <div className="aimsight-tank">
          <TankArt id={vehicleId} size="lg" />
          <i className={ratio < 0.35 ? "bar low" : "bar"}><i style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }} /></i>
        </div>
        <span
          className="reticle"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          aria-hidden
        />
        {firing && (
          <span
            className="aim-flash"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            aria-hidden
          />
        )}
      </div>
      <p className="aimsight-hint">прицел ищет слабое место</p>
    </div>
  )
}
