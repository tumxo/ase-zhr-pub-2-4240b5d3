#!/usr/bin/env bash
# PostToolUse-Hook: formatiert eine geänderte Backend-Java-Datei mit Spotless
# (google-java-format). Läuft nach Write/Edit; betrifft nur Dateien unter
# backend/ mit Endung .java. Schlägt nie hart fehl (blockiert keine Edits).

input="$(cat)"
file="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"

# Nur Backend-Java-Dateien formatieren – alles andere ignorieren.
case "$file" in
  *"/backend/"*.java) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0

# spotlessFiles erwartet eine Regex auf den absoluten Pfad – Sonderzeichen escapen.
regex="$(printf '%s' "$file" | sed 's/[][().^$*+?{}|\\/]/\\&/g')"

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}/backend" || exit 0
./gradlew spotlessApply -PspotlessFiles="$regex" -q >/dev/null 2>&1 || exit 0
