# PROJ-3: Kontakt anlegen & verwalten

## Status: Planned
**Created:** 2026-06-19
**Last Updated:** 2026-06-19

## Dependencies
- PROJ-1 (Supabase Infrastructure Setup) — `contacts`-Tabelle + RLS existieren bereits
- PROJ-2 (Auth Login) — Nutzer muss eingeloggt sein, `user_id = auth.uid()`

## User Stories
- Als Nutzer möchte ich einen neuen Kontakt mit nur dem Namen anlegen können, damit ich ihn in unter einer Minute erfassen kann, ohne sofort alle Details zu kennen
- Als Nutzer möchte ich beim Anlegen optional auch Kategorie, Beziehungsstärke, Kontext und Notizen direkt mit erfassen können, damit ich den Kontakt sofort vollständig einsortieren kann, wenn ich Zeit habe
- Als Nutzer möchte ich einen bestehenden Kontakt bearbeiten können, damit ich Informationen nachpflegen oder korrigieren kann
- Als Nutzer möchte ich einen Kontakt löschen können, damit ich Karteileichen oder Fehleinträge entfernen kann
- Als Nutzer möchte ich vor dem Löschen eine Bestätigung sehen, damit ich nicht versehentlich einen Kontakt samt Verlauf verliere

## Out of Scope
- Kein separates Quick-Add-Mini-Formular — es gibt nur EIN Formular (Erstellen + Bearbeiten), alle Felder sichtbar, nur Name Pflicht
- Kontaktliste mit Filtern, Suche, Sortierung, Kartenansicht — eigenes Feature PROJ-4, hier nur eine schlichte, unstylische Übergangsliste (Name + Bearbeiten/Löschen) als Trägerin für CRUD-Tests
- Interaktions-Log (Kontaktmomente protokollieren) — eigenes Feature PROJ-5
- Foto-Upload — eigenes Feature PROJ-7, `photo_url`-Feld existiert im Schema, bleibt hier ungenutzt/leer
- Eindeutigkeits-Prüfung auf Namen — Duplikate sind erlaubt, keine Warnung
- Bulk-Operationen (Mehrfachauswahl, Massenlöschung) — kein MVP-Bedarf
- Undo nach Löschen — Bestätigungsdialog reicht als Schutz, kein Soft-Delete/Wiederherstellen

## Acceptance Criteria

- [ ] Angenommen der Nutzer ist eingeloggt, wenn er das Formular nur mit Name ausfüllt und speichert, dann wird der Kontakt mit allen anderen Feldern leer/Default angelegt
- [ ] Angenommen der Nutzer ist eingeloggt, wenn er das Formular mit Name, Kategorie, Beziehungsstärke, Kontext und Notizen ausfüllt und speichert, dann werden alle Werte korrekt gespeichert
- [ ] Angenommen der Nutzer lässt das Namensfeld leer, wenn er speichern will, dann wird eine Validierungsfehlermeldung angezeigt und der Kontakt wird nicht angelegt
- [ ] Angenommen ein Kontakt wird ohne explizite Beziehungsstärke angelegt, wenn er gespeichert wird, dann bleibt das Follow-up-Intervall leer/null (kein automatischer Default ohne gewählte Stärke)
- [ ] Angenommen eine Beziehungsstärke wird gewählt (Kern/Mittel/Locker), wenn der Kontakt gespeichert wird, dann wird `followup_interval_days` automatisch auf 14/30/90 gesetzt, sofern der Nutzer das Intervall nicht manuell überschrieben hat
- [ ] Angenommen ein Kontakt existiert, wenn der Nutzer ihn in der Übergangsliste anklickt/auf "Bearbeiten" klickt, dann öffnet sich das Formular vorausgefüllt mit den aktuellen Werten
- [ ] Angenommen ein Kontakt wird bearbeitet und gespeichert, wenn die Änderung erfolgreich ist, dann werden die neuen Werte sofort in der Liste sichtbar
- [ ] Angenommen ein Kontakt existiert, wenn der Nutzer auf "Löschen" klickt, dann erscheint ein Bestätigungsdialog bevor der Kontakt entfernt wird
- [ ] Angenommen der Nutzer bestätigt das Löschen, wenn der Kontakt entfernt wird, dann werden auch alle zugehörigen Interactions automatisch mit gelöscht (Cascade, bereits in PROJ-1 angelegt)
- [ ] Angenommen noch kein Kontakt existiert, wenn der Nutzer die Seite aufruft, dann wird ein Empty-State mit Hinweis und "Kontakt hinzufügen"-Button angezeigt
- [ ] Angenommen die Supabase-API ist beim Speichern nicht erreichbar, wenn der Nutzer das Formular abschickt, dann wird eine Fehlermeldung angezeigt und die Eingabe bleibt im Formular erhalten
- [ ] Angenommen Nutzer A ist eingeloggt, wenn er versucht auf einen Kontakt von Nutzer B zuzugreifen, dann liefert die Datenbank keine Zeile zurück (RLS bereits in PROJ-1 erzwungen)

