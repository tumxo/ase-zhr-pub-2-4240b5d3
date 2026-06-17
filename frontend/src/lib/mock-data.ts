// Zentrale Mock-Daten für den Calvin-Prototyp.
// Kein Backend – alle Daten sind hier gemockt und deterministisch.

export interface Standort {
  id: string
  name: string
}

export interface Ausstattung {
  id: string
  label: string
}

export interface Raum {
  id: string
  name: string
  standortId: string
  kapazitaet: number
  etage: string
  raumnummer: string
  ausstattung: string[] // Ausstattung-IDs
}

export interface Buchung {
  id: string
  raumId: string
  datum: string // ISO yyyy-mm-dd
  start: string // "10:00"
  ende: string // "11:00"
  titel: string
  notiz?: string
  status: "gebucht" | "storniert"
}

// Die acht INNOQ-Standorte
export const STANDORTE: Standort[] = [
  { id: "monheim", name: "Monheim" },
  { id: "berlin", name: "Berlin" },
  { id: "hamburg", name: "Hamburg" },
  { id: "koeln", name: "Köln" },
  { id: "muenchen", name: "München" },
  { id: "zuerich", name: "Zürich" },
  { id: "baar", name: "Baar" },
  { id: "offenbach", name: "Offenbach" },
]

export const AUSSTATTUNGEN: Ausstattung[] = [
  { id: "bildschirm", label: "Bildschirm" },
  { id: "whiteboard", label: "Whiteboard" },
  { id: "videokonferenz", label: "Videokonferenz-Equipment" },
  { id: "telefon", label: "Konferenztelefon" },
]

const RAUM_NAMEN = [
  "Beethoven",
  "Bach",
  "Mozart",
  "Brahms",
  "Wagner",
  "Schumann",
  "Haydn",
  "Strauss",
]

const KAPAZITAETEN = [2, 4, 6, 8, 10, 12, 14, 20]

const AUSSTATTUNGS_SETS = [
  ["bildschirm"],
  ["bildschirm", "whiteboard"],
  ["bildschirm", "videokonferenz"],
  ["bildschirm", "whiteboard", "videokonferenz"],
  ["whiteboard"],
  ["bildschirm", "videokonferenz", "telefon"],
  ["bildschirm", "whiteboard", "videokonferenz", "telefon"],
  ["bildschirm", "telefon"],
]

function makeRaeume(standortId: string, count: number): Raum[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${standortId}-r${i + 1}`,
    name: RAUM_NAMEN[i % RAUM_NAMEN.length],
    standortId,
    kapazitaet: KAPAZITAETEN[i % KAPAZITAETEN.length],
    etage: `${(i % 4) + 1}. OG`,
    raumnummer: `${(i % 4) + 1}.${10 + i}`,
    ausstattung: AUSSTATTUNGS_SETS[i % AUSSTATTUNGS_SETS.length],
  }))
}

const RAUM_ANZAHL: Record<string, number> = {
  monheim: 4,
  berlin: 6,
  hamburg: 5,
  koeln: 8,
  muenchen: 7,
  zuerich: 5,
  baar: 3,
  offenbach: 4,
}

export const RAEUME: Raum[] = STANDORTE.flatMap((s) =>
  makeRaeume(s.id, RAUM_ANZAHL[s.id] ?? 4),
)

// Buchbare Zeitfenster (jeweils Startzeit, Dauer 1h)
export const ZEIT_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
]

// Beispiel-Buchungen der Persona "Alex Berger"
export const MEINE_BUCHUNGEN: Buchung[] = [
  {
    id: "b-1001",
    raumId: "koeln-r1",
    datum: "2026-06-22",
    start: "10:00",
    ende: "11:00",
    titel: "Projekt-Workshop Calvin",
    notiz: "Bitte Whiteboard vorbereiten",
    status: "gebucht",
  },
  {
    id: "b-1002",
    raumId: "koeln-r3",
    datum: "2026-06-25",
    start: "14:00",
    ende: "15:00",
    titel: "1:1 mit Teamlead",
    status: "gebucht",
  },
  {
    id: "b-1003",
    raumId: "berlin-r2",
    datum: "2026-06-10",
    start: "09:00",
    ende: "10:30",
    titel: "Retro Sprint 14",
    status: "gebucht",
  },
]

// --- Hilfsfunktionen ---

export function getStandort(id: string): Standort | undefined {
  return STANDORTE.find((s) => s.id === id)
}

export function getRaum(id: string): Raum | undefined {
  return RAEUME.find((r) => r.id === id)
}

export function getRaeumeByStandort(standortId: string): Raum[] {
  return RAEUME.filter((r) => r.standortId === standortId)
}

export function getAusstattung(id: string): Ausstattung | undefined {
  return AUSSTATTUNGEN.find((a) => a.id === id)
}

export function raumAnzahl(standortId: string): number {
  return getRaeumeByStandort(standortId).length
}

// Deterministische Belegung: liefert die belegten Start-Slots für Raum + Datum.
export function getBelegteSlots(raumId: string, datum: string): string[] {
  const key = raumId + datum
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0
  }
  return ZEIT_SLOTS.filter((_, i) => (h + i * 7) % 4 === 0)
}

export function naechsterSlot(slot: string): string {
  const idx = ZEIT_SLOTS.indexOf(slot)
  const stunde = parseInt(slot.slice(0, 2), 10) + 1
  return idx >= 0 ? `${String(stunde).padStart(2, "0")}:00` : slot
}
