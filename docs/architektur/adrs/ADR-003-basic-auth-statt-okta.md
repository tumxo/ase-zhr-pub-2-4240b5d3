# ADR-003: Basic-Auth ohne Passwörter statt Okta-Integration

## Status

Entschieden

## Kontext

Für Produktion ist eine Okta-Integration geplant, um INNOQ-Mitarbeiter sicher zu authentifizieren. Eine vollständige Okta-Anbindung erfordert jedoch Konfigurationsaufwand und eine Abhängigkeit zu einem Drittsystem, was die Entwicklung des Prototypen verlangsamt.

## Entscheidung

Für den Prototypen wird **keine Okta-Integration** umgesetzt. Stattdessen wird **HTTP Basic Authentication ohne Passwort** eingesetzt: Der Nutzername identifiziert den Mitarbeiter, ein Passwort ist nicht erforderlich.

## Begründung

- Keine Abhängigkeit zu Okta oder anderen externen Systemen im Prototypen
- Schnelles Wechseln zwischen verschiedenen Testnutzern möglich (z. B. `alex.berger`, `jana.schmidt`)
- Das Authentifizierungsmuster (HTTP Authorization Header) bleibt gleich — bei Produktionsreife wird Basic-Auth durch OAuth2/OIDC mit Okta ersetzt, ohne die restliche Architektur zu ändern

## Konsequenzen

- Der Booking Service liest den Nutzernamen aus dem `Authorization`-Header (Basic Auth, Passwort wird ignoriert)
- Es gibt keine Passwortverwaltung und keine Session-Tokens im Prototypen
- Die fehlende echte Authentifizierung und Autorisierung wird als technische Schuld erfasst (siehe [technische-schulden.md](../technische-schulden.md))
- Das Qualitätsszenario QS-3 (Zugriffskontrolle) gilt für die Produktionsarchitektur mit Okta — im Prototypen ist Sicherheit bewusst vereinfacht
- Bei Produktionsreife: Okta-Integration über Spring Security OAuth2 Resource Server
