export interface BuchungsDraft {
  standortId?: string
  raumId?: string
  datum: string
  slot?: string
  titel: string
  notiz: string
}

export const SCHRITTE = ["Standort", "Raum", "Zeit", "Bestätigen"] as const
