# PROJ-10: LinkedIn-CSV-Import

## Status: Approved
**Created:** 2026-06-24
**Last Updated:** 2026-06-24

## Dependencies
- PROJ-3 (Kontakt anlegen & verwalten) — Kontakte werden in dieselbe `contacts`-Tabelle angelegt/aktualisiert, nutzt `first_name`/`last_name`/`employer`/`job_title`/`email`

## Implementation Notes
- `src/lib/linkedin-import.ts`: reine Funktionen `parseLinkedInCsv` (Header-Suche + `papaparse`) und `computeImportPlan` (Matching/Diff), 11 Vitest-Tests inkl. Header-Präambel, Quoted-Commas ("Lang, LL.M."), Case-insensitive Name-Fallback, Mehrfach-Treffer
- `src/components/linkedin-import-dialog.tsx`: Datei-Upload → Vorschau (Zahlen) → Bestätigen → Batch-Insert (50er-Gruppen) + Einzel-Updates über direkten Supabase-Client
- `src/components/contact-list.tsx`: neuer "LinkedIn importieren"-Button neben "Kontakt hinzufügen", übergibt bereits geladene `contacts` an den Dialog (kein Extra-Fetch)
- `src/lib/contacts.ts`: `Contact`-Interface um `linkedin_url` ergänzt
- `npm run build` + `npm run lint` + `npm test` (48/48) laufen fehlerfrei durch

## Backend Implementation Notes
- Migration `add_linkedin_url_to_contacts` (nullable text, kein Constraint) direkt auf Live-Projekt angewendet — gleiches Erweiterungsmuster wie `phone`/`email`/`city`
- Kein neuer API-Endpoint: Import läuft komplett über direkten Supabase-Client-Zugriff vom Frontend (RLS aus PROJ-1 erzwingt `user_id`-Ownership bei Insert/Update bereits serverseitig)
- Keine neue RLS-Policy nötig (bestehende `contacts`-Policies decken die neue Spalte automatisch ab)
- Supabase Security Advisors nach Migration geprüft: keine neuen Findings

## User Stories
- Als Nutzer möchte ich meinen jährlichen LinkedIn-Connections-Export als CSV hochladen können, damit ich nicht jeden Kontakt einzeln manuell anlegen muss
- Als Nutzer möchte ich, dass bereits vorhandene Kontakte beim Re-Upload aktualisiert (z.B. neuer Arbeitgeber) statt dupliziert werden, damit mein Netzwerk konsistent bleibt
- Als Nutzer möchte ich vor dem eigentlichen Import sehen, wie viele Kontakte neu angelegt bzw. aktualisiert werden, damit ich nicht versehentlich falsche Daten importiere
- Als Nutzer möchte ich, dass von mir bereits gepflegte Felder (Kategorie, Stärke, Notizen etc.) beim Import unangetastet bleiben, damit meine manuelle Einordnung nicht überschrieben wird

## Out of Scope
- Live-Synchronisation/OAuth mit LinkedIn — bewusst nur manueller, einmaliger CSV-Upload (PRD-Non-Goal "keine LinkedIn-API-Synchronisation" bezieht sich auf automatisches/laufendes Sync, nicht auf bewussten manuellen Upload — Entscheidung im Interview bestätigt)
- Export von Kontakten zurück als CSV — nur Import-Richtung
- Zeilen-für-Zeilen-Diff-Vorschau vor Bestätigung — nur Summary-Zahlen (neu/aktualisiert/unverändert/übersprungen), kein granularer Feld-Vergleich
- Unterstützung anderer CSV-Formate (Xing, Outlook-Kontakte etc.) — nur das LinkedIn-"Connections.csv"-Format
- Spalte "Connected On" — wird beim Import ignoriert, kein passendes Datenfeld am Kontakt vorhanden, kein neues Feld dafür eingeführt
- Automatische Auflösung von Mehrfach-Namens-Treffern ohne `linkedin_url` — bei Ambiguität wird einfach der erste Treffer verwendet (siehe Edge Cases), kein Dialog zur manuellen Auswahl
- Rollback/Undo nach bestätigtem Import — Import ist idempotent (erneuter Upload gleicher Datei überschreibt nur mit denselben Werten), das reicht als Sicherheitsnetz

## Acceptance Criteria

