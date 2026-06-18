package io.innoq.calvin.booking.buchung;

import java.util.List;

/** Fachliche Ausnahmen des Booking Service. */
public final class BuchungExceptions {
  private BuchungExceptions() {}

  /** Buchung existiert nicht oder gehört nicht dem anfragenden Mitarbeiter. */
  public static class NichtGefunden extends RuntimeException {
    public NichtGefunden(String id) {
      super("Buchung nicht gefunden: " + id);
    }
  }

  /** Raum ist im gewünschten Zeitraum bereits belegt (Doppelbuchung verhindert). */
  public static class Konflikt extends RuntimeException {
    private final transient List<Zeitfenster> alternativen;

    public Konflikt(List<Zeitfenster> alternativen) {
      super("Der Raum ist im gewählten Zeitraum bereits belegt.");
      this.alternativen = alternativen;
    }

    public List<Zeitfenster> getAlternativen() {
      return alternativen;
    }
  }

  /** Fachregel verletzt (z. B. Stornierung einer vergangenen Buchung). */
  public static class Regelverletzung extends RuntimeException {
    public Regelverletzung(String message) {
      super(message);
    }
  }

  /** Ungültige Eingabe jenseits der Bean-Validation (z. B. Endzeit vor Startzeit). */
  public static class UngueltigeEingabe extends RuntimeException {
    public UngueltigeEingabe(String message) {
      super(message);
    }
  }
}
