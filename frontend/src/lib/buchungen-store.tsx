import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { getRaum, type Buchung } from "@/lib/mock-data"
import { createBuchung, listBuchungen, stornierenBuchung } from "@/lib/api"

type NeueBuchung = Omit<Buchung, "id" | "status">

interface BuchungenContextValue {
  buchungen: Buchung[]
  geladen: boolean
  fehler: string | null
  addBuchung: (b: NeueBuchung) => Promise<Buchung>
  stornieren: (id: string) => Promise<void>
  getBuchung: (id: string) => Buchung | undefined
  neuLaden: () => void
}

const BuchungenContext = createContext<BuchungenContextValue | null>(null)

export function BuchungenProvider({ children }: { children: ReactNode }) {
  const [buchungen, setBuchungen] = useState<Buchung[]>([])
  const [geladen, setGeladen] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  // Beim Mounten einmalig laden. Kein synchrones setState im Effekt-Body
  // (nur in den Promise-Callbacks), um Kaskaden-Renders zu vermeiden.
  useEffect(() => {
    let aktiv = true
    listBuchungen()
      .then((bs) => {
        if (aktiv) setBuchungen(bs)
      })
      .catch((e) => {
        if (aktiv) {
          setFehler(
            e instanceof Error ? e.message : "Buchungen konnten nicht geladen werden",
          )
        }
      })
      .finally(() => {
        if (aktiv) setGeladen(true)
      })
    return () => {
      aktiv = false
    }
  }, [])

  // Manuelles Neuladen (z. B. nach Fehler). Außerhalb eines Effekts, daher
  // sind die synchronen Status-Resets hier unkritisch.
  const neuLaden = useCallback(() => {
    setGeladen(false)
    setFehler(null)
    listBuchungen()
      .then((bs) => setBuchungen(bs))
      .catch((e) =>
        setFehler(
          e instanceof Error ? e.message : "Buchungen konnten nicht geladen werden",
        ),
      )
      .finally(() => setGeladen(true))
  }, [])

  const addBuchung = useCallback(async (b: NeueBuchung) => {
    // Der Booking Service braucht die Standort-ID; im Frontend aus dem Raum abgeleitet.
    const standortId = getRaum(b.raumId)?.standortId
    if (!standortId) {
      throw new Error(`Unbekannter Raum: ${b.raumId}`)
    }
    const neu = await createBuchung({
      raumId: b.raumId,
      standortId,
      datum: b.datum,
      start: b.start,
      ende: b.ende,
      titel: b.titel,
      notiz: b.notiz,
    })
    setBuchungen((prev) => [neu, ...prev])
    return neu
  }, [])

  const stornieren = useCallback(async (id: string) => {
    await stornierenBuchung(id)
    setBuchungen((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "storniert" } : b)),
    )
  }, [])

  const getBuchung = useCallback(
    (id: string) => buchungen.find((b) => b.id === id),
    [buchungen],
  )

  return (
    <BuchungenContext.Provider
      value={{
        buchungen,
        geladen,
        fehler,
        addBuchung,
        stornieren,
        getBuchung,
        neuLaden,
      }}
    >
      {children}
    </BuchungenContext.Provider>
  )
}

export function useBuchungen(): BuchungenContextValue {
  const ctx = useContext(BuchungenContext)
  if (!ctx) {
    throw new Error("useBuchungen muss innerhalb von BuchungenProvider genutzt werden")
  }
  return ctx
}
