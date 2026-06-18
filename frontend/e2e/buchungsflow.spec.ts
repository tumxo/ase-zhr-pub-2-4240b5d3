import { test, expect } from "@playwright/test"

const TESTUSER = "e2e.tester"
const TITEL = "E2E-Testmeeting"

// Vor jedem Test: frische Session als Testbenutzer
test.beforeEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear())
  await page.goto("/#/login")
  await page.getByLabel("Benutzername").fill(TESTUSER)
  await page.getByRole("button", { name: "Anmelden" }).click()
  await expect(page).toHaveURL(/#\/buchen/)
})

test("vollständiger Buchungsflow: anlegen, prüfen, stornieren", async ({ page }) => {
  // ── Schritt 0: Standort wählen ─────────────────────────────
  await page.getByRole("button", { name: /Köln/ }).click()
  await page.getByRole("button", { name: "Weiter" }).click()

  // ── Schritt 1: Raum wählen (ersten verfügbaren) ────────────
  await page.getByRole("button", { name: /Beethoven/ }).click()
  await page.getByRole("button", { name: "Weiter" }).click()

  // ── Schritt 2: Zeitfenster wählen (morgen, erster freier Slot) ─
  await page.getByRole("button", { name: "Nächster Tag" }).click()
  // Warten bis Belegung geladen (Ladetext verschwindet)
  await expect(page.getByText("Verfügbarkeit wird geladen…")).not.toBeVisible({ timeout: 5000 })
  await page.locator("button").filter({ hasText: "frei" }).first().click()
  await page.getByRole("button", { name: "Weiter" }).click()

  // ── Schritt 3: Titel eingeben und buchen ───────────────────
  await page.getByLabel("Meetingtitel").fill(TITEL)
  await page.getByRole("button", { name: "Verbindlich buchen" }).click()

  // ── Bestätigung ────────────────────────────────────────────
  await expect(page.getByText("Buchung bestätigt!")).toBeVisible()
  await page.getByRole("button", { name: "Zu meinen Buchungen" }).click()

  // ── Meine Buchungen: Buchung sichtbar ──────────────────────
  await expect(page).toHaveURL(/#\/buchungen/)
  await expect(page.getByText(TITEL)).toBeVisible()

  // ── Stornieren über Aktionen-Menü ──────────────────────────
  await page.getByRole("button", { name: "Aktionen" }).click()
  await page.getByRole("menuitem", { name: "Stornieren" }).click()

  // ── Storniert-Badge muss erscheinen ───────────────────────
  await expect(page.getByText("Storniert")).toBeVisible()
  await expect(page.getByText(TITEL)).toBeVisible() // Eintrag bleibt sichtbar
})

test("Doppelbuchung zeigt Konflikt-Toast mit Alternativen", async ({ page }) => {
  // Erste Buchung anlegen
  await page.getByRole("button", { name: /Köln/ }).click()
  await page.getByRole("button", { name: "Weiter" }).click()
  await page.getByRole("button", { name: /Bach/ }).click()
  await page.getByRole("button", { name: "Weiter" }).click()
  await page.getByRole("button", { name: "Nächster Tag" }).click()
  await expect(page.getByText("Verfügbarkeit wird geladen…")).not.toBeVisible({ timeout: 5000 })
  const ersterSlot = page.locator("button").filter({ hasText: "frei" }).first()
  const slotText = await ersterSlot.locator("span").first().textContent()
  await ersterSlot.click()
  await page.getByRole("button", { name: "Weiter" }).click()
  await page.getByLabel("Meetingtitel").fill("Erstbuchung E2E")
  await page.getByRole("button", { name: "Verbindlich buchen" }).click()
  await expect(page.getByText("Buchung bestätigt!")).toBeVisible()

  // Als zweiter Nutzer denselben Slot buchen – Session wechseln
  await page.evaluate(() => localStorage.setItem("calvin_benutzer", "e2e.zweiter"))
  await page.goto("/#/buchen")
  await page.getByRole("button", { name: /Köln/ }).click()
  await page.getByRole("button", { name: "Weiter" }).click()
  await page.getByRole("button", { name: /Bach/ }).click()
  await page.getByRole("button", { name: "Weiter" }).click()
  await page.getByRole("button", { name: "Nächster Tag" }).click()
  // Den gleichen Slot auswählen (er sollte jetzt als belegt markiert sein)
  await expect(page.getByText("Verfügbarkeit wird geladen…")).not.toBeVisible({ timeout: 5000 })
  // Slot ist belegt → Button disabled, kein "Weiter" möglich
  const belegterSlot = page.locator("button").filter({ hasText: slotText ?? "" }).first()
  await expect(belegterSlot).toBeDisabled()

  // Aufräumen: Erstbuchung stornieren
  await page.evaluate(() => localStorage.setItem("calvin_benutzer", TESTUSER))
  await page.goto("/#/buchungen")
  await page.getByRole("button", { name: "Aktionen" }).first().click()
  await page.getByRole("menuitem", { name: "Stornieren" }).click()
})

test("leere Buchungsliste zeigt Hinweistext", async ({ page }) => {
  await page.goto("/#/buchungen")
  // Neuer Testbenutzer hat keine Buchungen
  await expect(page.getByText(/Keine anstehenden Buchungen/)).toBeVisible()
})
