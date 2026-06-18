const STORAGE_KEY = "calvin_benutzer"

export function getBenutzer(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function setBenutzer(name: string): void {
  localStorage.setItem(STORAGE_KEY, name)
}

export function removeBenutzer(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function initialen(benutzer: string): string {
  return benutzer
    .split(".")
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)
}
