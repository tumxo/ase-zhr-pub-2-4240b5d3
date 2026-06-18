import { MapPin } from "lucide-react"
import { STANDORTE, raumAnzahl } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function StepStandort({
  value,
  onSelect,
}: {
  value?: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Wo möchtest du buchen?</h2>
        <p className="text-sm text-muted-foreground">
          Wähle einen der acht INNOQ-Standorte.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {STANDORTE.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-accent",
              value === s.id && "border-primary bg-accent ring-1 ring-primary",
            )}
          >
            <MapPin className="mb-2 size-5 text-primary" />
            <div className="font-medium">{s.name}</div>
            <div className="text-xs text-muted-foreground">
              {raumAnzahl(s.id)} Konferenzräume
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
