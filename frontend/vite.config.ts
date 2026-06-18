import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

// In der Trainings-Umgebung läuft die App hinter dem Crucible-Proxy unter einem
// Unterpfad (.../proxy/5173/). Wir leiten `base` aus VSCODE_PROXY_URI ab, damit
// Vite alle Asset-/Modul-URLs mit diesem Pfad ausliefert. Lokal (Var nicht
// gesetzt) bleibt base "/". Siehe .claude/rules/betrieb-hinter-proxy.md.
const proxyUri = process.env.VSCODE_PROXY_URI
const proxyBase = proxyUri
  ? new URL(proxyUri.replace("{{port}}", "5173")).pathname
  : "/"

// Der Proxy entfernt den Pfad-Prefix beim Weiterleiten (siehe Regel). Vite mit
// gesetztem `base` würde die so „nackten" Requests (z. B. /src/main.tsx) mit 404
// beantworten. Diese Middleware stellt den Prefix vor Vites Base-Middleware
// wieder her – funktioniert unabhängig davon, ob der Proxy strippt oder nicht.
function proxyBaseRewrite(base: string): Plugin {
  const prefix = base.replace(/\/$/, "")
  return {
    name: "crucible-proxy-base-rewrite",
    configureServer(server) {
      if (!prefix) return
      server.middlewares.use((req, _res, next) => {
        if (req.url && !req.url.startsWith(prefix + "/") && req.url !== prefix) {
          req.url = prefix + req.url
        }
        next()
      })
    },
  }
}

export default defineConfig({
  base: proxyBase,
  plugins: [proxyBaseRewrite(proxyBase), react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    // HMR-Websocket läuft über den HTTPS-Proxy (Port 443, wss).
    hmr: proxyUri ? { clientPort: 443, protocol: "wss" } : true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
