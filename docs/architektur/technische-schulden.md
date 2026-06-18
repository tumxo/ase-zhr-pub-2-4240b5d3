# Technische Schulden

Diese Datei erfasst bekannte technische Schulden des Calvin-Systems, die bewusst für den Prototypen eingegangen wurden und vor dem Produktionsgang abgebaut werden müssen.

---

## TS-001: Fehlender Resource Service

**Ursprung:** [ADR-002](./adrs/ADR-002-resource-service-in-spa.md)

**Beschreibung:**
Standorte, Räume und Ausstattungen sind als statische Mock-Daten in der SPA hinterlegt statt in einem dedizierten Resource Service mit eigener Datenbank. Der Booking Service kennt keine Raumdetails und validiert nur IDs.

**Risiko:**
- Stammdatenänderungen (neuer Standort, Raumumbau) erfordern einen Frontend-Deployment
- Keine zentrale Quelle der Wahrheit für Ressourcendaten
- SPA und Booking Service können bei Dateninkonsistenz auseinanderlaufen

**Maßnahme vor Produktionsgang:**
Resource Service als eigenständigen Spring Boot Service extrahieren, Stammdaten in einer eigenen Datenbank persistieren, SPA ruft Stammdaten zur Laufzeit per API ab.

---

## TS-002: Basic-Auth ohne echte Authentifizierung

**Ursprung:** [ADR-003](./adrs/ADR-003-basic-auth-statt-okta.md)

**Beschreibung:**
Der Prototyp verwendet HTTP Basic Authentication ohne Passwortprüfung. Der Nutzername im Authorization-Header wird als Identität des Mitarbeiters akzeptiert, ohne Verifikation.

**Risiko:**
- Jeder kann Buchungen unter beliebigem Nutzernamen anlegen oder einsehen
- Keine Zugriffskontrolle — das Qualitätsszenario QS-3 ist im Prototypen nicht erfüllt
- Kein Audit-Trail mit verifizierten Identitäten

**Maßnahme vor Produktionsgang:**
Okta-Integration über Spring Security OAuth2 Resource Server. SPA erhält JWT-Token von Okta, Booking Service validiert Token und extrahiert Nutzeridentität daraus.
