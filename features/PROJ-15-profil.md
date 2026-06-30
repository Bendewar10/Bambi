# PROJ-15: Profil (Umbenennung Projekte → Profil + Karriere-Stats-Header)

## Status: Planned
**Created:** 2026-06-30
**Last Updated:** 2026-06-30

## Dependencies
- PROJ-12 (Projekte/Cases) — die umzubenennende Funktionalität
- PROJ-3 (Kontakt anlegen & verwalten) — Datenquelle für "Kontakte gesamt"
- PROJ-6 (Follow-up Dashboard) — `next_followup_at`-Semantik für "Fällige Follow-ups"

## User Stories
- Als MBB-Berater möchte ich meine Cases unter einem "Profil"-Nav-Punkt statt unter "Projekte" finden, damit die App meine Case-Historie als Teil meiner persönlichen Karriere abbildet, nicht nur als Engagement-Tracking
- Als Berater möchte ich auf einen Blick sehen, wie groß mein Netzwerk und wie viele Follow-ups gerade fällig sind, wenn ich mein Profil öffne, damit ich sofort ein Gefühl für den Stand meines Netzwerks bekomme
- Als Berater möchte ich sehen, wie viele einzigartige Personen ich über alle meine Cases hinweg kennengelernt habe, damit der Wert meines beruflichen Netzwerks sichtbar wird

## Out of Scope
- Redirect von alten `/projects`-URLs — Solo-User, Pre-Launch, kein externer Backlink-Bedarf (bewusst weggelassen, siehe Decision Log)
- Visuelles Redesign der Case-Liste zu einer echten chronologischen Timeline — bestehendes Karten-Grid mit Aktiv/Beendet-Tabs bleibt unverändert
- Umbenennung der zugrundeliegenden Komponenten-/Lib-Dateien (`project-list.tsx`, `project-card.tsx`, `project-detail.tsx`, `src/lib/projects.ts`) — beschreiben weiterhin die Datenentität, nicht das Nav-Label
- Neue Stats über die genannten 3 hinaus (z. B. "Aktive Cases"-Zähler) — bewusst auf 3 Kennzahlen begrenzt, siehe Decision Log
- Account-/Settings-Funktionalität (Name ändern, Präferenzen, AI-Report-Einstellungen) — kein Account-Profil, reines Karriere-Profil; eigenes Feature falls später gewünscht
- Neue Tabellen, neue RLS-Policies, neue CRUD-Endpunkte — reine Umbenennung + lesende Aggregations-Queries auf bestehende Tabellen

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen der Nutzer ist eingeloggt, wenn er die Navigation betrachtet, dann zeigt der Nav-Punkt "Profil" statt "Projekte" und verlinkt auf `/profil`
- [ ] Angenommen der Nutzer öffnet `/profil`, dann wird die bestehende Case-Liste (Aktiv/Beendet-Tabs, Karten-Grid, "Projekt anlegen") wie bisher unter PROJ-12 angezeigt
- [ ] Angenommen der Nutzer öffnet eine Projekt-Detailseite über die Karte, dann lautet die URL `/profil/[id]` und zeigt Beteiligte + Projekt-Log wie bisher unter PROJ-12
- [ ] Angenommen ein Projekt wird gelöscht, dann navigiert der Nutzer zurück zu `/profil` (nicht `/projects`)
- [ ] Angenommen der Nutzer hat N Kontakte, wenn er `/profil` öffnet, dann zeigt die Stat "Kontakte gesamt" die Zahl N
- [ ] Angenommen der Nutzer hat 0 Kontakte, wenn er `/profil` öffnet, dann zeigt "Kontakte gesamt" `0` ohne Fehler
- [ ] Angenommen ein Kontakt hat `next_followup_at` heute oder in der Vergangenheit, wenn der Nutzer `/profil` öffnet, dann wird dieser Kontakt in "Fällige Follow-ups" mitgezählt
- [ ] Angenommen ein Kontakt hat `next_followup_at` in der Zukunft oder `null`, wenn der Nutzer `/profil` öffnet, dann wird dieser Kontakt NICHT in "Fällige Follow-ups" mitgezählt
- [ ] Angenommen derselbe Kontakt ist Beteiligter in mehreren Projekten des Nutzers, wenn der Nutzer `/profil` öffnet, dann wird dieser Kontakt in "Beteiligte gesamt über alle Cases" nur einmal gezählt
- [ ] Angenommen der Nutzer hat keine Projekte oder keine Beteiligten, wenn er `/profil` öffnet, dann zeigt "Beteiligte gesamt über alle Cases" `0` ohne Fehler
- [ ] Angenommen die Stats-Queries laufen noch, wenn der Nutzer `/profil` öffnet, dann zeigen die Stat-Kacheln einen neutralen Platzhalter statt fälschlich `0`
- [ ] Angenommen Nutzer A ist eingeloggt, wenn die Stats berechnet werden, dann fließen ausschließlich Daten von Nutzer A ein (RLS-geschützt, kein Cross-User-Leak)

