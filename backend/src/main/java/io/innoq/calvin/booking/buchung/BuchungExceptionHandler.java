package io.innoq.calvin.booking.buchung;

import io.innoq.calvin.booking.buchung.BuchungExceptions.Konflikt;
import io.innoq.calvin.booking.buchung.BuchungExceptions.NichtGefunden;
import io.innoq.calvin.booking.buchung.BuchungExceptions.Regelverletzung;
import io.innoq.calvin.booking.buchung.BuchungExceptions.UngueltigeEingabe;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Übersetzt fachliche Ausnahmen in passende HTTP-Statuscodes und Fehlerantworten. */
@RestControllerAdvice
public class BuchungExceptionHandler {

  @ExceptionHandler(NichtGefunden.class)
  public ResponseEntity<Fehler.Meldung> nichtGefunden(NichtGefunden ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new Fehler.Meldung(ex.getMessage()));
  }

  @ExceptionHandler(Konflikt.class)
  public ResponseEntity<Fehler.Konflikt> konflikt(Konflikt ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(new Fehler.Konflikt(ex.getMessage(), ex.getAlternativen()));
  }

  @ExceptionHandler(Regelverletzung.class)
  public ResponseEntity<Fehler.Meldung> regelverletzung(Regelverletzung ex) {
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(new Fehler.Meldung(ex.getMessage()));
  }

  @ExceptionHandler(UngueltigeEingabe.class)
  public ResponseEntity<Fehler.Meldung> ungueltigeEingabe(UngueltigeEingabe ex) {
    return ResponseEntity.badRequest().body(new Fehler.Meldung(ex.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Fehler.Validierung> validierung(MethodArgumentNotValidException ex) {
    List<String> felder =
        ex.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .toList();
    return ResponseEntity.badRequest()
        .body(new Fehler.Validierung("Die Eingaben sind ungültig.", felder));
  }
}
