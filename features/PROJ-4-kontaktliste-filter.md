# PROJ-4: Kontaktliste & Filter

## Status: Planned
**Created:** 2026-06-19
**Last Updated:** 2026-06-19

## Dependencies
- PROJ-3 (Kontakt anlegen & verwalten) — `contacts`-Tabelle, CRUD-Operationen und Übergangsliste existieren bereits

## User Stories
- Als Nutzer möchte ich alle meine Kontakte als Karten sehen, damit ich auf einen Blick Name, Kategorie, Beziehungsstärke und Follow-up-Status erkenne
- Als Nutzer möchte ich Kontakte nach Kategorie und Beziehungsstärke filtern können, damit ich z.B. nur Investoren oder nur Kernkontakte sehe
- Als Nutzer möchte ich Kontakte nach Namen durchsuchen können, damit ich einen bestimmten Kontakt schnell finde
- Als Nutzer möchte ich überfällige Follow-ups visuell hervorgehoben sehen, damit ich direkt erkenne, wer schon lange ansteht
- Als Nutzer möchte ich die Liste standardmäßig nach Follow-up-Dringlichkeit sortiert sehen, damit die wichtigsten Kontakte oben stehen

## Out of Scope
- Sortier-Auswahl durch den Nutzer (z.B. manuell nach Name/Datum umschalten) — fixe Standard-Sortierung nach Follow-up-Dringlichkeit für MVP, kein Sortier-UI
- Mehrfachauswahl/Bulk-Aktionen in der Liste — kein MVP-Bedarf
- Speichern von Filter-Einstellungen über Sessions hinweg — Filter resetten bei Page-Reload
- Paginierung/Infinite Scroll — bei aktuell erwarteter Kontaktanzahl (persönliches Netzwerk) reicht eine vollständige Liste ohne Pagination
- Eigene Detail-Seite pro Kontakt — Klick auf Karte öffnet weiterhin das Bearbeiten-Formular aus PROJ-3, keine separate Profilansicht
- Follow-up Dashboard / Tagesansicht mit Aktions-Buttons ("Kontaktiert") — eigenes Feature PROJ-6

## Acceptance Criteria

- [ ] Angenommen der Nutzer ist eingeloggt und hat Kontakte, wenn er die Startseite aufruft, dann sieht er alle eigenen Kontakte als Karten mit Name, Kategorie, Beziehungsstärke, letztem Kontakt und nächstem Follow-up
- [ ] Angenommen keine Filter sind aktiv, wenn die Liste lädt, dann sind die Karten nach `next_followup_at` aufsteigend sortiert (kein Follow-up-Datum = ans Ende)
- [ ] Angenommen ein Kontakt hat ein `next_followup_at` in der Vergangenheit, wenn die Liste angezeigt wird, dann ist diese Karte visuell als überfällig hervorgehoben (rot)
- [ ] Angenommen der Nutzer wählt eine Kategorie im Filter, wenn der Filter angewendet wird, dann zeigt die Liste nur Kontakte dieser Kategorie
- [ ] Angenommen der Nutzer wählt eine Beziehungsstärke im Filter, wenn der Filter angewendet wird, dann zeigt die Liste nur Kontakte dieser Stärke
- [ ] Angenommen Kategorie- UND Stärke-Filter sind gleichzeitig aktiv, wenn beide angewendet werden, dann zeigt die Liste nur Kontakte, die beide Kriterien erfüllen (UND-Verknüpfung)
- [ ] Angenommen der Nutzer tippt einen Suchbegriff ins Namensfeld, wenn die Eingabe erfolgt, dann filtert die Liste live auf Kontakte, deren Name den Suchbegriff enthält (case-insensitive)
- [ ] Angenommen Filter sind aktiv und liefern keine Treffer, wenn die Liste das erkennt, dann wird ein Hinweis angezeigt, dass keine Kontakte zu den Filtern passen
- [ ] Angenommen noch kein Kontakt existiert, wenn der Nutzer die Seite aufruft, dann wird der bestehende Empty-State mit "Kontakt hinzufügen"-Button angezeigt (aus PROJ-3 übernommen)
- [ ] Angenommen der Nutzer klickt auf eine Kontakt-Karte, wenn die Karte angeklickt wird, dann öffnet sich das Bearbeiten-Formular aus PROJ-3 vorausgefüllt

## Edge Cases
- Sehr lange Namen/Notizen in der Karte → Text wird abgeschnitten (Ellipsis), volle Werte nur im Bearbeiten-Formular sichtbar
- Kontakt ohne Kategorie/Stärke/Follow-up-Datum → entsprechende Badges/Infos werden auf der Karte einfach weggelassen, kein "leer"-Platzhalter
- Filter + Suche gleichzeitig aktiv, dann Kontakt gelöscht (aus PROJ-3) → Liste aktualisiert sich, gefilterte Ansicht bleibt mit den Filtern bestehen
- Groß-/Kleinschreibung bei Namenssuche → ignoriert (case-insensitive Vergleich)
- Whitespace-only Suchbegriff → wird wie leere Suche behandelt (kein Filter aktiv)

## Technical Requirements
- Security: Liste lädt ausschließlich Kontakte des eingeloggten Nutzers — RLS aus PROJ-1 erzwingt das bereits serverseitig, Frontend-Filter dürfen sich nicht darauf verlassen müssen, aber auch keine fremden Daten anfragen
- Performance: Filterung/Suche client-seitig auf bereits geladenen Kontakten (keine Server-Roundtrips pro Tastenanschlag), da keine Pagination und überschaubare Datenmenge

## Open Questions
_Keine offenen Fragen — siehe Decision Log._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Karten-Darstellung statt Tabelle | Mehr visueller Kontext pro Kontakt, passt zum "Beziehungspflege"-Charakter der App | 2026-06-19 |
| Filter: Kategorie + Stärke + Namenssuche, alle UND-verknüpft | Deckt Hauptanwendungsfälle ab ("alle Investoren", "alle Kernkontakte", "suche Max") ohne UI-Komplexität | 2026-06-19 |
| Standard-Sortierung: nach `next_followup_at`, kein Sortier-UI | Passt zum Kernzweck der App (wer steht als nächstes an), keine zusätzliche UI-Entscheidung für MVP nötig | 2026-06-19 |
| Überfällige Follow-ups rot markiert | Macht "fällige Kontakte" auf einen Blick sichtbar, unterstützt PRD-Erfolgsmetrik "fällige Kontakte sinkt auf 0" | 2026-06-19 |
| Liste ersetzt Startseite (`/`) komplett statt eigener Route | Einzige zentrale Ansicht aktuell, vermeidet unnötigen Klick — spätere Features (PROJ-6) bekommen ggf. eigene Navigation | 2026-06-19 |
| Klick auf Karte öffnet PROJ-3-Bearbeiten-Formular, keine eigene Detailseite | Vermeidet doppelte UI für dieselben Daten, Formular deckt bereits alle Felder ab | 2026-06-19 |
| Keine Pagination | Persönliches Netzwerk, überschaubare Kontaktanzahl erwartet, client-seitiges Filtern ausreichend performant | 2026-06-19 |

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