## Edge Cases
- Stats-Header-Queries scheitern (Netzwerkfehler) → Stats-Kacheln zeigen Fehler-/Platzhalter-Zustand, blockieren aber nicht das Laden der Case-Liste darunter (unabhängiges Laden)
- Case-Liste lädt langsam/scheitert → Stats-Header lädt unabhängig weiter, keine gegenseitige Blockade
- Kontakt mit `next_followup_at` exakt heute (Datum ohne Uhrzeit-Komponente) → zählt als fällig
- Sehr großes Netzwerk (z. B. 500+ Kontakte/Beteiligte) → Stats nutzen `count`-Queries bzw. client-seitiges Dedupe einer schlanken Spalten-Selektion, keine Performance-Sorge für Solo-User-Datenmengen
- Alte `/projects`-URL wird aufgerufen (z. B. Browser-Verlauf) → führt zu 404 (Next.js Standardverhalten), kein Redirect, bewusst akzeptiert

## Technical Requirements (optional)
- Security: Alle 3 Stats-Queries laufen über bestehende RLS-Policies (`auth.uid() = user_id`) auf `contacts` und `project_participants` — keine neuen Policies nötig
- Keine neuen Datenbank-Tabellen, keine Migration

## Open Questions
_Keine offenen Fragen — vollständig im Rahmen einer vorgelagerten Plan-Phase mit dem Nutzer abgestimmt (siehe Decision Log)._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Nav-Punkt "Projekte" wird zu "Profil", Case-Liste wandert komplett darunter (kein zusätzlicher separater Nav-Punkt) | PRD framt das Netzwerk/die Case-Historie explizit als "Karriere- und Exit-Kapital" — ein Profil-Konzept passt besser zur Zielgruppe (MBB-Berater) als ein reines "Projekte"-Engagement-Tracking | 2026-06-30 |
| Bestehendes Karten-Grid mit Aktiv/Beendet-Tabs bleibt unverändert, kein Timeline-Redesign | Geringeres Risiko, bestehende getestete Komponenten (PROJ-12) bleiben unangetastet; visuelles Storytelling ist nicht der Kern dieses Features | 2026-06-30 |
| Genau 3 Stats: Kontakte gesamt, Fällige Follow-ups, Beteiligte gesamt über alle Cases ("Aktive Cases"-Zähler bewusst weggelassen) | Nutzer hat im Rahmen der Konzept-Abstimmung explizit diese 3 gewählt; Aktive-Cases-Zahl ist über die Tabs ohnehin sichtbar, redundant als zusätzliche Stat | 2026-06-30 |
| Kein Redirect von `/projects` auf `/profil` | Solo-User, Pre-Launch-App ohne externe Backlinks/Bookmarks — Redirect wäre unnötiger Aufwand für aktuell null echte Nutzer-Auswirkung | 2026-06-30 |
| Komponenten-/Lib-Dateinamen (`project-*.tsx`, `src/lib/projects.ts`) bleiben unverändert | Beschreiben die Datenentität ("Projekt"/Case in der DB), nicht das Nav-Label; Umbenennung wäre reiner Diff-Lärm ohne funktionalen Nutzen | 2026-06-30 |
| Priorität P1 (MBB), nicht P0 | Erweitert ein bereits deploytes P0-Feature (PROJ-12) um UX-Framing + Stats, schließt keine MVP-Lücke | 2026-06-30 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