## Edge Cases
- Zwei Kontakte mit identischem Namen → erlaubt, keine Warnung
- Nutzer ändert Beziehungsstärke nachträglich → `followup_interval_days` wird nur automatisch neu gesetzt, wenn der Nutzer das Intervall vorher nicht manuell überschrieben hat (sonst bleibt manueller Wert erhalten)
- Sehr langer Name/Notiz-Text → Name max. 200 Zeichen, Notizen max. 2000 Zeichen, Validierungsfehler bei Überschreitung
- Löschen eines Kontakts mit bereits protokollierten Interactions (sobald PROJ-5 existiert) → Cascade-Delete entfernt diese mit, Bestätigungsdialog warnt nicht explizit davor (Out of Scope: detaillierte Warnung über Anzahl betroffener Interactions)
- Doppelter Klick auf "Speichern" während Request läuft → Button disabled (Loading-State), kein doppelter Insert
- Whitespace-only Name (nur Leerzeichen) → wird wie leeres Feld behandelt, Validierungsfehler

## Technical Requirements
- Security: RLS bereits aktiv seit PROJ-1 — kein zusätzlicher App-seitiger Check nötig, aber Frontend darf nie eine `user_id` aus Client-Eingabe übernehmen, immer `auth.uid()` serverseitig/durch RLS erzwingen lassen
- Validierung: Name Pflichtfeld, 1–200 Zeichen (getrimmt); Notizen optional, max. 2000 Zeichen; Kontext optional, max. 500 Zeichen

## Open Questions
_Keine offenen Fragen — siehe Decision Log._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Ein Formular statt Quick-Add + Vollprofil getrennt | Nutzer wollte mehrere Felder sichtbar, aber nur Name Pflicht — ein Formular deckt beide Anwendungsfälle ab ohne UI-Verdopplung | 2026-06-19 |
| Formular als Dialog/Sheet statt eigene Seite | Schnellerer Workflow ohne Seitenwechsel, passt zum PRD-Ziel "Quick-Add < 1 Minute" | 2026-06-19 |
| PROJ-3 deckt volles CRUD ab (inkl. Edit/Delete), nicht nur Create | Klare Trennung: PROJ-3 = Datenoperationen, PROJ-4 = Browsing-/Filter-UI | 2026-06-19 |
| Schlichte Übergangsliste mitgebaut, da PROJ-4 noch nicht existiert | PROJ-3 braucht einen UI-Zugriffspunkt für Edit/Delete zum Testen — PROJ-4 ersetzt/erweitert sie später um Design/Filter | 2026-06-19 |
| Follow-up-Intervall-Defaults: Kern=14, Mittel=30, Locker=90 Tage | Gängige Heuristik für Beziehungspflege-Frequenz, pro Kontakt manuell überschreibbar | 2026-06-19 |
| Namens-Duplikate erlaubt, keine Eindeutigkeits-Prüfung | Reale Netzwerke haben oft gleiche Vornamen, Unterscheidung über Kontext/Kategorie statt technischem Constraint | 2026-06-19 |
| Kein Undo nach Löschen, nur Bestätigungsdialog | Reicht als Schutz vor Versehen, Soft-Delete/Wiederherstellen kein MVP-Bedarf | 2026-06-19 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| _Example: localStorage over Supabase_ | _No user accounts needed; data is device-local_ | YYYY-MM-DD |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
