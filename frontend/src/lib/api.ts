// API-Client für den Booking Service.
// Die einzige Stelle im Frontend, die das echte Backend anspricht (neben
// pages/status.tsx). Alle anderen Stammdaten bleiben gemockt (ADR-002).
import type { Buchung } from "@/lib/mock-data"
import { getBenutzer } from "@/lib/benutzer"

// Backend-Basis-URL zur Laufzeit aus window.location ableiten.
// Hinter dem Crucible-Proxy ist die Seite unter .../proxy/5173/... erreichbar;
// das Backend liegt unter demselben Host auf .../proxy/8081/. Lokal Fallback auf
// http://localhost:8081. Bewusst zur Laufzeit (nicht via Vite `define`), weil die
// build-time Substitution im Dev-Server (Vite 8 / Rolldown) nicht greift.
// Siehe auch .claude/rules/betrieb-hinter-proxy.md.
export function backendBaseUrl(): string {
  const { origin, pathname } = window.location
  const match = pathname.match(/^(.*\/proxy\/)5173\//)
  if (match) return origin + match[1] + "8081"
  return "http://localhost:8081"
}

// Passwortlose Basic-Auth (ADR-003): Benutzername aus localStorage, Passwort ignoriert.
function authHeader(): string {
  const benutzer = getBenutzer() ?? "anonym"
  return "Basic " + btoa(`${benutzer}:x`)
}

export interface NeueBuchungRequest {
  raumId: string
  standortId: string
  datum: string
  start: string
  ende: string
  titel: string
  notiz?: string
}

export interface Zeitfenster {
  start: string
  ende: string
}

export interface VerfuegbarkeitErgebnis {
  verfuegbar: boolean
  alternativen: Zeitfenster[]
}

// Backend-DTO (kennt zusätzlich benutzer/standortId) → Frontend-Buchung.
interface BuchungDto {
  id: string
  benutzer: string
  raumId: string
  standortId: string
  datum: string
  start: string
  ende: string
  titel: string
  notiz: string | null
  status: string
}

function toBuchung(d: BuchungDto): Buchung {
  return {
    id: d.id,
    raumId: d.raumId,
    datum: d.datum,
    start: d.start,
    ende: d.ende,
    titel: d.titel,
    notiz: d.notiz ?? undefined,
    status: d.status === "storniert" ? "storniert" : "gebucht",
  }
}

// Fehler mit HTTP-Status und – bei Doppelbuchung (409) – alternativen Zeitfenstern.
export class ApiFehler extends Error {
  status: number
  alternativen?: Zeitfenster[]

  constructor(status: number, message: string, alternativen?: Zeitfenster[]) {
    super(message)
    this.name = "ApiFehler"
    this.status = status
    this.alternativen = alternativen
  }
}

async function request(pfad: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${backendBaseUrl()}/api${pfad}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    let meldung = `HTTP ${res.status}`
    let alternativen: Zeitfenster[] | undefined
    try {
      const body = await res.json()
      if (typeof body?.fehler === "string") meldung = body.fehler
      if (Array.isArray(body?.alternativen)) alternativen = body.alternativen
    } catch {
      // Keine (oder keine JSON-)Antwort – Standardmeldung behalten.
    }
    throw new ApiFehler(res.status, meldung, alternativen)
  }
  return res
}

export async function listBuchungen(): Promise<Buchung[]> {
  const res = await request("/buchungen")
  const dtos = (await res.json()) as BuchungDto[]
  return dtos.map(toBuchung)
}

export async function createBuchung(req: NeueBuchungRequest): Promise<Buchung> {
  const res = await request("/buchungen", {
    method: "POST",
    body: JSON.stringify(req),
  })
  return toBuchung((await res.json()) as BuchungDto)
}

export async function stornierenBuchung(id: string): Promise<void> {
  await request(`/buchungen/${encodeURIComponent(id)}`, { method: "DELETE" })
}

export async function belegung(
  raumId: string,
  datum: string,
): Promise<Zeitfenster[]> {
  const res = await request(
    `/raeume/${encodeURIComponent(raumId)}/belegung?datum=${encodeURIComponent(datum)}`,
  )
  return (await res.json()) as Zeitfenster[]
}

export async function verfuegbarkeit(
  raumId: string,
  datum: string,
  start: string,
  ende: string,
): Promise<VerfuegbarkeitErgebnis> {
  const params = new URLSearchParams({ raumId, datum, start, ende })
  const res = await request(`/verfuegbarkeit?${params.toString()}`)
  return (await res.json()) as VerfuegbarkeitErgebnis
}
