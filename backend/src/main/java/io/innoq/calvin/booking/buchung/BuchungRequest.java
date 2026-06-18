package io.innoq.calvin.booking.buchung;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Eingabe für das Anlegen oder Ändern einer Raumbuchung. */
public record BuchungRequest(
    @NotBlank(message = "Raum ist erforderlich") String raumId,
    @NotBlank(message = "Standort ist erforderlich") String standortId,
    @NotBlank @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Datum muss yyyy-MM-dd sein")
        String datum,
    @NotBlank @Pattern(regexp = "\\d{2}:\\d{2}", message = "Startzeit muss HH:mm sein")
        String start,
    @NotBlank @Pattern(regexp = "\\d{2}:\\d{2}", message = "Endzeit muss HH:mm sein") String ende,
    @NotBlank(message = "Meetingtitel ist erforderlich")
        @Size(max = 100, message = "Meetingtitel darf höchstens 100 Zeichen lang sein")
        String titel,
    @Size(max = 500, message = "Notiz darf höchstens 500 Zeichen lang sein") String notiz) {}
