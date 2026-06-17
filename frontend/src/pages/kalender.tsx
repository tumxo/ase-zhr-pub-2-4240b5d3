import { Link } from "react-router-dom"
import { useBuchungen } from "@/lib/buchungen-store"
import { getRaum } from "@/lib/mock-data"
import { parseDatum, monatName, HEUTE } from "@/lib/datum"
import { cn } from "@/lib/utils"

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

export function KalenderPage() {
  const { buchungen } = useBuchungen()
  const heute = parseDatum(HEUTE)
  const jahr = heute.getFullYear()
  const monat = heute.getMonth() // 0-indexiert (Juni = 5)

  const ersterWochentag = (new Date(jahr, monat, 1).getDay() + 6) % 7 // Mo=0
  const tageImMonat = new Date(jahr, monat + 1, 0).getDate()

  // Buchungen pro Tag (nur aktive) dieses Monats
  const proTag = new Map<number, typeof buchungen>()
  for (const b of buchungen) {
    if (b.status === "storniert") continue
    const d = parseDatum(b.datum)
    if (d.getFullYear() === jahr && d.getMonth() === monat) {
      const tag = d.getDate()
      proTag.set(tag, [...(proTag.get(tag) ?? []), b])
    }
  }

  const zellen: (number | null)[] = [
    ...Array(ersterWochentag).fill(null),
    ...Array.from({ length: tageImMonat }, (_, i) => i + 1),
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kalender</h1>
        <p className="text-muted-foreground">
          {monatName(monat)} {jahr} – deine Buchungen im Überblick
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {WOCHENTAGE.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {zellen.map((tag, i) => {
            if (tag === null) return <div key={`e${i}`} />
            const eintraege = proTag.get(tag) ?? []
            const istHeute = tag === heute.getDate()
            return (
              <div
                key={tag}
                className={cn(
                  "min-h-16 rounded-md border p-1.5 text-left",
                  istHeute && "border-primary",
                )}
              >
                <div
                  className={cn(
                    "text-xs",
                    istHeute
                      ? "font-semibold text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {tag}
                </div>
                <div className="mt-1 space-y-0.5">
                  {eintraege.map((b) => (
                    <Link
                      key={b.id}
                      to={`/buchungen/${b.id}`}
                      title={`${b.titel} (${getRaum(b.raumId)?.name})`}
                      className="block truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary hover:bg-primary/20"
                    >
                      {b.start} {getRaum(b.raumId)?.name}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
