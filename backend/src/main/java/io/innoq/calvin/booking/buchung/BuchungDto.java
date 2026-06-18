package io.innoq.calvin.booking.buchung;

/**
 * Repräsentation einer Raumbuchung an der REST-API. Zeiten als "HH:mm", Datum als ISO "yyyy-MM-dd",
 * passend zum Frontend-Kontrakt. Raumdetails kennt der Booking Service nicht (ADR-002) – nur IDs.
 */
public record BuchungDto(
    String id,
    String benutzer,
    String raumId,
    String standortId,
    String datum,
    String start,
    String ende,
    String titel,
    String notiz,
    String status) {}
