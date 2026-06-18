import { useParams, Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Share2, CalendarX, MapPin, Clock, Users } from "lucide-react"
import { useBuchungen } from "@/lib/buchungen-store"
import { getRaum, getStandort, getAusstattung } from "@/lib/mock-data"
import { formatLang } from "@/lib/datum"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function BuchungDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getBuchung, stornieren, geladen } = useBuchungen()
  const buchung = id ? getBuchung(id) : undefined

  if (!geladen) {
    return (
      <div className="mx-auto max-w-2xl p-10 text-center text-sm text-muted-foreground italic">
        Buchung wird geladen…
      </div>
    )
  }

  if (!buchung) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Link
          to="/buchungen"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="size-4" /> Zurück
        </Link>
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Buchung nicht gefunden.
        </div>
      </div>
    )
  }

  const raum = getRaum(buchung.raumId)
  const standort = raum ? getStandort(raum.standortId) : undefined
  const storniert = buchung.status === "storniert"

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/buchungen"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="size-4" /> Zurück zu Meine Buchungen
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{buchung.titel}</h1>
          <p className="text-muted-foreground">Buchung {buchung.id}</p>
        </div>
        {storniert && <Badge variant="destructive">Storniert</Badge>}
      </div>

      <div className="space-y-4 rounded-lg border p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="size-4 text-muted-foreground" />
            {formatLang(buchung.datum)}, {buchung.start}–{buchung.ende} Uhr
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="size-4 text-muted-foreground" />
            {raum?.name} · {standort?.name}, {raum?.etage}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="size-4 text-muted-foreground" />
            {raum?.kapazitaet} Personen
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {raum?.ausstattung.map((a) => (
            <Badge key={a} variant="secondary">
              {getAusstattung(a)?.label}
            </Badge>
          ))}
        </div>
        {buchung.notiz && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Notiz: </span>
            {buchung.notiz}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() =>
            toast.success("Buchung geteilt", {
              description: "Link in die Zwischenablage kopiert.",
            })
          }
        >
          <Share2 className="size-4" /> Teilen
        </Button>
        <Button
          variant="destructive"
          disabled={storniert}
          onClick={async () => {
            try {
              await stornieren(buchung.id)
              toast("Buchung storniert", {
                description: `„${buchung.titel}" wurde storniert.`,
              })
              navigate("/buchungen")
            } catch (e) {
              toast.error("Stornieren fehlgeschlagen", {
                description: e instanceof Error ? e.message : "Unbekannter Fehler",
              })
            }
          }}
        >
          <CalendarX className="size-4" /> Stornieren
        </Button>
      </div>
    </div>
  )
}
