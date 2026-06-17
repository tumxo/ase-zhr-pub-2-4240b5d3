# Qualitätsanforderungen

Diese Datei dokumentiert die Qualitätsszenarien für Calvin nach dem arc42-Template.

Jedes Szenario folgt dem Schema:
**Umgebung → Auslöser → Ereignis → Artefakt → Reaktion → Maßnahme**

---

## QS-1: Performance bei der Raumsuche

| Attribut | Beschreibung |
|----------|-------------|
| **Umgebung** | Normaler Betrieb während der Arbeitszeit, bis zu 50 Mitarbeiter nutzen Calvin gleichzeitig |
| **Auslöser** | INNOQ-Mitarbeiter |
| **Ereignis** | Sucht nach verfügbaren Räumen an einem Standort für einen bestimmten Zeitraum |
| **Artefakt** | Calvin Web-Frontend (Suchergebnisseite) |
| **Reaktion** | Die Liste verfügbarer Räume wird vollständig gerendert und anklickbar angezeigt |
| **Maßnahme** | Antwortzeit unter 300 ms für 95 % der Anfragen bei bis zu 50 gleichzeitigen Nutzern |

---

## QS-2: Verfügbarkeit während der Kernarbeitszeit

| Attribut | Beschreibung |
|----------|-------------|
| **Umgebung** | Kernarbeitszeit (7:00–19:00 Uhr an Werktagen) |
| **Auslöser** | INNOQ-Mitarbeiter |
| **Ereignis** | Ruft Calvin auf, um eine Buchung vorzunehmen oder bestehende Buchungen einzusehen |
| **Artefakt** | Calvin System (Frontend und Backend) |
| **Reaktion** | Das System ist erreichbar und funktionsfähig; bei einem Ausfall wird der Betrieb wiederhergestellt |
| **Maßnahme** | Maximale ungeplante Ausfallzeit 30 Minuten; Wiederherstellung innerhalb von 30 Minuten nach Ausfall |

---

## QS-3: Zugriffskontrolle und Datensicherheit

| Attribut | Beschreibung |
|----------|-------------|
| **Umgebung** | Normaler Betrieb, sowohl über das Internet als auch aus dem INNOQ-Netzwerk |
| **Auslöser** | Unauthentifizierter Nutzer oder INNOQ-Mitarbeiter |
| **Ereignis** | Versucht auf geschützte Ressourcen zuzugreifen (eigene oder fremde Buchungen, API-Endpunkte) |
| **Artefakt** | Calvin API und Web-Frontend |
| **Reaktion** | Unauthentifizierte Anfragen werden sofort abgewiesen; authentifizierte Mitarbeiter sehen ausschließlich ihre eigenen Buchungen |
| **Maßnahme** | 100 % der unauthentifizierten Anfragen erhalten HTTP 401; kein Zugriff auf Buchungsdaten anderer Mitarbeiter möglich |

---

## QS-4: Erlernbarkeit für neue Mitarbeiter

| Attribut | Beschreibung |
|----------|-------------|
| **Umgebung** | Erster Bürotag eines neuen INNOQ-Mitarbeiters, keine vorherige Schulung zu Calvin |
| **Auslöser** | Neuer INNOQ-Mitarbeiter |
| **Ereignis** | Öffnet Calvin zum ersten Mal und versucht eine Buchung vorzunehmen |
| **Artefakt** | Calvin Web-Frontend (Buchungsflow) |
| **Reaktion** | Der Mitarbeiter navigiert selbstständig durch den Buchungsflow und schließt die Buchung erfolgreich ab |
| **Maßnahme** | Erste Buchung in maximal 3 Minuten; 90 % der neuen Mitarbeiter schaffen dies ohne externe Hilfe |

---

## QS-5: Erweiterbarkeit um neue Standorte

| Attribut | Beschreibung |
|----------|-------------|
| **Umgebung** | INNOQ eröffnet einen neuen Bürostandort und möchte diesen in Calvin verfügbar machen |
| **Auslöser** | INNOQ-Administrator |
| **Ereignis** | Fügt einen neuen Standort mit Räumen und Kapazitäten zu Calvin hinzu |
| **Artefakt** | Calvin Konfiguration (Standort- und Raumdaten) |
| **Reaktion** | Der neue Standort erscheint in der Standortauswahl und alle Räume sind buchbar |
| **Maßnahme** | Umsetzung ausschließlich durch Konfigurationsanpassung, ohne Code-Änderungen am System |