- [ ] Angenommen der Nutzer ist eingeloggt, wenn er eine gültige LinkedIn-CSV-Datei hochlädt, dann zeigt eine Vorschau die Anzahl neuer Kontakte, zu aktualisierender Kontakte, unveränderter Kontakte und übersprungener Zeilen, bevor irgendetwas gespeichert wird
- [ ] Angenommen die Vorschau wird angezeigt, wenn der Nutzer auf "Importieren" klickt, dann werden die Änderungen tatsächlich übernommen und eine Erfolgsmeldung mit den finalen Zahlen angezeigt
- [ ] Angenommen die Vorschau wird angezeigt, wenn der Nutzer auf "Abbrechen" klickt, dann wird kein Kontakt angelegt oder verändert
- [ ] Angenommen ein CSV-Eintrag hat eine `linkedin_url`, die exakt zu einem bestehenden Kontakt passt, dann wird dieser Kontakt aktualisiert statt ein neuer angelegt
- [ ] Angenommen ein CSV-Eintrag hat keine zu `linkedin_url` passende Übereinstimmung, aber Vorname+Nachname stimmen case-insensitive mit einem bestehenden Kontakt ohne gesetzte `linkedin_url` überein, dann wird dieser Kontakt aktualisiert und seine `linkedin_url` ergänzt
- [ ] Angenommen ein CSV-Eintrag hat weder per `linkedin_url` noch per Name eine Übereinstimmung, dann wird ein neuer Kontakt angelegt (Kategorie/Stärke/Kontext/Notizen/Stadt/Telefon/Geburtstag bleiben leer)
- [ ] Angenommen ein Feld im CSV-Eintrag ist leer (z.B. keine E-Mail-Adresse), wenn ein bestehender Kontakt aktualisiert wird, dann bleibt der bisherige Wert dieses Feldes unverändert (kein Überschreiben mit leer)
- [ ] Angenommen ein Feld im CSV-Eintrag ist nicht leer und unterscheidet sich vom bestehenden Wert, wenn der Kontakt aktualisiert wird, dann wird der neue Wert übernommen
- [ ] Angenommen Kategorie, Beziehungsstärke, Kontext, Notizen, Stadt, Telefonnummer oder Geburtstag sind an einem bestehenden Kontakt bereits gesetzt, dann werden sie durch den Import nie verändert (CSV liefert diese Felder nicht)
- [ ] Angenommen eine CSV-Zeile hat keinen Vorname-Wert, dann wird diese Zeile übersprungen und im "übersprungen"-Zähler der Vorschau mitgezählt
- [ ] Angenommen die hochgeladene Datei hat keine Zeile, die mit der Kopfzeile `First Name,Last Name,URL` beginnt, dann wird eine Fehlermeldung "Keine gültige LinkedIn-Export-Datei" angezeigt und kein Import-Versuch unternommen
- [ ] Angenommen die Supabase-API ist beim tatsächlichen Import nicht erreichbar, dann wird eine Fehlermeldung angezeigt; bereits gespeicherte Zeilen bleiben gespeichert (kein Rollback), ein erneuter Upload derselben Datei ist sicher (idempotent)
- [ ] Angenommen Nutzer A ist eingeloggt, wenn er eine CSV importiert, dann werden alle importierten/aktualisierten Kontakte ausschließlich mit `user_id = auth.uid()` gespeichert (RLS aus PROJ-1 erzwungen, kein Zugriff auf/Vermischen mit Kontakten anderer Nutzer)

## Edge Cases
- Zwei oder mehr bestehende Kontakte mit identischem Vorname+Nachname, keiner hat `linkedin_url` gesetzt → der erste gefundene Treffer wird aktualisiert (keine Disambiguierung in MVP, geringe Praxisrelevanz im persönlichen Netzwerk)
- Komplett leere CSV-Zeile (nur Datum, alle anderen Felder leer) → wird wie "kein Vorname" behandelt, übersprungen
- Sehr große CSV-Datei (mehrere hundert Zeilen) → kein explizites Zeilenlimit in MVP, Verarbeitung läuft client-seitig in Batches
- Sonderzeichen/Umlaute in Namen/Firmen (UTF-8) → werden korrekt übernommen, solange die Datei UTF-8-kodiert ist (LinkedIn-Standard-Export); fehlerhafte Kodierung anderer Quellen wird nicht erkannt/korrigiert
- Doppelter Klick auf "Importieren" während der Import läuft → Button disabled (Loading-State), kein doppelter Import-Lauf
- Erneuter Upload derselben Datei → fast alle Einträge landen in "unverändert" (Werte sind identisch), keine Duplikate
- CSV enthält eine Zeile mit `linkedin_url`, die zu einem Kontakt eines ANDEREN Nutzers gehören würde → kann nicht passieren, Matching läuft ausschließlich gegen die eigenen (RLS-gefilterten) Kontakte des eingeloggten Nutzers

