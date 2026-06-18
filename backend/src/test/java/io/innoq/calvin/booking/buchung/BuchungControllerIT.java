package io.innoq.calvin.booking.buchung;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.innoq.calvin.booking.jooq.tables.records.BuchungenRecord;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integrationstests des Booking Service über die volle Schicht (HTTP → Security → jOOQ → H2). Nutzt
 * eine fixierte Uhr (2026-06-17) für deterministische Vergangenheits-/Zukunftslogik.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BuchungControllerIT {

  private static final String ALEX = "alex.berger";
  private static final String MORGEN = "2026-06-18";

  @TestConfiguration
  static class FixierteUhr {
    @Bean
    @Primary
    Clock testClock() {
      return Clock.fixed(Instant.parse("2026-06-17T12:00:00Z"), ZoneOffset.UTC);
    }
  }

  @Autowired private MockMvc mvc;
  @Autowired private BuchungRepository repository;

  private MockMvc mvc() {
    return mvc;
  }

  private static String body(String raumId, String datum, String start, String ende, String titel) {
    return """
        {"raumId":"%s","standortId":"koeln","datum":"%s","start":"%s","ende":"%s","titel":"%s","notiz":"Hinweis"}
        """
        .formatted(raumId, datum, start, ende, titel);
  }

  @Test
  void ohne_authentifizierung_401() throws Exception {
    mvc().perform(get("/api/buchungen")).andExpect(status().isUnauthorized());
  }

  @Test
  void anlegen_und_auflisten() throws Exception {
    mvc()
        .perform(
            post("/api/buchungen")
                .with(httpBasic(ALEX, "egal"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("koeln-r5", MORGEN, "10:00", "11:00", "Team-Sync")))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.status").value("gebucht"))
        .andExpect(jsonPath("$.benutzer").value(ALEX));

    mvc()
        .perform(get("/api/buchungen").with(httpBasic(ALEX, "egal")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].titel").value("Team-Sync"));
  }

  @Test
  void doppelbuchung_liefert_409_mit_alternativen() throws Exception {
    mvc()
        .perform(
            post("/api/buchungen")
                .with(httpBasic(ALEX, "egal"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("koeln-r5", MORGEN, "10:00", "11:00", "Erstbuchung")))
        .andExpect(status().isCreated());

    // jana.schmidt versucht denselben Raum/Zeitraum -> Konflikt mit Alternativen.
    mvc()
        .perform(
            post("/api/buchungen")
                .with(httpBasic("jana.schmidt", "egal"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("koeln-r5", MORGEN, "10:00", "11:00", "Kollision")))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.alternativen").isArray())
        .andExpect(jsonPath("$.alternativen[0].start").exists());
  }

  @Test
  void validierungsfehler_bei_leerem_titel() throws Exception {
    mvc()
        .perform(
            post("/api/buchungen")
                .with(httpBasic(ALEX, "egal"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("koeln-r5", MORGEN, "10:00", "11:00", "")))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.felder").isArray());
  }

  @Test
  void belegung_und_verfuegbarkeit() throws Exception {
    mvc()
        .perform(
            post("/api/buchungen")
                .with(httpBasic(ALEX, "egal"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("koeln-r7", MORGEN, "10:00", "11:00", "Meeting")))
        .andExpect(status().isCreated());

    mvc()
        .perform(
            get("/api/raeume/koeln-r7/belegung")
                .param("datum", MORGEN)
                .with(httpBasic(ALEX, "egal")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].start").value("10:00"))
        .andExpect(jsonPath("$[0].ende").value("11:00"));

    mvc()
        .perform(
            get("/api/verfuegbarkeit")
                .param("raumId", "koeln-r7")
                .param("datum", MORGEN)
                .param("start", "10:00")
                .param("ende", "11:00")
                .with(httpBasic(ALEX, "egal")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.verfuegbar").value(false))
        .andExpect(jsonPath("$.alternativen").isArray());

    mvc()
        .perform(
            get("/api/verfuegbarkeit")
                .param("raumId", "koeln-r7")
                .param("datum", MORGEN)
                .param("start", "14:00")
                .param("ende", "15:00")
                .with(httpBasic(ALEX, "egal")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.verfuegbar").value(true));
  }

  @Test
  void stornieren_setzt_status_und_blockt_vergangene() throws Exception {
    // Zukünftige Buchung anlegen und stornieren.
    String id =
        com.jayway.jsonpath.JsonPath.read(
            mvc()
                .perform(
                    post("/api/buchungen")
                        .with(httpBasic(ALEX, "egal"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("koeln-r2", MORGEN, "09:00", "10:00", "Stornierbar")))
                .andReturn()
                .getResponse()
                .getContentAsString(),
            "$.id");

    mvc()
        .perform(delete("/api/buchungen/" + id).with(httpBasic(ALEX, "egal")))
        .andExpect(status().isNoContent());

    mvc()
        .perform(get("/api/buchungen/" + id).with(httpBasic(ALEX, "egal")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("storniert"));

    // Vergangene Buchung direkt einfügen -> Storno verboten (422).
    BuchungenRecord vergangen = repository.neuerRecord();
    vergangen.setId("b-vergangen");
    vergangen.setBenutzer(ALEX);
    vergangen.setRaumId("koeln-r2");
    vergangen.setStandortId("koeln");
    vergangen.setDatum(LocalDate.of(2026, 6, 10));
    vergangen.setStartZeit(LocalTime.of(9, 0));
    vergangen.setEndeZeit(LocalTime.of(10, 0));
    vergangen.setTitel("Alt");
    vergangen.setStatus("gebucht");
    vergangen.setErstelltAm(LocalDateTime.of(2026, 6, 1, 8, 0));
    repository.speichern(vergangen);

    mvc()
        .perform(delete("/api/buchungen/b-vergangen").with(httpBasic(ALEX, "egal")))
        .andExpect(status().isUnprocessableEntity());
  }

  @Test
  void aendern_verschiebt_zeit() throws Exception {
    String id =
        com.jayway.jsonpath.JsonPath.read(
            mvc()
                .perform(
                    post("/api/buchungen")
                        .with(httpBasic(ALEX, "egal"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("koeln-r4", MORGEN, "09:00", "10:00", "Original")))
                .andReturn()
                .getResponse()
                .getContentAsString(),
            "$.id");

    mvc()
        .perform(
            put("/api/buchungen/" + id)
                .with(httpBasic(ALEX, "egal"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("koeln-r4", MORGEN, "13:00", "14:00", "Verschoben")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.start").value("13:00"))
        .andExpect(jsonPath("$.titel").value("Verschoben"));
  }

  @Test
  void fremde_buchung_nicht_abrufbar() throws Exception {
    String id =
        com.jayway.jsonpath.JsonPath.read(
            mvc()
                .perform(
                    post("/api/buchungen")
                        .with(httpBasic("jana.schmidt", "egal"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("koeln-r6", MORGEN, "09:00", "10:00", "Janas Termin")))
                .andReturn()
                .getResponse()
                .getContentAsString(),
            "$.id");

    mvc()
        .perform(get("/api/buchungen/" + id).with(httpBasic(ALEX, "egal")))
        .andExpect(status().isNotFound());
  }

  @Test
  void fremde_buchung_stornieren_liefert_404() throws Exception {
    // alex.berger legt eine Buchung an.
    String id =
        com.jayway.jsonpath.JsonPath.read(
            mvc()
                .perform(
                    post("/api/buchungen")
                        .with(httpBasic(ALEX, "egal"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("koeln-r8", MORGEN, "11:00", "12:00", "Alexens Termin")))
                .andReturn()
                .getResponse()
                .getContentAsString(),
            "$.id");

    // jana.schmidt versucht, Alexens Buchung zu stornieren -> 404.
    mvc()
        .perform(delete("/api/buchungen/" + id).with(httpBasic("jana.schmidt", "egal")))
        .andExpect(status().isNotFound());
  }

  @Test
  void fremde_buchung_aendern_liefert_404() throws Exception {
    // alex.berger legt eine Buchung an.
    String id =
        com.jayway.jsonpath.JsonPath.read(
            mvc()
                .perform(
                    post("/api/buchungen")
                        .with(httpBasic(ALEX, "egal"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("koeln-r9", MORGEN, "13:00", "14:00", "Alexens Meeting")))
                .andReturn()
                .getResponse()
                .getContentAsString(),
            "$.id");

    // jana.schmidt versucht, Alexens Buchung zu ändern -> 404.
    mvc()
        .perform(
            put("/api/buchungen/" + id)
                .with(httpBasic("jana.schmidt", "egal"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("koeln-r9", MORGEN, "15:00", "16:00", "Umbenannt")))
        .andExpect(status().isNotFound());
  }

  @Test
  void nicht_vorhandene_buchung_liefert_404() throws Exception {
    mvc()
        .perform(get("/api/buchungen/nichtvorhanden").with(httpBasic(ALEX, "egal")))
        .andExpect(status().isNotFound());
  }

  @Test
  void aendern_bei_konflikt_liefert_409_mit_alternativen() throws Exception {
    // alex.berger bucht koeln-r1 für 10:00–11:00.
    mvc()
        .perform(
            post("/api/buchungen")
                .with(httpBasic(ALEX, "egal"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("koeln-r1", MORGEN, "10:00", "11:00", "Erstbuchung")))
        .andExpect(status().isCreated());

    // alex.berger bucht koeln-r2 für denselben Zeitraum.
    String id =
        com.jayway.jsonpath.JsonPath.read(
            mvc()
                .perform(
                    post("/api/buchungen")
                        .with(httpBasic(ALEX, "egal"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("koeln-r2", MORGEN, "10:00", "11:00", "Zweitbuchung")))
                .andReturn()
                .getResponse()
                .getContentAsString(),
            "$.id");

    // Versuch, die zweite Buchung auf koeln-r1 (bereits belegt) umzubuchen -> 409.
    mvc()
        .perform(
            put("/api/buchungen/" + id)
                .with(httpBasic(ALEX, "egal"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("koeln-r1", MORGEN, "10:00", "11:00", "Umbuchen")))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.alternativen").isArray());
  }

  @Test
  void buchung_ausserhalb_oeffnungszeiten_liefert_400() throws Exception {
    // 07:00–08:00 liegt vor Öffnungszeit (08:00) -> UngueltigeEingabe -> HTTP 400.
    mvc()
        .perform(
            post("/api/buchungen")
                .with(httpBasic(ALEX, "egal"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("koeln-r3", MORGEN, "07:00", "08:00", "Zu früh")))
        .andExpect(status().isBadRequest());
  }

  @Test
  void leere_liste_vor_erster_buchung() throws Exception {
    // Frische (transaktionale) DB: GET /api/buchungen liefert leere JSON-Liste.
    mvc()
        .perform(get("/api/buchungen").with(httpBasic(ALEX, "egal")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$").isEmpty());
  }
}
