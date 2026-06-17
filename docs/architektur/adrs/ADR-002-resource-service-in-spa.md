# ADR-002: Resource Service wird in die SPA integriert

## Status

Entschieden

## Kontext

Die ursprüngliche Architektur sah einen separaten Resource Service vor, der Stammdaten (Standorte, Räume, Ausstattungen) als REST-API bereitstellt. Für den Prototypen stellt sich die Frage, ob dieser Service sofort umgesetzt werden soll oder ob eine einfachere Lösung ausreicht.

## Entscheidung

Der Resource Service wird für den Prototypen **nicht als eigenständiger Service** umgesetzt. Standorte, Räume und Ausstattungen werden als **Mock-Daten direkt in der SPA** hinterlegt. Der Booking Service arbeitet ausschließlich mit den IDs aus diesen Mock-Daten.

## Begründung

- Der Fokus des Prototypen liegt auf dem Buchungsflow, nicht auf der Datenverwaltung
- Ein separater Service würde Infrastrukturaufwand erzeugen, der für die Validierung der Kernfunktionalität nicht nötig ist
- Die ID-basierte Kopplung zwischen SPA und Booking Service ermöglicht es, den Resource Service später als echten Service nachzurüsten, ohne die Buchungslogik anzufassen

## Konsequenzen

- Stammdaten (Standorte, Räume, Ausstattungen) liegen als statische Mock-Daten in `frontend/src/lib/mock-data.ts`
- Der Booking Service persistiert und validiert nur IDs — er kennt keine Raumdetails
- Die fehlende Entkopplung durch einen echten Resource Service wird als technische Schuld erfasst (siehe [technische-schulden.md](../technische-schulden.md))
- Bei Produktionsreife muss der Resource Service als eigener Service extrahiert und mit einer echten Datenbank unterlegt werden
