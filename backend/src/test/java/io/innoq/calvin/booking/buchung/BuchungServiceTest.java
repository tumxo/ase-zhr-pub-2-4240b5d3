package io.innoq.calvin.booking.buchung;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import io.innoq.calvin.booking.buchung.BuchungExceptions.Konflikt;
import io.innoq.calvin.booking.buchung.BuchungExceptions.Regelverletzung;
import io.innoq.calvin.booking.buchung.BuchungExceptions.UngueltigeEingabe;
import io.innoq.calvin.booking.jooq.tables.records.BuchungenRecord;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit-Tests der Buchungs-Fachlogik (Konflikt-, Alternativ- und Regelprüfung). */
@ExtendWith(MockitoExtension.class)
class BuchungServiceTest {

  // "Heute" fix auf 2026-06-17 für deterministische Vergangenheits-Prüfungen.
  private static final Clock CLOCK =
      Clock.fixed(Instant.parse("2026-06-17T12:00:00Z"), ZoneOffset.UTC);
  private static final String NUTZER = "alex.berger";
  private static final LocalDate MORGEN = LocalDate.of(2026, 6, 18);

  @Mock private BuchungRepository repository;

  private BuchungService service() {
    return new BuchungService(repository, CLOCK);
  }

  private static BuchungenRecord record(String id, LocalTime start, LocalTime ende) {
    BuchungenRecord r = new BuchungenRecord();
    r.setId(id);
    r.setBenutzer("jana.schmidt");
    r.setRaumId("koeln-r1");
    r.setStandortId("koeln");
    r.setDatum(MORGEN);
    r.setStartZeit(start);
    r.setEndeZeit(ende);
    r.setTitel("Belegung");
    r.setStatus("gebucht");
    return r;
  }

  private static BuchungRequest request(String start, String ende) {
    return new BuchungRequest("koeln-r1", "koeln", "2026-06-18", start, ende, "Mein Meeting", null);
  }

  @Test
  void anlegen_ohne_konflikt_speichert_und_liefert_dto() {
    when(repository.findAktiveByRaumUndDatum("koeln-r1", MORGEN)).thenReturn(List.of());
    when(repository.neuerRecord()).thenReturn(new BuchungenRecord());

    BuchungDto dto = service().anlegen(NUTZER, request("10:00", "11:00"));

    assertThat(dto.benutzer()).isEqualTo(NUTZER);
    assertThat(dto.start()).isEqualTo("10:00");
    assertThat(dto.ende()).isEqualTo("11:00");
    assertThat(dto.status()).isEqualTo("gebucht");
    assertThat(dto.id()).startsWith("b-");
  }

  @Test
  void anlegen_bei_ueberlappung_wirft_konflikt_mit_alternativen() {
    when(repository.findAktiveByRaumUndDatum("koeln-r1", MORGEN))
        .thenReturn(
            List.of(
                record("b-1", LocalTime.of(8, 0), LocalTime.of(9, 0)),
                record("b-2", LocalTime.of(10, 0), LocalTime.of(11, 0)),
                record("b-3", LocalTime.of(11, 0), LocalTime.of(12, 0))));

    assertThatThrownBy(() -> service().anlegen(NUTZER, request("10:00", "11:00")))
        .isInstanceOf(Konflikt.class)
        .satisfies(
            ex -> {
              List<Zeitfenster> alt = ((Konflikt) ex).getAlternativen();
              // Gleiche Dauer (1h), keine Überlappung, nach Nähe sortiert, max. 5.
              assertThat(alt).isNotEmpty().hasSizeLessThanOrEqualTo(5);
              assertThat(alt).allSatisfy(z -> assertThat(z.start()).isNotEqualTo("10:00"));
              // 09:00 ist frei (zwischen 09 und 10) und am nächsten am Wunsch 10:00.
              assertThat(alt.get(0).start()).isEqualTo("09:00");
              assertThat(alt).noneMatch(z -> z.start().equals("08:00")); // belegt
            });
  }

  @Test
  void angrenzende_buchungen_ueberlappen_nicht() {
    when(repository.findAktiveByRaumUndDatum("koeln-r1", MORGEN))
        .thenReturn(List.of(record("b-1", LocalTime.of(9, 0), LocalTime.of(10, 0))));
    when(repository.neuerRecord()).thenReturn(new BuchungenRecord());

    // 10:00-11:00 grenzt an 09:00-10:00 an, ist aber kein Konflikt.
    BuchungDto dto = service().anlegen(NUTZER, request("10:00", "11:00"));
    assertThat(dto.start()).isEqualTo("10:00");
  }

  @Test
  void verfuegbarkeit_meldet_frei_und_belegt() {
    when(repository.findAktiveByRaumUndDatum("koeln-r1", MORGEN))
        .thenReturn(List.of(record("b-1", LocalTime.of(10, 0), LocalTime.of(11, 0))));

    assertThat(service().verfuegbarkeit("koeln-r1", "2026-06-18", "14:00", "15:00").verfuegbar())
        .isTrue();

    VerfuegbarkeitDto belegt = service().verfuegbarkeit("koeln-r1", "2026-06-18", "10:00", "11:00");
    assertThat(belegt.verfuegbar()).isFalse();
    assertThat(belegt.alternativen()).isNotEmpty();
  }

  @Test
  void endzeit_vor_startzeit_ist_ungueltig() {
    assertThatThrownBy(() -> service().anlegen(NUTZER, request("11:00", "10:00")))
        .isInstanceOf(UngueltigeEingabe.class);
  }

  @Test
  void buchung_ausserhalb_der_oeffnungszeiten_ist_ungueltig() {
    assertThatThrownBy(() -> service().anlegen(NUTZER, request("07:00", "08:00")))
        .isInstanceOf(UngueltigeEingabe.class);
  }

  @Test
  void stornieren_vergangener_buchung_verletzt_regel() {
    BuchungenRecord vergangen = record("b-alt", LocalTime.of(9, 0), LocalTime.of(10, 0));
    vergangen.setBenutzer(NUTZER);
    vergangen.setDatum(LocalDate.of(2026, 6, 10)); // vor "heute"
    lenient().when(repository.findById("b-alt")).thenReturn(Optional.of(vergangen));

    assertThatThrownBy(() -> service().stornieren(NUTZER, "b-alt"))
        .isInstanceOf(Regelverletzung.class);
  }

  @Test
  void fremde_buchung_ist_nicht_sichtbar() {
    BuchungenRecord fremd = record("b-fremd", LocalTime.of(9, 0), LocalTime.of(10, 0));
    when(repository.findById("b-fremd")).thenReturn(Optional.of(fremd));

    assertThatThrownBy(() -> service().detail(NUTZER, "b-fremd"))
        .isInstanceOf(BuchungExceptions.NichtGefunden.class);
  }
}
