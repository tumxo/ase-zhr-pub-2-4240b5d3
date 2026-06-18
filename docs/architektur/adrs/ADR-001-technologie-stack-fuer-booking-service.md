# ADR-001: Technologie-Stack für den Booking Service

## Status

Entschieden

## Kontext

Das Calvin-System lagert die Buchungslogik in einen separaten Booking Service aus. Dieser Service stellt eine REST-API bereit und benötigt eine dateibasierte Datenbank für den Entwicklungsbetrieb. Die Technologiewahl soll schnelle Entwicklung ermöglichen und vom Entwicklungsteam beherrschbar sein.

## Entscheidung

Der Booking Service wird mit folgenden Technologien umgesetzt:

| Schicht | Technologie |
|---------|------------|
| Framework | Java + Spring Boot |
| Datenbank | H2 (dateibasiert) |
| Datenbankzugriff | jOOQ |
| Schema-Migration | Flyway |

## Betrachtete Alternativen

### Framework: Kotlin + Ktor

**Vorteile:**
- Leichtgewichtiger als Spring Boot, schnellere Startzeit
- Moderner JVM-Stack mit Kotlin-Sprachvorteilen (Null-Safety, Data Classes)

**Nachteile:**
- Zusätzliche Lernkurve (Kotlin-Syntax, Ktor-Konzepte)
- Kleineres Ökosystem und weniger community-erprobte Patterns für CRUD-APIs

### Framework: Python + FastAPI

**Vorteile:**
- Sehr geringer Boilerplate, schnelle initiale Entwicklung
- Automatische OpenAPI-Dokumentation out of the box

**Nachteile:**
- Andere Sprache als das Team beherrscht — erhöhter Einarbeitungsaufwand
- Dynamisches Typing erhöht das Risiko von Laufzeitfehlern bei Refactorings

### Datenbankzugriff: Spring Data JPA statt jOOQ

**Vorteile:**
- Noch weniger Boilerplate durch automatische Repository-Implementierungen

**Nachteile:**
- ORM-Abstraktion verbirgt das tatsächliche SQL — schwerer zu debuggen
- Lazy-Loading-Fallen und N+1-Probleme bei komplexeren Abfragen (z. B. Buchungskonfliktprüfung)

### Datenbank: SQLite statt H2

**Vorteile:**
- Weit verbreitet, auch außerhalb der JVM-Welt

**Nachteile:**
- Kein nativer Spring-Boot-Auto-Konfigurations-Support
- Manueller JDBC-Treiber erforderlich; kein In-Memory-Modus für Tests

### Schema-Migration: Liquibase statt Flyway

**Vorteile:**
- Eingebautes Rollback-Konzept

**Nachteile:**
- Eigenes XML/YAML-Format — mehr Komplexität als plain SQL
- Overkill für ein internes Tool mit überschaubarem Schema

## Begründung

**Spring Boot** ist dem Team vertraut — die Lernkurve entfällt und die Entwicklung kann sich auf die fachliche Logik konzentrieren.

**jOOQ** bietet typsicheres SQL ohne ORM-Overhead: Abfragen werden als Java-Code formuliert, Fehler fallen zur Compile-Zeit auf, und das generierte SQL ist deterministisch und lesbar. Das passt besonders gut zu einem Buchungsservice, dessen Kernaufgabe Verfügbarkeits- und Konfliktprüfungen auf Zeitslot-Ebene sind.

**H2** im dateibasierten Modus ist nahtlos in Spring Boot integriert und erfordert keine separate Datenbankinstallation. Für Tests kann H2 im In-Memory-Modus verwendet werden.

**Flyway** ist die natürliche Ergänzung zu jOOQ: SQL-Migrationsdateien (`V1__create_buchungen.sql`) werden beim Start automatisch ausgeführt, jOOQ generiert daraus typsichere Klassen. Das Team hat bereits Erfahrung mit Flyway, was den Einstieg weiter vereinfacht.

## Konsequenzen

- Der Booking Service wird als eigenständiges Spring Boot-Projekt unter `backend/` angelegt
- Flyway verwaltet das Datenbankschema über versionierte SQL-Dateien unter `src/main/resources/db/migration/`
- jOOQ-Klassen werden aus dem Flyway-Schema generiert (via jOOQ Codegen Maven Plugin)
- H2 wird dateibasiert für Entwicklung und in-memory für Tests verwendet
- Ein Wechsel auf PostgreSQL für Produktion ist durch Konfiguration und jOOQ-Dialekt-Anpassung möglich, ohne Anwendungscode zu ändern
- REST-Endpunkte werden mit Spring MVC (`@RestController`) implementiert
