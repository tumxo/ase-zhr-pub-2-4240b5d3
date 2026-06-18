package io.innoq.calvin.booking.buchung;

import io.innoq.calvin.booking.buchung.BuchungExceptions.Konflikt;
import io.innoq.calvin.booking.buchung.BuchungExceptions.NichtGefunden;
import io.innoq.calvin.booking.buchung.BuchungExceptions.Regelverletzung;
import io.innoq.calvin.booking.buchung.BuchungExceptions.UngueltigeEingabe;
import io.innoq.calvin.booking.jooq.tables.records.BuchungenRecord;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Fachlogik der Raumbuchung: Anlegen, Ändern, Stornieren sowie Verfügbarkeits- und Konfliktprüfung
 * auf Zeitslot-Ebene. Verhindert Doppelbuchungen (QS-2) und schlägt alternative Zeitfenster vor.
 */
@Service
public class BuchungService {

  private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

  /** Büroöffnungszeiten – innerhalb dieses Fensters sind Buchungen möglich (CLVN-009). */
  static final LocalTime OEFFNUNG = LocalTime.of(8, 0);

  static final LocalTime SCHLIESSUNG = LocalTime.of(18, 0);
  private static final int RASTER_MINUTEN = 30;
  private static final int MAX_ALTERNATIVEN = 5;

  private final BuchungRepository repository;
  private final Clock clock;