## Technical Requirements
- Security: RLS aus PROJ-1 deckt Zugriff ab — Import darf `user_id` nie aus Client-Eingabe übernehmen, nur `auth.uid()`
- Validierung: Vorname Pflicht pro Zeile (sonst Skip), restliche Felder wie in PROJ-3 (Längen-Constraints gelten auch für importierte Werte)
- Neues Feld `linkedin_url` am Kontakt (text, nullable, optional, freier Text wie `phone`/`email` — kein Format-Constraint)
- Performance: Verarbeitung mehrerer hundert Zeilen muss ohne UI-Blockierung möglich sein (Batch-Verarbeitung)

## Open Questions
_Keine offenen Fragen — siehe Decision Log._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Manueller CSV-Upload widerspricht nicht dem PRD-Non-Goal "keine LinkedIn-Synchronisation" | Non-Goal zielte auf automatisches/laufendes API-Sync (OAuth, Hintergrund-Jobs) ab — ein bewusster, einmaliger manueller Upload ist eher Bulk-Quick-Add als Synchronisation | 2026-06-24 |
| Matching primär über neues Feld `linkedin_url`, Fallback auf Vorname+Nachname | LinkedIn-CSV hat keine andere stabile ID; Name-Fallback deckt Kontakte ab, die schon vor dem ersten Import manuell angelegt wurden | 2026-06-24 |
| Vorschau mit Summary-Zahlen vor Bestätigung statt direktem Import | Bulk-Operation auf potenziell hunderte Kontakte — Nutzer soll Tragweite sehen, bevor etwas gespeichert wird; kein Zeilen-Diff, da das für MVP zu granular wäre | 2026-06-24 |
| Leere CSV-Felder überschreiben nie bestehende Werte | LinkedIn-Exports haben oft leere E-Mail/Firma pro Zeile — sonst würde Import versehentlich bereits gepflegte Daten löschen | 2026-06-24 |
| Nur `first_name`/`last_name`/`employer`/`job_title`/`email`/`linkedin_url` werden importiert/aktualisiert, alle anderen Kontaktfelder bleiben unberührt | CSV liefert diese Daten gar nicht — Kategorie/Stärke/Kontext/Notizen/Stadt/Telefon/Geburtstag sind bewusste manuelle Kuration des Nutzers, der Import darf sie nicht antasten | 2026-06-24 |
| "Connected On"-Spalte wird ignoriert | Kein passendes Datenfeld vorhanden, kein neues Feld nur dafür eingeführt (Konsistenz mit Lean-Prinzip aus PROJ-3-Refine) | 2026-06-24 |
| Zeilen ohne Vorname werden übersprungen, kein Abbruch des Gesamtimports | Einzelne kaputte Zeilen (leere Zeilen, fehlende Daten) sollen den Rest des Imports nicht blockieren | 2026-06-24 |
| Parser sucht nach Zeile beginnend mit `First Name,Last Name,URL` als echte Kopfzeile, ignoriert Erklärtext davor | Echte LinkedIn-Exports enthalten eine Notiz-Präambel vor der eigentlichen Kopfzeile | 2026-06-24 |
| Mehrfache Namens-Treffer ohne `linkedin_url`: erster Treffer wird verwendet, keine Disambiguierungs-UI | Pragmatischer MVP-Kompromiss, geringe Praxisrelevanz bei einem persönlichen statt einem Massen-Netzwerk | 2026-06-24 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Neue Spalte `linkedin_url` (nullable, kein Constraint) statt eigener Mapping-Tabelle | Gleiches Erweiterungsmuster wie `phone`/`email`/`city` aus PROJ-3, kein neues Datenmodell für eine einzelne zusätzliche Spalte nötig | 2026-06-24 |
| CSV-Parsing + Matching/Diff komplett client-seitig, kein Server-Endpoint | Keine Secrets involviert, direkter Supabase-Zugriff reicht (RLS erzwingt Ownership), konsistent mit PROJ-3/4/5-Pattern | 2026-06-24 |
| `papaparse` als CSV-Parser-Package | Vermeidet Bugs durch eingebettete Kommas in Anführungszeichen-Feldern (z.B. Nachnamen mit Titel-Suffix), Standard-Library statt Eigenbau | 2026-06-24 |
| Vorschau-Berechnung und tatsächlicher Speichervorgang als zwei getrennte Funktionsaufrufe | Erzwingt den im Spec festgelegten Bestätigungs-Schritt technisch, verhindert versehentliches Schreiben beim bloßen Anzeigen der Vorschau | 2026-06-24 |
| Bulk-Insert/Update in Batches (z.B. 50 Zeilen pro Request) | Vermeidet Request-Größen-/Timeout-Probleme bei großen Exportdateien | 2026-06-24 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure

