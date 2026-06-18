// Kleine Datums-Helfer ohne externe Abhängigkeit.
// HEUTE ist im Prototyp fix, damit Verfügbarkeiten/Ansichten deterministisch sind.
export const HEUTE = "2026-06-17"

const WOCHENTAGE = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
]
const WOCHENTAGE_KURZ = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
const MONATE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
]

export function parseDatum(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function addTage(iso: string, n: number): string {
  const d = parseDatum(iso)
  d.setDate(d.getDate() + n)
  return toIso(d)
}

// "Montag, 22. Juni 2026"
export function formatLang(iso: string): string {
  const d = parseDatum(iso)
  return `${WOCHENTAGE[d.getDay()]}, ${d.getDate()}. ${MONATE[d.getMonth()]} ${d.getFullYear()}`
}

// "Mo, 22.06.2026"
export function formatKurz(iso: string): string {
  const d = parseDatum(iso)
  const tag = String(d.getDate()).padStart(2, "0")
  const monat = String(d.getMonth() + 1).padStart(2, "0")
  return `${WOCHENTAGE_KURZ[d.getDay()]}, ${tag}.${monat}.${d.getFullYear()}`
}

export function monatName(monatIndex: number): string {
  return MONATE[monatIndex]
}

export { WOCHENTAGE_KURZ }