  public BuchungService(BuchungRepository repository, Clock clock) {
    this.repository = repository;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public List<BuchungDto> meineBuchungen(String benutzer) {
    return repository.findByBenutzer(benutzer).stream().map(BuchungService::toDto).toList();
  }

  @Transactional(readOnly = true)
  public BuchungDto detail(String benutzer, String id) {
    return toDto(eigeneBuchung(benutzer, id));
  }

  @Transactional
  public BuchungDto anlegen(String benutzer, BuchungRequest req) {
    LocalDate datum = parseDatum(req.datum());
    LocalTime start = parseZeit(req.start());
    LocalTime ende = parseZeit(req.ende());
    pruefeZeitraum(datum, start, ende);
    pruefeKonflikt(req.raumId(), datum, start, ende, null);

    BuchungenRecord record = repository.neuerRecord();
    record.setId("b-" + UUID.randomUUID().toString().substring(0, 8));
    record.setBenutzer(benutzer);
    uebernehmeEingabe(record, req, datum, start, ende);
    record.setStatus("gebucht");
    record.setErstelltAm(LocalDateTime.now(clock));
    repository.speichern(record);
    return toDto(record);
  }

  @Transactional
  public BuchungDto aendern(String benutzer, String id, BuchungRequest req) {
    BuchungenRecord record = eigeneBuchung(benutzer, id);
    if (istVergangen(record)) {
      throw new Regelverletzung("Vergangene Buchungen können nicht geändert werden.");
    }
    LocalDate datum = parseDatum(req.datum());
    LocalTime start = parseZeit(req.start());
    LocalTime ende = parseZeit(req.ende());
    pruefeZeitraum(datum, start, ende);
    pruefeKonflikt(req.raumId(), datum, start, ende, id);

    uebernehmeEingabe(record, req, datum, start, ende);
    repository.speichern(record);
    return toDto(record);
  }

  @Transactional
  public void stornieren(String benutzer, String id) {
    BuchungenRecord record = eigeneBuchung(benutzer, id);
    if (istVergangen(record)) {
      throw new Regelverletzung("Vergangene Buchungen können nicht storniert werden.");
    }
    record.setStatus("storniert");
    repository.speichern(record);
  }

  /**
   * Belegte (gebuchte) Zeitfenster eines Raums an einem Tag – für die Belegungsanzeige (CLVN-011).
   */
  @Transactional(readOnly = true)
  public List<Zeitfenster> belegung(String raumId, String datum) {
    return repository.findAktiveByRaumUndDatum(raumId, parseDatum(datum)).stream()
        .map(b -> new Zeitfenster(b.getStartZeit().format(HHMM), b.getEndeZeit().format(HHMM)))
        .toList();
  }

  /** Prüft die Verfügbarkeit eines Zeitraums und liefert bei Konflikt alternative Zeitfenster. */
  @Transactional(readOnly = true)
  public VerfuegbarkeitDto verfuegbarkeit(String raumId, String datum, String start, String ende) {
    LocalDate tag = parseDatum(datum);
    LocalTime s = parseZeit(start);
    LocalTime e = parseZeit(ende);
    pruefeZeitraum(tag, s, e);
    boolean frei = !hatKonflikt(raumId, tag, s, e, null);
    List<Zeitfenster> alternativen = frei ? List.of() : alternativen(raumId, tag, s, e, null);
    return new VerfuegbarkeitDto(frei, alternativen);
  }

  // --- intern ---

  private BuchungenRecord eigeneBuchung(String benutzer, String id) {
    BuchungenRecord record = repository.findById(id).orElseThrow(() -> new NichtGefunden(id));
    if (!record.getBenutzer().equals(benutzer)) {
      // Fremde Buchungen werden wie nicht vorhanden behandelt (keine Information preisgeben).
      throw new NichtGefunden(id);
    }
    return record;
  }

  private void uebernehmeEingabe(
      BuchungenRecord record,
      BuchungRequest req,
      LocalDate datum,
      LocalTime start,
      LocalTime ende) {
    record.setRaumId(req.raumId());
    record.setStandortId(req.standortId());
    record.setDatum(datum);
    record.setStartZeit(start);
    record.setEndeZeit(ende);
    record.setTitel(req.titel().trim());
    String notiz = req.notiz() == null || req.notiz().isBlank() ? null : req.notiz().trim();
    record.setNotiz(notiz);
  }

  private void pruefeZeitraum(LocalDate datum, LocalTime start, LocalTime ende) {
    if (!ende.isAfter(start)) {
      throw new UngueltigeEingabe("Die Endzeit muss nach der Startzeit liegen.");
    }
    if (start.isBefore(OEFFNUNG) || ende.isAfter(SCHLIESSUNG)) {
      throw new UngueltigeEingabe("Buchungen sind nur zwischen 08:00 und 18:00 Uhr möglich.");
    }
    if (datum.isBefore(LocalDate.now(clock))) {
      throw new UngueltigeEingabe("Für vergangene Tage sind keine Buchungen möglich.");
    }
  }

  private void pruefeKonflikt(
      String raumId, LocalDate datum, LocalTime start, LocalTime ende, String ausschlussId) {
    if (hatKonflikt(raumId, datum, start, ende, ausschlussId)) {
      throw new Konflikt(alternativen(raumId, datum, start, ende, ausschlussId));
    }
  }

  private boolean hatKonflikt(
      String raumId, LocalDate datum, LocalTime start, LocalTime ende, String ausschlussId) {
    return repository.findAktiveByRaumUndDatum(raumId, datum).stream()
        .filter(b -> !b.getId().equals(ausschlussId))
        .anyMatch(b -> ueberlappt(start, ende, b.getStartZeit(), b.getEndeZeit()));
  }

  private static boolean ueberlappt(LocalTime s1, LocalTime e1, LocalTime s2, LocalTime e2) {
    return s1.isBefore(e2) && e1.isAfter(s2);
  }

  private List<Zeitfenster> alternativen(
      String raumId, LocalDate datum, LocalTime start, LocalTime ende, String ausschlussId) {
    Duration dauer = Duration.between(start, ende);
    List<BuchungenRecord> bestehende =
        repository.findAktiveByRaumUndDatum(raumId, datum).stream()
            .filter(b -> !b.getId().equals(ausschlussId))
            .toList();

    List<Zeitfenster> vorschlaege = new ArrayList<>();
    for (LocalTime kandidat = OEFFNUNG;
        !kandidat.plus(dauer).isAfter(SCHLIESSUNG);
        kandidat = kandidat.plusMinutes(RASTER_MINUTEN)) {
      LocalTime start2 = kandidat;
      LocalTime ende2 = kandidat.plus(dauer);
      if (start2.equals(start)) {
        continue;
      }
      boolean frei =
          bestehende.stream()
              .noneMatch(b -> ueberlappt(start2, ende2, b.getStartZeit(), b.getEndeZeit()));
      if (frei) {
        vorschlaege.add(new Zeitfenster(start2.format(HHMM), ende2.format(HHMM)));
      }
    }
    vorschlaege.sort(
        Comparator.comparingLong(
            z -> Math.abs(Duration.between(start, LocalTime.parse(z.start())).toMinutes())));
    return vorschlaege.stream().limit(MAX_ALTERNATIVEN).toList();
  }

  private boolean istVergangen(BuchungenRecord record) {
    return record.getDatum().isBefore(LocalDate.now(clock));
  }

  private static LocalDate parseDatum(String datum) {
    try {
      return LocalDate.parse(datum);
    } catch (RuntimeException ex) {
      throw new UngueltigeEingabe("Ungültiges Datum: " + datum);
    }
  }

  private static LocalTime parseZeit(String zeit) {
    try {
      return LocalTime.parse(zeit);
    } catch (RuntimeException ex) {
      throw new UngueltigeEingabe("Ungültige Zeit: " + zeit);
    }
  }

  private static BuchungDto toDto(BuchungenRecord r) {
    return new BuchungDto(
        r.getId(),
        r.getBenutzer(),
        r.getRaumId(),
        r.getStandortId(),
        r.getDatum().toString(),
        r.getStartZeit().format(HHMM),
        r.getEndeZeit().format(HHMM),
        r.getTitel(),
        r.getNotiz(),
        r.getStatus());
  }
}