```
/contacts
├── "Kontakt hinzufügen"-Button (bestehend, PROJ-3)
├── "LinkedIn importieren"-Button (neu) → öffnet Import-Dialog
│   ├── Schritt 1: Datei-Upload
│   │   ├── Datei-Auswahl (akzeptiert .csv)
│   │   └── Fehlermeldung "Keine gültige LinkedIn-Export-Datei", falls Kopfzeile nicht gefunden
│   ├── Schritt 2: Vorschau (read-only, noch nichts gespeichert)
│   │   ├── Zahlen: "X neu", "Y aktualisiert", "Z unverändert", "W übersprungen (kein Vorname)"
│   │   ├── "Abbrechen"-Button → schließt Dialog, keine Änderung
│   │   └── "Importieren"-Button → löst den eigentlichen Speichervorgang aus
│   └── Schritt 3: Erfolgsmeldung mit finalen Zahlen, Kontaktliste aktualisiert sich
```

### Data Model (plain language)

`contacts` bekommt eine neue Spalte `linkedin_url` (Text, optional) — gleiches Muster wie `phone`/`email` aus PROJ-3, kein Format-Constraint. Dient als primärer Abgleichs-Schlüssel zwischen CSV-Zeile und bestehendem Kontakt.

Kein neues Datenmodell für den Import-Vorgang selbst — die Vorschau ist reiner Browser-Zustand (Ergebnis eines Vergleichs zwischen CSV-Inhalt und bereits geladenen eigenen Kontakten), nichts davon wird zwischengespeichert, bevor der Nutzer auf "Importieren" klickt.

### Tech Decisions (justified)

- **CSV-Parsing läuft komplett im Browser, kein Server-Roundtrip:** Es sind keine Geheimnisse (API-Keys) involviert, der Nutzer lädt die Datei nur für sich selbst hoch — ein Server-Umweg wäre unnötiger Mehraufwand, gleiche Überlegung wie bei den direkten Supabase-Zugriffen in PROJ-3/4/5.
- **Dedizierter CSV-Parser statt einfachem Komma-Split:** LinkedIn-Exports enthalten Felder mit eingebetteten Kommas in Anführungszeichen (z.B. Nachname "Lang, LL.M." in der Beispieldatei) — ein naiver Split würde Spalten falsch verschieben. Ein robuster, gut getesteter Parser vermeidet diese Fehlerklasse komplett.
- **Vergleich/Matching (Vorschau) und tatsächlicher Speichervorgang sind zwei getrennte Schritte:** Die Vorschau lädt einmal die eigenen Kontakte, berechnet den Diff rein im Speicher und verändert nichts. Erst der zweite, explizite Klick auf "Importieren" schreibt tatsächlich — verhindert versehentliches Auto-Save bei einer Bulk-Operation, die hunderte Kontakte betreffen kann.
- **Bulk-Speichern in mehreren kleineren Gruppen statt einem einzigen riesigen Request:** Vermeidet Timeout-/Größenprobleme bei sehr großen Dateien (mehrere hundert Zeilen), ohne dass der Nutzer etwas davon merkt.
- **Matching-Priorität `linkedin_url` vor Name-Fallback:** `linkedin_url` ist stabil und eindeutig pro Person, Name-Fallback ist nur ein Sicherheitsnetz für Kontakte, die vor dem ersten Import schon manuell angelegt wurden (deckt sich mit Produktentscheidung aus dem Spec-Interview).

### Dependencies (Packages)
- `papaparse` — robustes CSV-Parsing (Anführungszeichen, eingebettete Kommas), Standard-Wahl für clientseitiges CSV-Handling, keine Server-Abhängigkeit nötig

## QA Test Results

