import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { MEINE_BUCHUNGEN, type Buchung } from "@/lib/mock-data"

type NeueBuchung = Omit<Buchung, "id" | "status">

interface BuchungenContextValue {
  buchungen: Buchung[]
  addBuchung: (b: NeueBuchung) => Buchung
  stornieren: (id: string) => void
  getBuchung: (id: string) => Buchung | undefined
}

const BuchungenContext = createContext<BuchungenContextValue | null>(null)

export function BuchungenProvider({ children }: { children: ReactNode }) {
  const [buchungen, setBuchungen] = useState<Buchung[]>(MEINE_BUCHUNGEN)
  const counter = useRef(2000)

  const addBuchung = useCallback((b: NeueBuchung) => {
    counter.current += 1
    const neu: Buchung = { ...b, id: `b-${counter.current}`, status: "gebucht" }
    setBuchungen((prev) => [neu, ...prev])
    return neu
  }, [])

  const stornieren = useCallback((id: string) => {
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
      value={{ buchungen, addBuchung, stornieren, getBuchung }}
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
