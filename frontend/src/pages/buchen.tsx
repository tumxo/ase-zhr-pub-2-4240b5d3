import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Stepper } from "@/components/buchen/stepper"
import { StepStandort } from "@/components/buchen/step-standort"
import { StepRaum } from "@/components/buchen/step-raum"
import { StepZeit } from "@/components/buchen/step-zeit"
import { StepBestaetigen } from "@/components/buchen/step-bestaetigen"
import type { BuchungsDraft } from "@/components/buchen/typen"
import { useBuchungen } from "@/lib/buchungen-store"
import {
  getRaum,
  getStandort,
  naechsterSlot,
  type Buchung,
} from "@/lib/mock-data"
import { formatLang, HEUTE } from "@/lib/datum"

const LEER: BuchungsDraft = { datum: HEUTE, titel: "", notiz: "" }

export function BuchenPage() {
  const { addBuchung } = useBuchungen()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<BuchungsDraft>(LEER)
  const [bestaetigt, setBestaetigt] = useState<Buchung | null>(null)

  const patch = (p: Partial<BuchungsDraft>) =>
    setDraft((d) => ({ ...d, ...p }))

  const weiterErlaubt = useMemo(() => {
    if (step === 0) return Boolean(draft.standortId)
    if (step === 1) return Boolean(draft.raumId)
    if (step === 2) return Boolean(draft.slot) && draft.datum >= HEUTE
    if (step === 3) return draft.titel.trim().length > 0
    return false
  }, [step, draft])

  function absenden() {
    if (!draft.raumId || !draft.slot) return
    const neu = addBuchung({
      raumId: draft.raumId,
      datum: draft.datum,
      start: draft.slot,
      ende: naechsterSlot(draft.slot),
      titel: draft.titel.trim(),
      notiz: draft.notiz.trim() || undefined,
    })
    setBestaetigt(neu)
  }

  function neustart() {
    setDraft(LEER)
    setStep(0)
    setBestaetigt(null)
  }

  if (bestaetigt) {
    const raum = getRaum(bestaetigt.raumId)
    const standort = raum ? getStandort(raum.standortId) : undefined
    return (
      <div className="mx-auto max-w-md space-y-6 py-10 text-center">
        <CheckCircle2 className="mx-auto size-14 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Buchung bestätigt!</h1>
          <p className="mt-2 text-muted-foreground">
            {raum?.name} · {standort?.name}
            <br />
            {formatLang(bestaetigt.datum)}, {bestaetigt.start}–{bestaetigt.ende}{" "}
            Uhr
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button render={<Link to="/buchungen" />}>Zu meinen Buchungen</Button>
          <Button variant="outline" onClick={neustart}>
            Weitere buchen
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Raum buchen</h1>
        <p className="text-muted-foreground">
          In vier Schritten zum gebuchten Konferenzraum.
        </p>
      </div>

      <Stepper aktiv={step} />

      <div className="min-h-[300px]">
        {step === 0 && (
          <StepStandort
            value={draft.standortId}
            onSelect={(id) =>
              patch({ standortId: id, raumId: undefined, slot: undefined })
            }
          />
        )}
        {step === 1 && draft.standortId && (
          <StepRaum
            standortId={draft.standortId}
            value={draft.raumId}
            onSelect={(id) => patch({ raumId: id, slot: undefined })}
          />
        )}
        {step === 2 && draft.raumId && (
          <StepZeit
            raumId={draft.raumId}
            datum={draft.datum}
            slot={draft.slot}
            onDatum={(iso) => patch({ datum: iso, slot: undefined })}
            onSlot={(s) => patch({ slot: s })}
          />
        )}
        {step === 3 && <StepBestaetigen draft={draft} onChange={patch} />}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="size-4" /> Zurück
        </Button>
        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!weiterErlaubt}
          >
            Weiter <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={absenden} disabled={!weiterErlaubt}>
            Verbindlich buchen
          </Button>
        )}
      </div>
    </div>
  )
}
