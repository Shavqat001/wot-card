/** Нормализация портретов: обрезка пустых полей → одинаковый кадр. */

export type ArtFit = { src: string; zoom: number; ox: string; oy: string }

const cache = new Map<string, ArtFit>()
const pending = new Map<string, Promise<ArtFit>>()

const ALPHA = 10
/** Доля кадра, которую должен занять силуэт. */
const FILL = 0.9

function bounds(data: ImageData): { x: number; y: number; w: number; h: number } | null {
  const { width: W, height: H, data: px } = data
  let minX = W
  let minY = H
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (px[(y * W + x) * 4 + 3] <= ALPHA) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  if (maxX < minX) return null
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

function measure(url: string): Promise<ArtFit> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = "async"
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (!w || !h) {
        resolve({ src: url, zoom: 1, ox: "50%", oy: "50%" })
        return
      }
      /* даунскейл для скана — быстрее на 1920px */
      const maxScan = 480
      const scale = Math.min(1, maxScan / Math.max(w, h))
      const sw = Math.max(1, Math.round(w * scale))
      const sh = Math.max(1, Math.round(h * scale))
      const canvas = document.createElement("canvas")
      canvas.width = sw
      canvas.height = sh
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) {
        resolve({ src: url, zoom: 1, ox: "50%", oy: "50%" })
        return
      }
      ctx.drawImage(img, 0, 0, sw, sh)
      let box: ReturnType<typeof bounds>
      try {
        box = bounds(ctx.getImageData(0, 0, sw, sh))
      } catch {
        resolve({ src: url, zoom: 1, ox: "50%", oy: "50%" })
        return
      }
      if (!box) {
        resolve({ src: url, zoom: 1, ox: "50%", oy: "50%" })
        return
      }
      const zoom = Math.min(4, Math.max(1, Math.min(sw / box.w, sh / box.h) * FILL))
      const ox = `${((box.x + box.w / 2) / sw) * 100}%`
      const oy = `${((box.y + box.h / 2) / sh) * 100}%`
      resolve({ src: url, zoom, ox, oy })
    }
    img.onerror = () => resolve({ src: url, zoom: 1, ox: "50%", oy: "50%" })
    img.src = url
  })
}

/** Подогнать кадр под силуэт (кеш по url). */
export function fitArt(url: string): Promise<ArtFit> {
  const hit = cache.get(url)
  if (hit) return Promise.resolve(hit)
  let job = pending.get(url)
  if (!job) {
    job = measure(url).then((fit) => {
      cache.set(url, fit)
      pending.delete(url)
      return fit
    })
    pending.set(url, job)
  }
  return job
}
