import { test, expect } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear())
})

test("leitet unangemeldete Nutzer auf /login um", async ({ page }) => {
  await page.goto("/#/buchen")
  await expect(page).toHaveURL(/#\/login/)
  await expect(page.getByRole("heading", { name: "Calvin" })).toBeVisible()
  await expect(page.getByText("Bitte anmelden")).toBeVisible()
})

test("Anmelden per Schnellauswahl", async ({ page }) => {
  await page.goto("/#/login")
  await page.getByRole("button", { name: "alex.berger" }).click()
  await expect(page).toHaveURL(/#\/buchen/)
  await expect(page.getByText("alex.berger")).toBeVisible()
})

test("Anmelden per Freitexteingabe", async ({ page }) => {
  await page.goto("/#/login")
  await page.getByLabel("Benutzername").fill("jana.schmidt")
  await page.getByRole("button", { name: "Anmelden" }).click()
  await expect(page).toHaveURL(/#\/buchen/)
  await expect(page.getByText("jana.schmidt")).toBeVisible()
})

test("Enter-Taste löst Anmeldung aus", async ({ page }) => {
  await page.goto("/#/login")
  await page.getByLabel("Benutzername").fill("tom.mueller")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/#\/buchen/)
})

test("Abmelden kehrt zur Login-Seite zurück und löscht Session", async ({ page }) => {
  await page.goto("/#/login")
  await page.getByRole("button", { name: "alex.berger" }).click()
  await expect(page).toHaveURL(/#\/buchen/)

  await page.getByTitle("Abmelden").click()
  await expect(page).toHaveURL(/#\/login/)

  // Direkt nach /buchen navigieren muss wieder auf /login umleiten
  await page.goto("/#/buchen")
  await expect(page).toHaveURL(/#\/login/)
})
