import { memo, useEffect, useState } from "react"
import { artId } from "../lib/art"
import { byId } from "../lib/vehicles"

export const TankArt = memo(function TankArt({ id, size }: { id: string; size?: "lg" | "sm" }) {
  let kind: string | undefined
  try {
    kind = byId(id).type
  } catch {
    /* нет машины */
  }
  const srcId = artId(id, kind)
  const [ok, setOk] = useState(true)
  useEffect(() => {
    setOk(true)
  }, [srcId])
  const eager = size === "lg"
  return (
    <span className={size ? `art ${size}` : "art"}>
      {ok ? (
        <img
          src={`${import.meta.env.BASE_URL}tanks/${srcId}.png`}
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
