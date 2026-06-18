package io.innoq.calvin.booking.buchung;

import java.util.List;

/** Fehlerantworten der API. */
public final class Fehler {
  private Fehler() {}

  /** Allgemeiner Fehler mit Meldung (404, 422, 400). */
  public record Meldung(String fehler) {}

  /** Konflikt (409): Raum bereits belegt, mit alternativen Zeitfenstern (CLVN-012). */
  public record Konflikt(String fehler, List<Zeitfenster> alternativen) {}

  /** Validierungsfehler (400) mit feldbezogenen Meldungen. */
  public record Validierung(String fehler, List<String> felder) {}
}
