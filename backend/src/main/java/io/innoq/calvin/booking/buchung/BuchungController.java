package io.innoq.calvin.booking.buchung;

import jakarta.validation.Valid;
import java.net.URI;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST-Endpunkte des Booking Service. Der angemeldete Mitarbeiter wird über den Principal
 * (Basic-Auth, ADR-003) ermittelt; Aktionen wirken stets nur auf dessen eigene Buchungen.
 */
@RestController
@RequestMapping("/api")
public class BuchungController {

  private final BuchungService service;

  public BuchungController(BuchungService service) {
    this.service = service;
  }

  /** Alle eigenen Buchungen (CLVN-022/023). */
  @GetMapping("/buchungen")
  public List<BuchungDto> meineBuchungen(Principal principal) {
    return service.meineBuchungen(principal.getName());
  }

  /** Eine einzelne eigene Buchung im Detail (CLVN-024). */
  @GetMapping("/buchungen/{id}")
  public BuchungDto detail(@PathVariable String id, Principal principal) {
    return service.detail(principal.getName(), id);
  }

  /** Buchung anlegen (CLVN-019). Antwort 201, bei Doppelbuchung 409 mit Alternativen. */
  @PostMapping("/buchungen")
  public ResponseEntity<BuchungDto> anlegen(
      @Valid @RequestBody BuchungRequest req, Principal principal) {
    BuchungDto angelegt = service.anlegen(principal.getName(), req);
    return ResponseEntity.created(URI.create("/api/buchungen/" + angelegt.id())).body(angelegt);
  }

  /** Buchung ändern/verschieben (CLVN-027). Bei Konflikt 409 mit Alternativen. */
  @PutMapping("/buchungen/{id}")
  public BuchungDto aendern(
      @PathVariable String id, @Valid @RequestBody BuchungRequest req, Principal principal) {
    return service.aendern(principal.getName(), id, req);
  }

  /** Buchung stornieren (CLVN-026). */
  @DeleteMapping("/buchungen/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void stornieren(@PathVariable String id, Principal principal) {
    service.stornieren(principal.getName(), id);
  }

  /** Belegte Zeitfenster eines Raums an einem Tag (CLVN-011). */
  @GetMapping("/raeume/{raumId}/belegung")
  public List<Zeitfenster> belegung(@PathVariable String raumId, @RequestParam String datum) {
    return service.belegung(raumId, datum);
  }

  /** Verfügbarkeit für einen konkreten Zeitraum prüfen (CLVN-010/012). */
  @GetMapping("/verfuegbarkeit")
  public VerfuegbarkeitDto verfuegbarkeit(
      @RequestParam String raumId,
      @RequestParam String datum,
      @RequestParam String start,
      @RequestParam String ende) {
    return service.verfuegbarkeit(raumId, datum, start, ende);
  }
}