**Tested:** 2026-06-24
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status
- [x] Vorschau zeigt Zahlen (neu/aktualisiert/unverändert/übersprungen) vor jeder Speicherung
- [x] Bestätigen führt Änderungen durch, zeigt Erfolgsmeldung mit finalen Zahlen
- [x] Abbrechen in der Vorschau → kein Kontakt angelegt/verändert
- [x] Match über `linkedin_url` → bestehender Kontakt wird aktualisiert statt dupliziert
- [x] Kein `linkedin_url`-Match, aber Name-Match (case-insensitive) bei Kontakt ohne `linkedin_url` → aktualisiert + `linkedin_url` wird ergänzt
- [x] Kein Match → neuer Kontakt, übrige Felder (Kategorie/Stärke/Kontext/Notizen/Stadt/Telefon/Geburtstag) leer
- [x] Leeres CSV-Feld überschreibt nie einen bestehenden Wert
- [x] Nicht-leeres, abweichendes CSV-Feld wird übernommen
- [x] Kategorie/Stärke/Kontext/Notizen/Stadt/Telefon/Geburtstag werden vom Import nie verändert (manuell verifiziert: `category: 'friend'` blieb nach Import erhalten)
- [x] Zeile ohne Vorname → übersprungen, im Zähler erfasst
- [x] Datei ohne gültige Kopfzeile → Fehlermeldung "Keine gültige LinkedIn-Export-Datei.", kein Import-Versuch
- [x] Re-Upload derselben Datei → 0 neu, 0 aktualisiert, idempotent (keine Duplikate)
- [x] RLS: Insert/Update nutzt ausschließlich `auth.uid()` aus der Session, keine Client-Eingabe für `user_id` (Code-Review + strukturell identisch zu PROJ-3/4/5-Pattern)

**13/13 Acceptance Criteria passed.**

### Edge Cases Status
- [x] Mehrere Namens-Treffer ohne `linkedin_url` → erster Treffer wird verwendet (Vitest-Test `uses the first match when multiple contacts share the same name...`)
- [x] Komplett leere CSV-Zeile → wie "kein Vorname" behandelt, übersprungen (Vitest + E2E)
- [x] Eingebettete Kommas in Anführungszeichen-Feldern (z.B. Nachname mit Titel-Suffix) → korrekt geparst, `papaparse` übernimmt das (Vitest-Test `handles quoted fields with embedded commas`)
- [x] Header-Präambel vor der echten Kopfzeile (wie im echten LinkedIn-Export) → wird übersprungen, echte Kopfzeile korrekt erkannt (Vitest-Test `skips the notes preamble...`)
- [x] Doppelter Klick auf "Importieren" → Button disabled während Request läuft (Code-Review: `isSubmitting`-State)
- [x] Sehr große CSV-Datei → mit echter LinkedIn-Export-Datei (407 Zeilen, reale Sonderzeichen/Encoding-Artefakte, mehrere komplett leere Zeilen) end-to-end gegen die Vorschau getestet: 403 neue Kontakte erkannt, 4 korrekt übersprungen (leere Zeilen ohne Vorname), Parse+Diff-Berechnung in 23ms — keine Performance-Probleme. Bewusst **nicht bestätigt/importiert** (reale fremde Personendaten, nur Vorschau-Pfad verifiziert, danach abgebrochen, keine Auswirkung auf echte Kontaktdaten)

### Security Audit
- [x] Kein neuer API-Endpoint, keine neuen Secrets — Import läuft ausschließlich über direkten Supabase-Client-Zugriff, RLS aus PROJ-1 erzwingt Ownership bei Insert/Update identisch zu allen anderen Direct-Client-Features (PROJ-3/4/5)
- [x] Supabase Security Advisors nach Migration `add_linkedin_url_to_contacts` geprüft: keine neuen Findings (nur vorbestehender, projektunabhängiger Leaked-Password-Hinweis)
- [x] CSV-Inhalt landet nur als Text in Formularfeldern (kein `dangerouslySetInnerHTML`), kein XSS-Vektor durch hochgeladene Dateinamen/Feldwerte
- [x] Datei-Input akzeptiert nur Client-seitig `.csv` als Hinweis (kein Security-Mechanismus) — echter Schutz kommt vom CSV-Parser selbst, der bei nicht-CSV-Inhalt einfach keine gültige Kopfzeile findet und mit der dokumentierten Fehlermeldung abbricht (manuell mit `.txt`-Inhalt verifiziert)

### Bugs Found
Keine Bugs gefunden.

### Regression Testing
- `npm test`: 48/48 grün (7 unverändert + 11 neue für `linkedin-import.ts`)
- `npm run lint`, `npm run build`: fehlerfrei
- E2E PROJ-10 (4 Tests): 4/4 grün
- E2E Regression PROJ-3 (16), PROJ-4 (11), PROJ-5 (9), PROJ-6 (23), PROJ-8 (9): 68/68 grün — alle `--workers=1`, keine Auswirkung durch neue `linkedin_url`-Spalte oder den neuen Button auf `/contacts`
- **Gesamt E2E:** 73/73 grün

### Summary
- **Acceptance Criteria:** 13/13 passed
- **Bugs Found:** 0
- **Security:** Pass
- **Production Ready:** YES
- **Recommendation:** Deploy.

## Deployment
_To be added by /deploy_
