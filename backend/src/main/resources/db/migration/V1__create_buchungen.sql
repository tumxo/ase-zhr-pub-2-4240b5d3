-- Schema für den Booking Service.
-- Der Booking Service persistiert und validiert nur IDs (raum_id, standort_id);
-- die Raumdetails liegen laut ADR-002 als Mock-Daten in der SPA.
CREATE TABLE buchungen (
    id          VARCHAR(36)  NOT NULL,
    benutzer    VARCHAR(100) NOT NULL,
    raum_id     VARCHAR(64)  NOT NULL,
    standort_id VARCHAR(64)  NOT NULL,
    datum       DATE         NOT NULL,
    start_zeit  TIME         NOT NULL,
    ende_zeit   TIME         NOT NULL,
    titel       VARCHAR(100) NOT NULL,
    notiz       VARCHAR(500),
    status      VARCHAR(20)  NOT NULL,
    erstellt_am TIMESTAMP    NOT NULL,
    CONSTRAINT pk_buchungen PRIMARY KEY (id)
);

-- Index für die Verfügbarkeits-/Konfliktprüfung auf Zeitslot-Ebene (Kernaufgabe).
CREATE INDEX idx_buchungen_raum_datum ON buchungen (raum_id, datum);
-- Index für die Abfrage der eigenen Buchungen je Mitarbeiter.
CREATE INDEX idx_buchungen_benutzer ON buchungen (benutzer);
