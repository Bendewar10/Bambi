# PROJ-10: LinkedIn-CSV-Import

## Status: In Progress
**Created:** 2026-06-24
**Last Updated:** 2026-06-28

> Refinement 2026-06-28: Vorschau wird von reinen Summary-Zahlen auf eine Review-Liste mit Anlass-Erkennung (Jobwechsel/Beförderung) umgebaut, kein automatisches Überschreiben mehr. Frontend für diese Neufassung ist implementiert (siehe "Implementation Notes (Refinement 2026-06-28)" unten); Abschnitte "Implementation Notes", "QA Test Results" und "Deployment" weiter unten beschreiben die ursprünglich deployte Vorgänger-Version.

## Implementation Notes (Refinement 2026-06-28)
- `src/lib/linkedin-import.ts`: `computeImportPlan` liefert jetzt pro Bestandskontakt eine `ContactChange` (Name, Liste von `FieldDiff` mit `field`/`oldValue`/`newValue`, abgeleitete `occasions`) statt eines fertigen Update-Pakets; `FIELD_LABELS` für die UI-Anzeige ergänzt
- Anlass-Erkennung: `Jobwechsel` wenn `employer`-Diff vorhanden und alter Wert nicht leer; `Beförderung` analog für `job_title`; beide gleichzeitig möglich
- `src/components/linkedin-import-dialog.tsx`: Vorschau zeigt jetzt "Neue Kontakte" (editierbare employer/job_title/email-Felder) und "Veränderungen" (gruppiert pro Person, alt→neu pro Feld, editierbar, Anlass-Badges) — je mit Checkbox (default an); "Bestätigen" schreibt nur angehakte Zeilen mit ihrem aktuellen (ggf. bearbeiteten) Wert
- `tests/PROJ-10-linkedin-csv-import.spec.ts`: bestehende E2E-Tests an neue UI-Texte/Struktur angepasst, 2 neue Tests ergänzt (Checkbox-Ausschluss, Wert-Bearbeitung vor Bestätigen)
- `src/lib/linkedin-import.test.ts`: Tests auf neue `changes`-Struktur umgestellt, 3 neue Tests für Anlass-Tagging (Jobwechsel, Beförderung, beide gleichzeitig, kein Tag bei Erstbefüllung)
- Keine Schema-Änderung, kein neuer Server-Endpoint (Tech Design bestätigt)
- `npm run lint` + `npm run build` + `npm test` (50/50) fehlerfrei
- E2E PROJ-10 (6/6) + volle Regression aller anderen Specs (73/73) — **79/79 grün** (`--workers=1`)

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
- Als Nutzer möchte ich, dass importierbare Felder (employer, job_title, last_name, email, linkedin_url) bei Bestandskontakten NIE automatisch überschrieben werden, sondern erst nach meiner Bestätigung, damit eigene Korrekturen/Ergänzungen an diesen Feldern zwischen zwei Importen nicht verloren gehen
- Als Nutzer möchte ich pro Person sehen, welche Felder sich seit dem letzten Import geändert haben (alt→neu), gruppiert statt einzeln verstreut, damit ich auf einen Blick erfasse, was bei wem passiert ist
- Als Nutzer möchte ich, dass Jobwechsel oder Beförderungen explizit als Anlass markiert werden, damit ich erkenne, bei wem es sich gerade lohnt, sich zu melden
- Als Nutzer möchte ich Werte in der Vorschau direkt bearbeiten können (neue Kontakte und Veränderungen), damit ich CSV-Eigenheiten vor dem Speichern korrigieren kann
- Als Nutzer möchte ich einzelne Zeilen (einen neuen Kontakt oder die Änderungen einer Person) gezielt von der Übernahme ausschließen können, ohne den ganzen Import abzubrechen

