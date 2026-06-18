import { test, expect, type Page } from "@playwright/test"

const TESTUSER = "e2e.tester"
const TITEL = "E2E-Testmeeting"

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.clear())
})

async function login(page: Page, user = TESTUSER) {
  await page.goto("/#/login")
  await page.getByLabel("Benutzername").fill(user)
  await page.getByRole("button", { name: "Anmelden" }).click()
  await expect(page).toHaveURL(/#\/buchen/)
}

async function raumBuchen(page: Page, titel: string) {
  await page.getByRole("button", { name: /Köln/ }).click()
  await page.getByRole("button", { name: "Weiter" }).click()
  await page.getByRole("button", { name: "Wählen" }).first().click()
  await page.getByRole("button", { name: "Weiter" }).click()
  await page.getByRole("button", { name: "Nächster Tag" }).click()
  await expect(page.getByText("Verfügbarkeit wird geladen…")).not.toBeVisible({ timeout: 8000 })
  await page.locator("button").filter({ hasText: "frei" }).first().click()
  await page.getByRole("button", { name: "Weiter" }).click()
  await page.getByLabel("Meetingtitel").fill(titel)
  await page.getByRole("button", { name: "Verbindlich buchen" }).click()
  await expect(page.getByText("Buchung bestätigt!")).toBeVisible()
}

test("vollständiger Buchungsflow: anlegen, prüfen, stornieren", async ({ page }) => {
  await login(page)
  await raumBuchen(page, TITEL)

  await page.getByRole("link", { name: "Zu meinen Buchungen" }).click()
  await expect(page).toHaveURL(/#\/buchungen/)
  await expect(page.getByText(TITEL).first()).toBeVisible()

  // Stornieren: Badge-Anzahl vorher merken, dann Stornieren und +1 prüfen
  const stornosVorher = await page.locator('[data-slot="badge"]').filter({ hasText: "Storniert" }).count()
  await page.getByRole("button", { name: "Aktionen" }).first().click()
  await page.getByRole("menuitem", { name: "Stornieren" }).click()
  await expect(page.locator('[data-slot="badge"]').filter({ hasText: "Storniert" })).toHaveCount(stornosVorher + 1)
})

test("nach Buchung erscheint Slot als belegt im Zeitpicker", async ({ page }) => {
  await login(page)

  // Schritt 0–1: Standort + Raum
  await page.getByRole("button", { name: /Köln/ }).click()
  await page.getByRole("button", { name: "Weiter" }).click()
  await page.getByRole("button", { name: "Wählen" }).first().click()
  await page.getByRole("button", { name: "Weiter" }).click()

  // Schritt 2: Slot merken und buchen
  await page.getByRole("button", { name: "Nächster Tag" }).click()
  await expect(page.getByText("Verfügbarkeit wird geladen…")).not.toBeVisible({ timeout: 8000 })
  const ersterFreier = page.locator("button").filter({ hasText: "frei" }).first()
  const slotLabel = await ersterFreier.locator("span").first().textContent()
  await ersterFreier.click()
  await page.getByRole("button", { name: "Weiter" }).click()
  await page.getByLabel("Meetingtitel").fill("Slot-Belegungstest")
  await page.getByRole("button", { name: "Verbindlich buchen" }).click()
  await expect(page.getByText("Buchung bestätigt!")).toBeVisible()

  // Zurück zum Buchungsformular: Schritt 0–2 erneut durchlaufen
  await page.getByRole("button", { name: "Weitere buchen" }).click()
  await page.getByRole("button", { name: /Köln/ }).click()
  await page.getByRole("button", { name: "Weiter" }).click()
  await page.getByRole("button", { name: "Wählen" }).first().click()
  await page.getByRole("button", { name: "Weiter" }).click()
  await page.getByRole("button", { name: "Nächster Tag" }).click()
  await expect(page.getByText("Verfügbarkeit wird geladen…")).not.toBeVisible({ timeout: 8000 })

  // Gebuchter Slot muss als belegt erscheinen
  const belegterSlot = page.locator("button").filter({ hasText: slotLabel ?? "" }).filter({ hasText: "belegt" })
  await expect(belegterSlot).toBeVisible()

  // Aufräumen
  await page.goto("/#/buchungen")
  await page.getByRole("button", { name: "Aktionen" }).first().click()
  await page.getByRole("menuitem", { name: "Stornieren" }).click()
})

test("leere Buchungsliste zeigt Hinweistext", async ({ page }) => {
  // Eigener Benutzer ohne je erstellte Buchungen
  await login(page, "e2e.leer")
  await page.goto("/#/buchungen")
  await expect(page.getByText(/Keine anstehenden Buchungen/)).toBeVisible({ timeout: 10000 })
})
