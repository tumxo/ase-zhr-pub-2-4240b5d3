import { useState } from "react"
import { Monitor, Users, MapPin, Check } from "lucide-react"
import {
  getRaeumeByStandort,
  getStandort,
  getAusstattung,
  getBelegteSlots,
  ZEIT_SLOTS,
  AUSSTATTUNGEN,
  type Raum,
} from "@/lib/mock-data"
import { HEUTE } from "@/lib/datum"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const KAP_OPTIONS = [
  { label: "Beliebig", v: 0 },
  { label: "2+", v: 2 },
  { label: "6+", v: 6 },
  { label: "10+", v: 10 },
]

function ausstattungLabels(ids: string[]): string {
  return ids.map((id) => getAusstattung(id)?.label ?? id).join(", ")
}

export function StepRaum({
  standortId,
  value,
  onSelect,
}: {
  standortId: string
  value?: string
  onSelect: (id: string) => void
}) {
  const [minKap, setMinKap] = useState(0)
  const [aus, setAus] = useState<string[]>([])
  const [detail, setDetail] = useState<Raum | null>(null)

  const standort = getStandort(standortId)
  const raeume = getRaeumeByStandort(standortId).filter(
    (r) =>
      r.kapazitaet >= minKap && aus.every((a) => r.ausstattung.includes(a)),
  )

  function toggleAus(id: string, on: boolean) {
    setAus((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)))
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Räume in {standort?.name}</h2>
        <p className="text-sm text-muted-foreground">
          {raeume.length} von {getRaeumeByStandort(standortId).length} Räumen
          entsprechen deinen Filtern.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        {/* Raumliste */}
        <div className="order-2 grid gap-3 sm:grid-cols-2 md:order-1">
          {raeume.map((r) => {
            const frei = ZEIT_SLOTS.length - getBelegteSlots(r.id, HEUTE).length
            const selected = value === r.id
            return (
              <div
                key={r.id}
                className={cn(
                  "flex flex-col rounded-lg border p-4 transition-colors",
                  selected && "border-primary ring-1 ring-primary",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{r.name}</div>
                  {selected && <Check className="size-4 text-primary" />}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" /> {r.kapazitaet} Pers.
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {r.etage}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.ausstattung.map((a) => (
                    <Badge key={a} variant="secondary" className="text-[10px]">
                      {getAusstattung(a)?.label}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {frei > 0 ? `${frei} freie Slots heute` : "heute ausgebucht"}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetail(r)}
                    >
                      Details
                    </Button>
                    <Button size="sm" onClick={() => onSelect(r.id)}>
                      {selected ? "Gewählt" : "Wählen"}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
          {raeume.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground sm:col-span-2">
              Keine Räume entsprechen den Filtern.
            </div>
          )}
        </div>

        {/* Filter */}
        <aside className="order-1 space-y-4 rounded-lg border p-4 md:order-2 md:self-start">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Kapazität
            </Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {KAP_OPTIONS.map((o) => (
                <Button
                  key={o.v}
                  variant={minKap === o.v ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMinKap(o.v)}
                >
                  {o.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Ausstattung
            </Label>
            <div className="mt-2 space-y-2">
              {AUSSTATTUNGEN.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-2 text-sm"
                  htmlFor={`aus-${a.id}`}
                >
                  <Checkbox
                    id={`aus-${a.id}`}
                    checked={aus.includes(a.id)}
                    onCheckedChange={(c) => toggleAus(a.id, c === true)}
                  />
                  {a.label}
                </label>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Raumdetails-Dialog */}
      <Dialog
        open={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
      >
        <DialogContent>
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.name}</DialogTitle>
                <DialogDescription>
                  {standort?.name} · {detail.etage} · Raum {detail.raumnummer}
                </DialogDescription>
              </DialogHeader>
              <div className="flex aspect-video items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Monitor className="size-10" />
              </div>
              <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                <dt className="text-muted-foreground">Kapazität</dt>
                <dd>{detail.kapazitaet} Personen</dd>
                <dt className="text-muted-foreground">Ausstattung</dt>
                <dd>{ausstattungLabels(detail.ausstattung)}</dd>
                <dt className="text-muted-foreground">Lage</dt>
                <dd>
                  {standort?.name}, {detail.etage}, Raum {detail.raumnummer}
                </dd>
              </dl>
              <DialogFooter>
                <Button
                  onClick={() => {
                    onSelect(detail.id)
                    setDetail(null)
                  }}
                >
                  Diesen Raum wählen
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