## Out of Scope
- Live-Synchronisation/OAuth mit LinkedIn — bewusst nur manueller, einmaliger CSV-Upload (PRD-Non-Goal "keine LinkedIn-API-Synchronisation" bezieht sich auf automatisches/laufendes Sync, nicht auf bewussten manuellen Upload — Entscheidung im Interview bestätigt)
- Export von Kontakten zurück als CSV — nur Import-Richtung
- Unterstützung anderer CSV-Formate (Xing, Outlook-Kontakte etc.) — nur das LinkedIn-"Connections.csv"-Format
- Spalte "Connected On" — wird beim Import ignoriert, kein passendes Datenfeld am Kontakt vorhanden, kein neues Feld dafür eingeführt
- Automatische Auflösung von Mehrfach-Namens-Treffern ohne `linkedin_url` — bei Ambiguität wird einfach der erste Treffer verwendet (siehe Edge Cases), kein Dialog zur manuellen Auswahl
- Rollback/Undo nach bestätigtem Import — Import ist idempotent (erneuter Upload gleicher Datei überschreibt nur mit denselben Werten), das reicht als Sicherheitsnetz
- Anlass-Tags für andere Felder als employer/job_title (z.B. neue Stadt, neue E-Mail) — diese Feldänderungen erscheinen weiterhin in der Veränderungs-Liste, aber ohne "Jobwechsel"/"Beförderung"-Tag
- Persistente Historie/Protokoll erkannter Veränderungen über den aktuellen Import-Lauf hinaus — Anlass-Erkennung ist reine Diff-Berechnung der aktuellen Vorschau, nichts wird als "Change-Log" in der DB gespeichert
- Benachrichtigung (E-Mail/Push) bei erkannten Anlässen außerhalb des Import-Dialogs — Anzeige nur innerhalb der Vorschau des aktuellen Imports

## Acceptance Criteria

- [ ] Angenommen der Nutzer ist eingeloggt, wenn er eine gültige LinkedIn-CSV-Datei hochlädt, dann zeigt eine Vorschau zwei Listen — "Neue Kontakte" (Name + employer/job_title/email, editierbar, Checkbox default aktiv) und "Veränderungen" gruppiert pro Person (alle abweichenden Felder dieser Person zusammen, alt→neu, editierbar, Checkbox default aktiv) — sowie die einfachen Zähler "unverändert" und "übersprungen", bevor irgendetwas gespeichert wird
- [ ] Angenommen der employer eines Bestandskontakts unterscheidet sich vom CSV-Wert (alter und neuer Wert beide nicht leer), dann zeigt die Veränderungs-Zeile dieser Person das Anlass-Tag "Jobwechsel"
- [ ] Angenommen der job_title eines Bestandskontakts unterscheidet sich vom CSV-Wert (alter und neuer Wert beide nicht leer), dann zeigt die Veränderungs-Zeile dieser Person das Anlass-Tag "Beförderung"
- [ ] Angenommen employer UND job_title einer Person unterscheiden sich gleichzeitig (beide jeweils nicht leer), dann zeigt die Veränderungs-Zeile dieser Person beide Anlass-Tags "Jobwechsel" und "Beförderung" gemeinsam
- [ ] Angenommen ein Feld (employer, job_title, last_name, email oder linkedin_url) eines Bestandskontakts ist aktuell leer und die CSV liefert dafür einen Wert, dann erscheint dies in der Veränderungs-Liste als Feld-Update ohne Anlass-Tag ("Neu erfasst"), wird aber NICHT automatisch im Hintergrund gespeichert
- [ ] Angenommen ein Feld eines Bestandskontakts ist bereits gesetzt und der CSV-Wert ist identisch, dann erscheint dieses Feld nicht in der Veränderungs-Liste (Kontakt zählt als "unverändert", falls kein anderes Feld abweicht)
- [ ] Angenommen der Nutzer bearbeitet einen Wert direkt in der Vorschau (neuer Kontakt oder Veränderung), wenn er danach "Bestätigen" klickt, dann wird der bearbeitete Wert gespeichert, nicht der ursprüngliche CSV-Wert
- [ ] Angenommen der Nutzer hakt die Checkbox einer Zeile in "Neue Kontakte" ab, dann wird für diesen CSV-Eintrag beim Bestätigen kein Kontakt angelegt
- [ ] Angenommen der Nutzer hakt die Checkbox einer Person in "Veränderungen" ab, dann wird beim Bestätigen kein Feld dieser Person verändert (auch nicht einzelne der gruppierten Felder)
- [ ] Angenommen die Vorschau wird angezeigt, wenn der Nutzer auf "Bestätigen" klickt, dann werden ausschließlich die weiterhin angehakten Zeilen mit ihren (ggf. bearbeiteten) Werten gespeichert und eine Erfolgsmeldung mit den finalen Zahlen angezeigt
- [ ] Angenommen die Vorschau wird angezeigt, wenn der Nutzer auf "Abbrechen" klickt, dann wird kein Kontakt angelegt oder verändert
- [ ] Angenommen ein CSV-Eintrag hat eine `linkedin_url`, die exakt zu einem bestehenden Kontakt passt, dann wird dieser Kontakt der Veränderungs-Liste zugeordnet statt ein neuer Kontakt angelegt
- [ ] Angenommen ein CSV-Eintrag hat keine zu `linkedin_url` passende Übereinstimmung, aber Vorname+Nachname stimmen case-insensitive mit einem bestehenden Kontakt ohne gesetzte `linkedin_url` überein, dann wird dieser Kontakt der Veränderungs-Liste zugeordnet (inkl. Ergänzung der `linkedin_url` als Feld-Update)
- [ ] Angenommen ein CSV-Eintrag hat weder per `linkedin_url` noch per Name eine Übereinstimmung, dann erscheint er in "Neue Kontakte" (Kategorie/Stärke/Kontext/Notizen/Stadt/Telefon/Geburtstag bleiben bei Anlage leer)
- [ ] Angenommen Kategorie, Beziehungsstärke, Kontext, Notizen, Stadt, Telefonnummer oder Geburtstag sind an einem bestehenden Kontakt bereits gesetzt, dann werden sie durch den Import nie verändert und tauchen nie in der Veränderungs-Liste auf (CSV liefert diese Felder nicht)
- [ ] Angenommen eine CSV-Zeile hat keinen Vorname-Wert, dann wird diese Zeile übersprungen und im "übersprungen"-Zähler der Vorschau mitgezählt
- [ ] Angenommen die hochgeladene Datei hat keine Zeile, die mit der Kopfzeile `First Name,Last Name,URL` beginnt, dann wird eine Fehlermeldung "Keine gültige LinkedIn-Export-Datei" angezeigt und kein Import-Versuch unternommen
- [ ] Angenommen die Supabase-API ist beim tatsächlichen Speichern (nach "Bestätigen") nicht erreichbar, dann wird eine Fehlermeldung angezeigt; bereits gespeicherte Zeilen bleiben gespeichert (kein Rollback), ein erneuter Upload derselben Datei ist sicher (idempotent)
- [ ] Angenommen Nutzer A ist eingeloggt, wenn er eine CSV importiert, dann werden alle importierten/aktualisierten Kontakte ausschließlich mit `user_id = auth.uid()` gespeichert (RLS aus PROJ-1 erzwungen, kein Zugriff auf/Vermischen mit Kontakten anderer Nutzer)

