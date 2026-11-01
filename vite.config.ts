import { defineConfig, type ViteDevServer } from "vite"
import react from "@vitejs/plugin-react"
import type { IncomingMessage, ServerResponse } from "node:http"

type Next = () => void
type Handler = (req: IncomingMessage, res: ServerResponse, next: Next) => void

export default defineConfig({
  plugins: [
    react(),
    {
      name: "hangar-net",
      configureServer(server: ViteDevServer) {
        let auth: Handler | null = null
        const boot = server.ssrLoadModule("/src/server/authHttp.ts").then((mod) => {
          const attachAuth = mod.attachAuth as (use: (fn: Handler) => void) => void
          attachAuth((fn) => {
            auth = fn
          })
        })
        boot.catch((err) => {
          console.error(err)
        })
        server.middlewares.use((req, res, next) => {
          const url = (req.url ?? "").split("?")[0]
          if (req.method !== "POST" || (url !== "/api/register" && url !== "/api/login")) {
            next()
            return
          }
          void boot.then(() => {
            if (auth) auth(req, res, next)
            else next()
          })
        })
        return () => {
          void server.ssrLoadModule("/src/server/attach.ts").then((mod) => {
            const attachNet = mod.attachNet as (http: NonNullable<ViteDevServer["httpServer"]>) => void
            const http = server.httpServer as (ViteDevServer["httpServer"] & { __hangar?: boolean }) | null
            if (!http || http.__hangar) return
            http.__hangar = true
            attachNet(http)
          }).catch((err) => {
            console.error(err)
          })
        }
      },
    },
  ],
  base: "./",
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  optimizeDeps: { include: ["sql.js"] },
  assetsInclude: ["**/*.wasm"],
})
