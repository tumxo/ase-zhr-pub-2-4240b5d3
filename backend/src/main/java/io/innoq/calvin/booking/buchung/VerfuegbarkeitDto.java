package io.innoq.calvin.booking.buchung;

import java.util.List;

/**
 * Ergebnis einer Verfügbarkeitsprüfung (CLVN-010). Ist der Raum belegt, enthält {@code
 * alternativen} passende Zeitfenster gleicher Dauer (CLVN-012), nach zeitlicher Nähe sortiert.
 */
public record VerfuegbarkeitDto(boolean verfuegbar, List<Zeitfenster> alternativen) {}
