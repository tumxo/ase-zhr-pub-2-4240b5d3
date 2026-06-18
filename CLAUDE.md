# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

**Calvin** ist INNOQs internes Buchungssystem für Konferenzräume an allen 8 INNOQ-Standorten.
Es entsteht als Schulungsprojekt in Übungsschritten ("Übung X" / Branches `uebung-*`).
Domänensprache, UI und Doku sind **auf Deutsch** — halte dich beim Wording strikt an
`docs/produkt/glossar.md` (Ubiquitous Language).

Monorepo mit drei Teilen:

- `frontend/` — React-SPA (der Prototyp; aktueller Schwerpunkt)
- `backend/` — Spring-Boot "Booking Service" (gerade erst aufgesetzt, minimal)
- `docs/` — arc42-Architektur, ADRs, Produktdoku, Backlog

## Umgebung: kritische, nicht-offensichtliche Fallstricke

Die Entwicklung läuft in einer **Crucible / code-server** Trainingsumgebung (Debian, User `coder`),
**nicht** unter `localhost`. Das hat mehrere Konsequenzen, die schnell Zeit kosten:

- **Proxy-Pfad statt localhost:** Die App ist unter `https://crucible.ch.innoq.io/t/<token>/s/<session>/proxy/<port>/`
  erreichbar, abgeleitet aus der Env-Variable `VSCODE_PROXY_URI`. Asset-/Modul-URLs müssen den
  Proxy-Prefix tragen, API-Calls müssen **relativ** (ohne führenden Slash) sein. Details:
  `.claude/rules/betrieb-hinter-proxy.md`. (`vite.config.ts` leitet `base` und eine Rewrite-Middleware
  bereits aus `VSCODE_PROXY_URI` ab.)
- **Port 8080 ist belegt** von code-server (VS Code im Browser). Das Backend läuft deshalb auf **8081**
  (`server.port` in `backend/src/main/resources/application.properties`). Erkennbar: `curl localhost:8080/`
  liefert einen code-server-Redirect; `ss`/`netstat` zeigen den Listener nicht.
- **Vite 8 (Rolldown) ersetzt `define`-Konstanten im Dev-Server NICHT** (nur im Build). Werte, die im
  Browser gebraucht werden, daher **zur Laufzeit** ableiten (z. B. `frontend/src/pages/status.tsx`
  derived die Backend-URL aus `window.location`), nicht via `define`/`import.meta` Build-Substitution.
- **Backend-Port öffentlich stellen:** Damit der Browser das Backend über den Proxy erreicht, muss
  Port 8081 im Ports-Tab auf "public" stehen (manueller UI-Schritt).

## Befehle

### SDK (nach jedem Neustart der Umgebung neu nötig)

```bash
sudo bash scripts/install-sdk.sh   # installiert Java 21 (apt; braucht sudo)
```

### Frontend (`cd frontend`)

Keine automatisierten Tests im Frontend — `npm run build` (Typecheck) und `npm run lint` sind die Gates.

```bash
npm ci                 # Dependencies (reproduzierbar)
npm run dev            # Vite Dev-Server, Port 5173
npm run build          # tsc -b && vite build (Typecheck + Build)
npm run lint           # ESLint
npx shadcn@latest add <name> --overwrite   # ShadCN-Komponente hinzufügen
```

### Backend (`cd backend`)

```bash
./gradlew bootRun      # startet Spring Boot auf Port 8081
./gradlew test         # alle Tests
./gradlew test --tests "io.innoq.calvin.booking.BookingServiceApplicationTests"   # einzelner Test
./gradlew build        # kompilieren, testen, jar bauen
```

## Architektur

### Frontend — Prototyp ohne Backend

Der Frontend-Prototyp arbeitet bewusst **ohne Backend**: alle Fachdaten sind in
`frontend/src/lib/mock-data.ts` gemockt (ADR-002: Stammdaten/Resource Service liegen als Mock in der SPA).

- Stack: React 19 + TypeScript, Vite, **Tailwind v4** (CSS-only via `@theme`, **kein** `tailwind.config.js`),
  **ShadCN UI** (base-nova). Import-Alias `@/` → `frontend/src/`. Details: `.claude/rules/frontend/tech-stack.md`.
- Routing: `react-router-dom`, alle Routen in `frontend/src/App.tsx`; Seiten in `frontend/src/pages/`,
  gemeinsames `Layout` mit `app-sidebar`.
- Buchungs-Zustand: React-Context-Store in `frontend/src/lib/buchungen-store.tsx` (kein Server-State).
- **Ausnahme:** `pages/status.tsx` ist die einzige Seite, die wirklich das Backend anspricht — ein reiner
  Verbindungstest gegen `/api/hello`. Alle anderen Seiten bleiben mock-basiert
  (`.claude/rules/frontend/prototyp-scope.md`).

### Backend — Booking Service (Frühstadium)

Spring Boot (Java 21, Gradle). Package `io.innoq.calvin.booking`. Aktuell nur `GET /api/hello`
(`HelloController`) + `CorsConfig` (CORS für `/api/**`, Origins aus `cors.allowed-origins`).
**Der laut ADR-001 geplante Stack (H2, jOOQ, Flyway) ist noch NICHT vorhanden** — `build.gradle` enthält
bisher nur `spring-boot-starter-web`. Diese Bausteine kommen in späteren Übungen dazu.

## Konventionen

- **Commits:** Conventional Commits (`.claude/rules/commits.md`).
- **Dokumentation zuerst:** Bei Unsicherheit immer `docs/` konsultieren (`.claude/rules/nutzung-der-dokumentation.md`).
  Wichtige Quellen: `docs/arc42/`, `docs/architektur/` (Qualitätsszenarien, ADRs, technische Schulden),
  `docs/produkt/` (Produktvision, Glossar, Backlog).
- **Sprache:** Code-Kommentare, Doku, UI und Fachbegriffe auf Deutsch, gemäß Glossar.
- **Projektstruktur:** siehe `.claude/rules/projektstruktur.md`.

## CI

GitHub Actions binden Claude in PRs ein: `claude-code-review.yml` reviewt jeden PR automatisch,
`claude.yml` reagiert auf `@claude`-Erwähnungen in Issues/PR-Kommentaren.