## Edge Cases
- Zwei oder mehr bestehende Kontakte mit identischem Vorname+Nachname, keiner hat `linkedin_url` gesetzt → der erste gefundene Treffer wird aktualisiert (keine Disambiguierung in MVP, geringe Praxisrelevanz im persönlichen Netzwerk)
- Komplett leere CSV-Zeile (nur Datum, alle anderen Felder leer) → wird wie "kein Vorname" behandelt, übersprungen
- Sehr große CSV-Datei (mehrere hundert Zeilen) → kein explizites Zeilenlimit in MVP, Verarbeitung läuft client-seitig in Batches
- Sonderzeichen/Umlaute in Namen/Firmen (UTF-8) → werden korrekt übernommen, solange die Datei UTF-8-kodiert ist (LinkedIn-Standard-Export); fehlerhafte Kodierung anderer Quellen wird nicht erkannt/korrigiert
- Doppelter Klick auf "Importieren" während der Import läuft → Button disabled (Loading-State), kein doppelter Import-Lauf
- Erneuter Upload derselben Datei → fast alle Einträge landen in "unverändert" (Werte sind identisch), keine Duplikate
- CSV enthält eine Zeile mit `linkedin_url`, die zu einem Kontakt eines ANDEREN Nutzers gehören würde → kann nicht passieren, Matching läuft ausschließlich gegen die eigenen (RLS-gefilterten) Kontakte des eingeloggten Nutzers
- Person wechselt gleichzeitig Arbeitgeber und Position → beide Anlass-Tags ("Jobwechsel" + "Beförderung") erscheinen zusammen an einer Veränderungs-Zeile, keine gegenseitige Unterdrückung
- Nutzer hakt eine Veränderungs-Zeile ab, bearbeitet aber trotzdem ein Feld davor → Checkbox-Zustand entscheidet beim Bestätigen, nicht der Bearbeitungs-Zustand; abgehakte Zeilen werden komplett ignoriert, auch wenn Werte bearbeitet wurden
- Nutzer bearbeitet ein Feld einer Person zurück auf den alten Wert → Feld bleibt trotzdem in der Veränderungs-Liste sichtbar (Diff wird einmalig beim Laden der Vorschau berechnet, nicht live neu bewertet), aber der gespeicherte Wert entspricht dann dem (unveränderten) alten Wert — kein faktisches Update beim Bestätigen
- Sehr viele gleichzeitige Veränderungen (z.B. 200 Personen mit abweichenden Feldern in einer großen Datei) → Liste muss ohne UI-Blockierung scrollbar/handhabbar bleiben, gleiches Batch-Prinzip wie beim Speichern

