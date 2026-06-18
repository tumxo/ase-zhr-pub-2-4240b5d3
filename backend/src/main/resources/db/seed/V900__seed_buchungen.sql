-- Seed-Daten für den laufenden Prototyp (nur ausserhalb der Tests aktiv,
-- gesteuert über spring.flyway.locations). Bezugsdatum "heute" ist 2026-06-17.

-- Buchungen der Persona Alex Berger (erscheinen unter "Meine Buchungen").
INSERT INTO buchungen (id, benutzer, raum_id, standort_id, datum, start_zeit, ende_zeit, titel, notiz, status, erstellt_am) VALUES
  ('b-1001', 'alex.berger', 'koeln-r1', 'koeln',  DATE '2026-06-22', TIME '10:00:00', TIME '11:00:00', 'Projekt-Workshop Calvin', 'Bitte Whiteboard vorbereiten', 'gebucht', TIMESTAMP '2026-06-15 09:12:00'),
  ('b-1002', 'alex.berger', 'koeln-r3', 'koeln',  DATE '2026-06-25', TIME '14:00:00', TIME '15:00:00', '1:1 mit Teamlead', NULL, 'gebucht', TIMESTAMP '2026-06-15 09:13:00'),
  ('b-1003', 'alex.berger', 'berlin-r2', 'berlin', DATE '2026-06-10', TIME '09:00:00', TIME '10:30:00', 'Retro Sprint 14', NULL, 'gebucht', TIMESTAMP '2026-06-05 16:40:00');

-- Buchungen anderer Mitarbeiter: erzeugen sichtbare Belegung (CLVN-011) und
-- ermöglichen die Demonstration alternativer Zeitfenster (CLVN-012) für koeln-r1.
INSERT INTO buchungen (id, benutzer, raum_id, standort_id, datum, start_zeit, ende_zeit, titel, notiz, status, erstellt_am) VALUES
  ('b-2001', 'jana.schmidt', 'koeln-r1', 'koeln', DATE '2026-06-18', TIME '08:00:00', TIME '09:00:00', 'Daily Standup', NULL, 'gebucht', TIMESTAMP '2026-06-15 08:00:00'),
  ('b-2002', 'tom.meyer',    'koeln-r1', 'koeln', DATE '2026-06-18', TIME '10:00:00', TIME '11:00:00', 'Kundentermin Acme', NULL, 'gebucht', TIMESTAMP '2026-06-15 08:05:00'),
  ('b-2003', 'jana.schmidt', 'koeln-r1', 'koeln', DATE '2026-06-18', TIME '11:00:00', TIME '12:00:00', 'Architektur-Review', NULL, 'gebucht', TIMESTAMP '2026-06-15 08:10:00'),
  ('b-2004', 'tom.meyer',    'koeln-r1', 'koeln', DATE '2026-06-18', TIME '14:00:00', TIME '15:00:00', 'Onboarding', NULL, 'gebucht', TIMESTAMP '2026-06-15 08:15:00');
