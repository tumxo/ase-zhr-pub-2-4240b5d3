import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { SCHRITTE } from "./typen"

export function Stepper({ aktiv }: { aktiv: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-2">
      {SCHRITTE.map((label, i) => {
        const done = i < aktiv
        const current = i === aktiv
        return (
          <li key={label} className="flex items-center">
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-full border text-xs font-medium",
                done && "border-primary bg-primary text-primary-foreground",
                current && "border-primary text-primary",
                !done && !current && "border-border text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "ml-2 text-sm",
                current ? "font-medium" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < SCHRITTE.length - 1 && (
              <div className="mx-2 h-px w-5 bg-border sm:w-10" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
