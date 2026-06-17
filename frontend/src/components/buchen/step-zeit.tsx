import { ChevronLeft, ChevronRight, Check, X } from "lucide-react"
import {
  ZEIT_SLOTS,
  getBelegteSlots,
  getRaum,
  naechsterSlot,
} from "@/lib/mock-data"
import { addTage, formatLang, HEUTE } from "@/lib/datum"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function StepZeit({
  raumId,
  datum,
  slot,
  onDatum,
  onSlot,
}: {
  raumId: string
  datum: string
  slot?: string
  onDatum: (iso: string) => void
  onSlot: (slot: string) => void
}) {
  const raum = getRaum(raumId)
  const belegt = getBelegteSlots(raumId, datum)
  const istVergangen = datum < HEUTE
  const ersterFreier = ZEIT_SLOTS.find((s) => !belegt.includes(s))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Wann brauchst du {raum?.name}?</h2>
        <p className="text-sm text-muted-foreground">
          Wähle Datum und ein freies Zeitfenster (jeweils 1 Stunde).
        </p>
      </div>

      {/* Datumsnavigation */}
      <div className="flex items-center justify-between rounded-lg border p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDatum(addTage(datum, -1))}
          disabled={datum <= HEUTE}
          aria-label="Vorheriger Tag"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="text-center">
          <div className="font-medium">{formatLang(datum)}</div>
          {datum === HEUTE && (
            <div className="text-xs text-muted-foreground">Heute</div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDatum(addTage(datum, 1))}
          aria-label="Nächster Tag"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {istVergangen ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Für vergangene Tage sind keine Buchungen möglich.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ZEIT_SLOTS.map((s) => {
              const istBelegt = belegt.includes(s)
              const gewaehlt = slot === s
              return (
                <button
                  key={s}
                  type="button"
                  disabled={istBelegt}
                  onClick={() => onSlot(s)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                    istBelegt &&
                      "cursor-not-allowed bg-muted/50 text-muted-foreground",
                    !istBelegt && "hover:border-primary",
                    gewaehlt && "border-primary bg-accent ring-1 ring-primary",
                  )}
                >
                  <span>
                    {s} – {naechsterSlot(s)}
                  </span>
                  {istBelegt ? (
                    <span className="flex items-center gap-1 text-xs">
                      <X className="size-3" /> belegt
                    </span>
                  ) : gewaehlt ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <span className="text-xs text-muted-foreground">frei</span>
                  )}
                </button>
              )
            })}
          </div>

          {ersterFreier && (
            <p className="text-xs text-muted-foreground">
              Tipp: nächstes freies Zeitfenster {ersterFreier} –{" "}
              {naechsterSlot(ersterFreier)} Uhr.
            </p>
          )}
        </>
      )}
    </div>
  )
}
