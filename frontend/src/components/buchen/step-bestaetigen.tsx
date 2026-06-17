import {
  getRaum,
  getStandort,
  getAusstattung,
  naechsterSlot,
} from "@/lib/mock-data"
import { formatLang } from "@/lib/datum"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { BuchungsDraft } from "./typen"

export function StepBestaetigen({
  draft,
  onChange,
}: {
  draft: BuchungsDraft
  onChange: (patch: Partial<BuchungsDraft>) => void
}) {
  const raum = draft.raumId ? getRaum(draft.raumId) : undefined
  const standort = raum ? getStandort(raum.standortId) : undefined

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Buchung prüfen</h2>
        <p className="text-sm text-muted-foreground">
          Kontrolliere die Angaben und gib deinem Meeting einen Titel.
        </p>
      </div>

      <div className="rounded-lg border">
        <dl className="grid grid-cols-[110px_1fr] gap-y-3 p-4 text-sm">
          <dt className="text-muted-foreground">Raum</dt>
          <dd className="font-medium">
            {raum?.name}{" "}
            <span className="font-normal text-muted-foreground">
              ({standort?.name}, {raum?.etage})
            </span>
          </dd>
          <dt className="text-muted-foreground">Wann</dt>
          <dd>
            {formatLang(draft.datum)}
            {draft.slot && (
              <>
                , {draft.slot}–{naechsterSlot(draft.slot)} Uhr
              </>
            )}
          </dd>
          <dt className="text-muted-foreground">Ausstattung</dt>
          <dd className="flex flex-wrap gap-1">
            {raum?.ausstattung.map((a) => (
              <Badge key={a} variant="secondary" className="text-[10px]">
                {getAusstattung(a)?.label}
              </Badge>
            ))}
          </dd>
        </dl>
        <div className="space-y-3 border-t p-4">
          <div className="space-y-1.5">
            <Label htmlFor="titel">
              Meetingtitel <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titel"
              placeholder="z. B. Projekt-Workshop Calvin"
              value={draft.titel}
              onChange={(e) => onChange({ titel: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notiz">Notiz (optional)</Label>
            <Input
              id="notiz"
              placeholder="z. B. Whiteboard vorbereiten"
              value={draft.notiz}
              onChange={(e) => onChange({ notiz: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
