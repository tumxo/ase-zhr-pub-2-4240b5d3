package io.innoq.calvin.booking.buchung;

import static io.innoq.calvin.booking.jooq.Tables.BUCHUNGEN;

import io.innoq.calvin.booking.jooq.tables.records.BuchungenRecord;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

/** Persistenzzugriff auf Buchungen via jOOQ (typsicheres SQL, ADR-001). */
@Repository
public class BuchungRepository {

  private final DSLContext dsl;

  public BuchungRepository(DSLContext dsl) {
    this.dsl = dsl;
  }

  /** Alle Buchungen eines Mitarbeiters, chronologisch (nächste zuerst nach Datum/Startzeit). */
  public List<BuchungenRecord> findByBenutzer(String benutzer) {
    return dsl.selectFrom(BUCHUNGEN)
        .where(BUCHUNGEN.BENUTZER.eq(benutzer))
        .orderBy(BUCHUNGEN.DATUM.asc(), BUCHUNGEN.START_ZEIT.asc())
        .fetch();
  }

  public Optional<BuchungenRecord> findById(String id) {
    return dsl.selectFrom(BUCHUNGEN).where(BUCHUNGEN.ID.eq(id)).fetchOptional();
  }

  /** Aktive (gebuchte) Reservierungen eines Raums an einem Tag – Basis der Konfliktprüfung. */
  public List<BuchungenRecord> findAktiveByRaumUndDatum(String raumId, LocalDate datum) {
    return dsl.selectFrom(BUCHUNGEN)
        .where(
            BUCHUNGEN.RAUM_ID.eq(raumId), BUCHUNGEN.DATUM.eq(datum), BUCHUNGEN.STATUS.eq("gebucht"))
        .orderBy(BUCHUNGEN.START_ZEIT.asc())
        .fetch();
  }

  /** Legt einen neuen, frischen (nicht aus der DB geladenen) Record an. */
  public BuchungenRecord neuerRecord() {
    return dsl.newRecord(BUCHUNGEN);
  }

  /** Speichert (INSERT für neue, UPDATE für geladene Records). */
  public void speichern(BuchungenRecord record) {
    record.attach(dsl.configuration());
    record.store();
  }
}
