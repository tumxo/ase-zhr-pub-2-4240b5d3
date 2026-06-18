import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setBenutzer } from "@/lib/benutzer"

const BEISPIEL_BENUTZER = ["alex.berger", "jana.schmidt", "tom.mueller"]

export function LoginPage() {
  const [eingabe, setEingabe] = useState("")
  const navigate = useNavigate()

  function anmelden(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    setBenutzer(trimmed)
    navigate("/buchen", { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold">Calvin</h1>
          <p className="text-sm text-muted-foreground">Bitte anmelden</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="benutzer">Benutzername</Label>
            <Input
              id="benutzer"
              placeholder="vorname.nachname"
              value={eingabe}
              onChange={(e) => setEingabe(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && anmelden(eingabe)}
              autoFocus
            />
          </div>
          <Button
            className="w-full"
            onClick={() => anmelden(eingabe)}
            disabled={!eingabe.trim()}
          >
            Anmelden
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-center text-muted-foreground">
            Schnellauswahl (Prototyp)
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {BEISPIEL_BENUTZER.map((b) => (
              <Button key={b} variant="outline" size="sm" onClick={() => anmelden(b)}>
                {b}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
