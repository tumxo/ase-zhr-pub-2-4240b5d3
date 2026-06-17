import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { MoreHorizontal, Share2, CalendarX, MapPin, Clock } from "lucide-react"
import { useBuchungen } from "@/lib/buchungen-store"
import { getRaum, getStandort, type Buchung } from "@/lib/mock-data"
import { formatKurz, HEUTE } from "@/lib/datum"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

function teilen(b: Buchung) {
  const raum = getRaum(b.raumId)
  toast.success("Buchung geteilt", {
    description: `Link zu „${b.titel}" (${raum?.name}) in die Zwischenablage kopiert.`,
  })
}

function BuchungsZeile({
  b,
  onStorno,
}: {
  b: Buchung
  onStorno: (b: Buchung) => void
}) {
  const raum = getRaum(b.raumId)
  const standort = raum ? getStandort(raum.standortId) : undefined
  const storniert = b.status === "storniert"

  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{b.titel}</span>
          {storniert && <Badge variant="destructive">Storniert</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatKurz(b.datum)}, {b.start}–{b.ende} Uhr
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {raum?.name} · {standort?.name}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="outline" size="sm" render={<Link to={`/buchungen/${b.id}`} />}>
          Details
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="Aktionen" />}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => teilen(b)}>
              <Share2 className="size-4" /> Teilen
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={storniert}
              onClick={() => onStorno(b)}
            >
              <CalendarX className="size-4" /> Stornieren
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function MeineBuchungenPage() {
  const { buchungen, stornieren } = useBuchungen()
  const [tab, setTab] = useState<"anstehend" | "vergangen">("anstehend")

  const gefiltert = buchungen
    .filter((b) => (tab === "anstehend" ? b.datum >= HEUTE : b.datum < HEUTE))
    .sort((a, b) => (a.datum < b.datum ? -1 : 1))

  function onStorno(b: Buchung) {
    stornieren(b.id)
    toast("Buchung storniert", { description: `„${b.titel}" wurde storniert.` })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Meine Buchungen</h1>
          <p className="text-muted-foreground">Übersicht deiner Raumbuchungen</p>
        </div>
        <Button render={<Link to="/buchen" />}>Neue Buchung</Button>
      </div>

      <div className="inline-flex rounded-lg border p-1 text-sm">
        {(["anstehend", "vergangen"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              "rounded-md px-3 py-1.5 capitalize transition-colors " +
              (tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="divide-y rounded-lg border">
        {gefiltert.map((b) => (
          <BuchungsZeile key={b.id} b={b} onStorno={onStorno} />
        ))}
        {gefiltert.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Keine {tab === "anstehend" ? "anstehenden" : "vergangenen"}{" "}
            Buchungen.
          </div>
        )}
      </div>
    </div>
  )
}