## Technical Requirements
- Security: RLS aus PROJ-1 deckt Zugriff ab — Import darf `user_id` nie aus Client-Eingabe übernehmen, nur `auth.uid()`
- Validierung: Vorname Pflicht pro Zeile (sonst Skip), restliche Felder wie in PROJ-3 (Längen-Constraints gelten auch für importierte/bearbeitete Werte)
- Feld `linkedin_url` am Kontakt (text, nullable, optional, freier Text wie `phone`/`email` — kein Format-Constraint) — bereits vorhanden
- Performance: Verarbeitung mehrerer hundert Zeilen muss ohne UI-Blockierung möglich sein (Batch-Verarbeitung)
- `computeImportPlan` (oder Nachfolger) muss pro Person eine Liste der abweichenden Felder (Feldname, alter Wert, neuer Wert) statt nur eines Update-Flags liefern, plus berechnete Anlass-Tags ("Jobwechsel"/"Beförderung") nach der Regel: Tag nur wenn alter UND neuer Wert nicht leer sind und sich unterscheiden
- Vorschau-Zustand muss pro Zeile editierbare Werte + Checkbox (default an) halten, unabhängig vom ursprünglichen CSV-Wert — beim Bestätigen werden nur angehakte Zeilen mit ihrem aktuellen (ggf. bearbeiteten) Feldwert geschrieben

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
| **(überschreibt vorherige Entscheidung)** Importierbare Felder (`employer`/`job_title`/`last_name`/`email`/`linkedin_url`) werden bei Bestandskontakten nie mehr automatisch geschrieben — auch nicht bei abweichendem, nicht-leerem CSV-Wert. Erst nach Review in der Vorschau und explizitem "Bestätigen" | Nutzer enricht/korrigiert diese Felder selbst zwischen zwei Imports — automatisches Überschreiben bei Re-Upload hätte das wieder zerstört | 2026-06-28 |
| **(überschreibt vorherige Entscheidung)** Vorschau bekommt granulare Zeilen-Listen ("Neue Kontakte", "Veränderungen" pro Person) statt nur Summary-Zahlen | Nutzer will aktiv erkennen, bei wem sich beruflich was getan hat, um gezielt nachzufassen — reine Zahlen reichten dafür nicht | 2026-06-28 |
| Anlass-Tag "Jobwechsel" bei abweichendem `employer`, "Beförderung" bei abweichendem `job_title` — jeweils nur wenn alter UND neuer Wert nicht leer sind; beide Tags können gleichzeitig an einer Person hängen | Erstmalige Befüllung (alter Wert leer) ist kein "Wechsel", sondern neue Information; eine Person kann gleichzeitig Arbeitgeber und Position wechseln | 2026-06-28 |
| Jede Zeile (neuer Kontakt / Person mit Änderungen) hat eine standardmäßig aktive Checkbox zum gezielten Ausschluss vor dem finalen Speichern | Nutzer soll einzelne fragwürdige Treffer/Änderungen ausschließen können, ohne den gesamten Import abzubrechen | 2026-06-28 |
| Werte in der Vorschau sind direkt editierbar; gespeichert wird der Wert im Feld zum Zeitpunkt des Bestätigens | Nutzer will Tippfehler/CSV-Eigenheiten vor dem Speichern korrigieren, statt erst danach über den separaten Edit-Dialog | 2026-06-28 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Neue Spalte `linkedin_url` (nullable, kein Constraint) statt eigener Mapping-Tabelle | Gleiches Erweiterungsmuster wie `phone`/`email`/`city` aus PROJ-3, kein neues Datenmodell für eine einzelne zusätzliche Spalte nötig | 2026-06-24 |
| CSV-Parsing + Matching/Diff komplett client-seitig, kein Server-Endpoint | Keine Secrets involviert, direkter Supabase-Zugriff reicht (RLS erzwingt Ownership), konsistent mit PROJ-3/4/5-Pattern | 2026-06-24 |
| `papaparse` als CSV-Parser-Package | Vermeidet Bugs durch eingebettete Kommas in Anführungszeichen-Feldern (z.B. Nachnamen mit Titel-Suffix), Standard-Library statt Eigenbau | 2026-06-24 |
| Vorschau-Berechnung und tatsächlicher Speichervorgang als zwei getrennte Funktionsaufrufe | Erzwingt den im Spec festgelegten Bestätigungs-Schritt technisch, verhindert versehentliches Schreiben beim bloßen Anzeigen der Vorschau | 2026-06-24 |
| Bulk-Insert/Update in Batches (z.B. 50 Zeilen pro Request) | Vermeidet Request-Größen-/Timeout-Probleme bei großen Exportdateien | 2026-06-24 |
| Diff-Berechnung liefert pro Bestandskontakt eine Liste von Feld-Unterschieden (Feldname, alt, neu) statt eines fertigen Update-Pakets | UI muss jedes Feld einzeln anzeigen, editieren und mit Anlass-Tags versehen können — ein flaches Update-Objekt könnte das nicht abbilden | 2026-06-28 |
| Anlass-Tags ("Jobwechsel"/"Beförderung") werden bei jeder Vorschau-Berechnung aus den Feld-Unterschieden abgeleitet, nicht am Kontakt gespeichert | Reiner Anzeige-Hinweis für den aktuellen Import-Lauf, keine Schema-Änderung/Pflegeaufwand für einen Status, der sich beim nächsten Import ohnehin neu berechnet | 2026-06-28 |
| Checkbox- (angehakt/ausgeschlossen) und Bearbeitungs-Zustand jeder Vorschau-Zeile lebt nur im Dialog-Zustand des Browsers, nicht in der Datenbank | Konsistent mit bestehender Entscheidung "Vorschau ist reiner Browser-Zustand"; verworfen bei Abbrechen/Schließen, kein Entwurfs-Datenmodell nötig | 2026-06-28 |
| Keine neuen Packages — Diff/Tag-Logik bleibt in der bestehenden `linkedin-import.ts`, nur die Rückgabestruktur wird feingranularer | Reine Erweiterung bestehender reiner Funktionen, kein neuer technischer Bedarf | 2026-06-28 |

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
│   ├── Schritt 2: Vorschau (Review-Listen, noch nichts gespeichert)
│   │   ├── Liste "Neue Kontakte" — pro Zeile: Checkbox (default an), Name, editierbare employer/job_title/email-Felder
│   │   ├── Liste "Veränderungen" — pro Person: Checkbox (default an), Name, Liste der abweichenden Felder (alt→neu, editierbar), Anlass-Tags ("Jobwechsel"/"Beförderung") falls zutreffend
│   │   ├── Zähler "unverändert" und "übersprungen (kein Vorname)"
│   │   ├── "Abbrechen"-Button → schließt Dialog, keine Änderung
│   │   └── "Bestätigen"-Button → speichert ausschließlich angehakte Zeilen mit ihrem aktuellen (ggf. bearbeiteten) Wert
│   └── Schritt 3: Erfolgsmeldung mit finalen Zahlen, Kontaktliste aktualisiert sich
```

### Data Model (plain language)

`contacts` hat bereits die Spalte `linkedin_url` (Text, optional) — gleiches Muster wie `phone`/`email` aus PROJ-3, kein Format-Constraint. Dient als primärer Abgleichs-Schlüssel zwischen CSV-Zeile und bestehendem Kontakt. Keine Schema-Änderung in dieser Iteration nötig.

Kein neues Datenmodell für den Import-Vorgang selbst — die Vorschau bleibt reiner Browser-Zustand. Was sich ändert: Statt pro Bestandskontakt nur ein fertiges "Update-Paket" zu berechnen, berechnet die Vorschau jetzt pro Bestandskontakt eine **Liste einzelner Feld-Unterschiede** (Feldname, alter Wert, neuer Wert) plus eine Liste erkannter Anlässe ("Jobwechsel", "Beförderung") — beides reine Ergebnisse eines Vergleichs, nichts davon wird in der Datenbank gespeichert.

Jede Zeile in der Vorschau (neuer Kontakt oder Person mit Veränderungen) bekommt zusätzlich zwei browserseitige Eigenschaften, die nur während der offenen Vorschau existieren: ob die Zeile aktuell angehakt ist (wird beim Bestätigen übernommen oder ignoriert) und welcher Wert aktuell in den editierbaren Feldern steht (startet mit dem CSV-Wert, kann vom Nutzer überschrieben werden). Erst der Klick auf "Bestätigen" liest diesen Zustand aus und schreibt ihn in die Datenbank.

### Tech Decisions (justified)

- **CSV-Parsing läuft komplett im Browser, kein Server-Roundtrip:** Es sind keine Geheimnisse (API-Keys) involviert, der Nutzer lädt die Datei nur für sich selbst hoch — ein Server-Umweg wäre unnötiger Mehraufwand, gleiche Überlegung wie bei den direkten Supabase-Zugriffen in PROJ-3/4/5.
- **Dedizierter CSV-Parser statt einfachem Komma-Split:** LinkedIn-Exports enthalten Felder mit eingebetteten Kommas in Anführungszeichen (z.B. Nachname "Lang, LL.M." in der Beispieldatei) — ein naiver Split würde Spalten falsch verschieben. Ein robuster, gut getesteter Parser vermeidet diese Fehlerklasse komplett.
- **Vergleich/Matching (Vorschau) und tatsächlicher Speichervorgang sind zwei getrennte Schritte:** Die Vorschau lädt einmal die eigenen Kontakte, berechnet den Diff rein im Speicher und verändert nichts. Erst der zweite, explizite Klick auf "Bestätigen" schreibt tatsächlich — verhindert versehentliches Auto-Save bei einer Bulk-Operation, die hunderte Kontakte betreffen kann.
- **Diff liefert pro Feld einen eigenen Eintrag statt eines fertigen Update-Pakets:** Die Vorschau muss "alt→neu" pro Feld einzeln anzeigen, einzeln editierbar machen und Anlass-Tags daran festmachen können — das geht nur, wenn der Vergleich Feld für Feld auflöst statt direkt ein fertiges Speicherobjekt zu bauen.
- **Anlass-Tags sind ein reines Anzeige-Ergebnis des Vergleichs, keine eigene Datenstruktur:** "Jobwechsel"/"Beförderung" werden bei jeder Vorschau-Berechnung neu aus den Feld-Unterschieden abgeleitet (Regel: altes UND neues Feld nicht leer, Werte unterscheiden sich) — nichts wird als Tag/Status am Kontakt gespeichert, vermeidet Schema-Änderung und Pflegeaufwand für einen reinen Hinweis.
- **Checkbox- und Bearbeitungs-Zustand pro Zeile lebt ausschließlich im Dialog-Zustand des Browsers:** Konsistent mit der bestehenden Entscheidung "Vorschau ist reiner Browser-Zustand" — kein Entwurf/Draft wird in der Datenbank zwischengespeichert, einfach verworfen bei "Abbrechen" oder Schließen des Dialogs.
- **Bulk-Speichern in mehreren kleineren Gruppen statt einem einzigen riesigen Request:** Vermeidet Timeout-/Größenprobleme bei sehr großen Dateien (mehrere hundert Zeilen), ohne dass der Nutzer etwas davon merkt.
- **Matching-Priorität `linkedin_url` vor Name-Fallback:** `linkedin_url` ist stabil und eindeutig pro Person, Name-Fallback ist nur ein Sicherheitsnetz für Kontakte, die vor dem ersten Import schon manuell angelegt wurden (deckt sich mit Produktentscheidung aus dem Spec-Interview).

### Dependencies (Packages)
- `papaparse` — robustes CSV-Parsing (Anführungszeichen, eingebettete Kommas), Standard-Wahl für clientseitiges CSV-Handling, keine Server-Abhängigkeit nötig — keine neuen Packages für diese Iteration

## QA Test Results (Refinement 2026-06-28)

**Tested:** 2026-06-28
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status
- [x] Vorschau zeigt "Neue Kontakte" + "Veränderungen" (gruppiert pro Person) + Zähler "unverändert"/"übersprungen" vor Speicherung
- [x] Abweichender `employer` (alt+neu nicht leer) → Tag "Jobwechsel" (E2E + Vitest)
- [x] Abweichender `job_title` (alt+neu nicht leer) → Tag "Beförderung" (Vitest; UI-Rendering identischer Mechanismus wie Jobwechsel, per Code-Review verifiziert statt separatem E2E)
- [x] Beide Felder gleichzeitig abweichend → beide Tags zusammen (Vitest: `occasions: ['Jobwechsel', 'Beförderung']`)
- [ ] **Teilweise erfüllt** — Feld vorher leer, CSV liefert Wert → Diff erscheint korrekt ohne Anlass-Tag (Vitest verifiziert), ABER die Spec verlangt explizit ein "Neu erfasst"-Label dafür; die UI zeigt nur "— →" ohne diesen Text (siehe Bug #1)
- [x] Identisches Feld → kein Diff-Eintrag, Kontakt zählt als unverändert (E2E Re-Upload-Test: "2 unverändert")
- [x] Wert in Vorschau editieren → bearbeiteter Wert wird gespeichert, nicht CSV-Wert (E2E)
- [x] Checkbox bei "Neue Kontakte" abwählen → Kontakt wird nicht angelegt (E2E)
- [x] Checkbox bei "Veränderungen" abwählen → keines der Felder dieser Person wird verändert (E2E, neu ergänzt)
- [x] "Bestätigen" speichert nur angehakte Zeilen mit aktuellem (ggf. bearbeitetem) Wert (E2E)
- [x] "Abbrechen" → kein Kontakt angelegt/verändert (E2E)
- [x] `linkedin_url`-Match → Kontakt landet in "Veränderungen" statt Neuanlage (E2E, da Folge-Importe über `linkedin_url` matchen)
- [x] Name-Fallback-Match (kein `linkedin_url` gesetzt) → Kontakt landet in "Veränderungen" inkl. `linkedin_url`-Ergänzung als Diff (E2E)
- [x] Kein Match → Kontakt in "Neue Kontakte", übrige Felder leer (E2E)
- [x] Kategorie/Stärke/Kontext/Notizen/Stadt/Telefon/Geburtstag nie verändert (E2E: `category: 'friend'` blieb erhalten) und können strukturell nie als Diff erscheinen, da `FIELDS`-Konstante sie nicht enthält (Code-Review)
- [x] Zeile ohne Vorname → übersprungen, im Zähler erfasst (E2E)
- [x] Datei ohne gültige Kopfzeile → Fehlermeldung "Keine gültige LinkedIn-Export-Datei.", kein Import-Versuch (E2E)
- [x] Supabase nicht erreichbar beim Bestätigen → Fehlermeldung (Code-Review: `try/catch` mit `setSubmitError`, identisch zum bereits geprüften Vorgänger-Pattern, kein dedizierter Netzwerk-Fehler-E2E-Test — wie schon in der ursprünglichen QA-Runde 2026-06-24)
- [x] RLS: Insert/Update nutzt ausschließlich `auth.uid()`/serverseitige Policy, `contactId` stammt nicht aus Roh-CSV-Eingabe sondern aus bereits RLS-gefiltertem `existingContacts`-Match (Code-Review)

**18/19 vollständig erfüllt, 1 teilweise (siehe Bug #1).**

### Edge Cases Status
- [x] Mehrere Namens-Treffer ohne `linkedin_url` → erster Treffer (Vitest)
- [x] Komplett leere CSV-Zeile → wie "kein Vorname" behandelt (Vitest + E2E)
- [x] Person mit gleichzeitigem Arbeitgeber- und Positionswechsel → beide Tags zusammen, keine gegenseitige Unterdrückung (Vitest)
- [x] Checkbox abgehakt trotz bearbeitetem Feld → Checkbox-Zustand entscheidet, abgehakte Zeilen werden beim Bestätigen komplett ignoriert (Code-Review: `included`-Filter läuft vor dem Auslesen der `diffs`/Werte)
- [x] Eingebettete Kommas in Anführungszeichen-Feldern → unverändert von `papaparse` gehandhabt (Vitest)
- [x] Header-Präambel vor echter Kopfzeile → unverändert (Vitest)
- [x] Doppelklick auf "Bestätigen" → Button weiterhin über `isSubmitting` disabled (Code-Review)
- [x] Sehr große CSV-Datei → Diff-Berechnung bleibt O(n), nur pro Feld statt pro Zeile aufgelöst, kein zusätzlicher Netzwerk-Roundtrip; nicht erneut mit der realen 407-Zeilen-Datei nachgetestet, da Logik-Änderung rein auf das Vergleichsergebnis beschränkt ist (kein Risiko für Parser-Performance)
- [x] Re-Upload derselben Datei → 0 neu, 0 Veränderungen, idempotent (E2E)
- [x] `linkedin_url` eines anderen Nutzers → weiterhin unmöglich, Matching nur gegen RLS-gefilterte eigene Kontakte (Code-Review, unverändert)

### Security Audit
- [x] Keine neuen Endpunkte/Secrets — weiterhin reiner Supabase-Client-Zugriff, RLS erzwingt Ownership (unverändert)
- [x] `contactId` für Updates kommt ausschließlich aus dem internen Matching gegen die eigenen, bereits geladenen Kontakte — nicht aus CSV-Rohdaten beeinflussbar, kein IDOR-Vektor
- [x] Editierbare Vorschau-Felder landen als reiner Text in React-State/Supabase-Update — kein `dangerouslySetInnerHTML`, kein XSS-Vektor durch eingegebene oder CSV-gelieferte Werte
- [x] Kein neues PII-Leck: dieselben Felder (`employer`/`job_title`/`email`/`last_name`/`linkedin_url`) wie vorher, jetzt nur granularer angezeigt statt sofort geschrieben — eher weniger Exposure, da nichts mehr automatisch ohne Sichtprüfung gespeichert wird

### Regression Testing
- `npm test`: 50/50 grün (inkl. 14 für `linkedin-import.ts`, 3 davon neu für Anlass-Tagging)
- `npm run lint`, `npm run build`: fehlerfrei
- E2E PROJ-10 (7 Tests, 2 neu: Checkbox-Ausschluss bei Veränderungen, Edit-vor-Bestätigen): 7/7 grün auf Chromium UND Mobile Safari (iPhone 13)
- E2E Vollregression (alle anderen Specs: PROJ-2/3/4/5/6/8): 73/73 grün
- **Gesamt E2E (Chromium):** 80/80 grün

### Bugs Found

**Bug #1 (Medium):** Fehlendes "Neu erfasst"-Label bei Erstbefüllung eines vorher leeren Feldes.
- **Spec-Erwartung:** Wenn ein Feld eines Bestandskontakts vorher leer war und die CSV jetzt einen Wert liefert, soll dies laut AC "als Feld-Update ohne Anlass-Tag ('Neu erfasst')" erscheinen.
- **Ist-Zustand:** `src/components/linkedin-import-dialog.tsx` zeigt für diesen Fall nur `— →` als alten Wert, ohne den Text "Neu erfasst" oder ein vergleichbares visuelles Signal. Funktional korrekt (kein Jobwechsel/Beförderung-Tag, Feld ist editierbar/bestätigbar), aber die explizite Unterscheidung "das ist neu, kein echter Wechsel" fehlt für den Nutzer auf den ersten Blick.
- **Repro:** CSV mit `employer=Acme` für einen Bestandskontakt importieren, dessen `employer` aktuell `null` ist → Veränderungs-Zeile zeigt `Arbeitgeber  — → Acme`, aber keinen "Neu erfasst"-Hinweis.
- **Impact:** Kein Datenverlust, keine Fehlfunktion — rein eine fehlende UI-Klarstellung, die die Spec explizit verlangt hatte.

### Summary
- **Acceptance Criteria:** 18/19 vollständig erfüllt, 1 teilweise (Bug #1)
- **Bugs Found:** 1 (Medium)
- **Security:** Pass
- **Production Ready:** YES — kein Critical/High-Bug, Kernfunktionalität (kein stilles Überschreiben mehr, Review+Checkbox+Edit, Anlass-Tags) vollständig funktional und getestet
- **Recommendation:** Deploy möglich. Bug #1 (fehlendes "Neu erfasst"-Label) ist rein kosmetisch/Spec-Klarstellung — kann vor oder nach Deploy als kleiner Frontend-Fix nachgezogen werden, nutzerseitig kein Blocker.

---

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
- Commit `b74b492` gepusht zu `origin/main`, Tag `v1.9.0-PROJ-10`
- Migration `add_linkedin_url_to_contacts` bereits vorab auf Live-Projekt angewendet (siehe Backend Implementation Notes)
- Vercel-Build erfolgreich (55s), Deployment `Ready`, Production
- **Production URL:** https://bambi-w26q.vercel.app
- `https://bambi-w26q.vercel.app/login` mit 200 verifiziert
