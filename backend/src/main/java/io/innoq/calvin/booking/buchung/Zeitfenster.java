package io.innoq.calvin.booking.buchung;

/** Ein Start-/End-Zeitfenster ("HH:mm"), z. B. belegt oder als Alternativvorschlag. */
public record Zeitfenster(String start, String ende) {}
