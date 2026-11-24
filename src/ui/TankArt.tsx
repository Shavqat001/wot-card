import { memo, useEffect, useState } from "react"
import { artId } from "../lib/art"
import { fitArt, type ArtFit } from "../lib/artFit"
import { byId } from "../lib/vehicles"

export const TankArt = memo(function TankArt({ id, size }: { id: string; size?: "lg" | "sm" }) {
  let kind: string | undefined
  try {
    kind = byId(id).type
  } catch {
    /* нет машины */
  }
  const srcId = artId(id, kind)
  const url = `${import.meta.env.BASE_URL}tanks/${srcId}.png`
  const [ok, setOk] = useState(true)
  const [fit, setFit] = useState<ArtFit | null>(null)
  const uniform = size === "sm"

  useEffect(() => {
    setOk(true)
    setFit(null)
    if (!uniform) return
    let live = true
    void fitArt(url).then((next) => {
      if (live) setFit(next)
    })
    return () => {
      live = false
    }
  }, [url, uniform])

  const eager = size === "lg"
  const style = uniform && fit
    ? {
        ["--art-zoom" as string]: String(fit.zoom),
        ["--art-ox" as string]: fit.ox,
        ["--art-oy" as string]: fit.oy,
      }
    : undefined

  return (
    <span className={size ? `art ${size}` : "art"} style={style} data-fit={uniform ? "1" : undefined}>
      {ok ? (
        <img
          src={url}
          alt=""
          draggable={false}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setOk(false)}
        />
      ) : (
        <span className="ghost-tank" />
      )}
    </span>
  )
})
