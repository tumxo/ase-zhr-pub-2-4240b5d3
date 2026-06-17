import { useEffect, useState } from "react"

// Backend-Basis-URL zur Laufzeit aus window.location ableiten.
// Hinter dem Crucible-Proxy ist die Seite unter .../proxy/5173/... erreichbar;
// das Backend liegt unter demselben Host auf .../proxy/8081/. Lokal Fallback auf
// http://localhost:8081. Bewusst zur Laufzeit (nicht via Vite `define`), weil die
// build-time Substitution im Dev-Server (Vite 8 / Rolldown) nicht greift.
function backendBaseUrl(): string {
  const { origin, pathname } = window.location
  const match = pathname.match(/^(.*\/proxy\/)5173\//)
  if (match) return origin + match[1] + "8081"
  return "http://localhost:8081"
}

export function StatusPage() {
  const [antwort, setAntwort] = useState<string | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const backendUrl = backendBaseUrl()

  useEffect(() => {
    fetch(`${backendUrl}/api/hello`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then(setAntwort)
      .catch((err) => setFehler(err.message))
  }, [backendUrl])

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Backend-Status</h1>
        <p className="text-muted-foreground">Verbindungstest zum Booking Service</p>
      </div>

      <div className="rounded-lg border p-5 space-y-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Backend-URL: </span>
          <code className="text-xs">{backendUrl}</code>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Antwort: </span>
          {antwort !== null && (
            <span className="font-medium text-green-600">{antwort}</span>
          )}
          {fehler !== null && (
            <span className="font-medium text-destructive">{fehler}</span>
          )}
          {antwort === null && fehler === null && (
            <span className="text-muted-foreground italic">wird geladen…</span>
          )}
        </div>
      </div>
    </div>
  )
}
