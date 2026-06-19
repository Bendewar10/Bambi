# PROJ-4: Kontaktliste & Filter

## Status: In Progress
**Created:** 2026-06-19
**Last Updated:** 2026-06-19 (Frontend implementiert)

## Implementation Notes
- `src/lib/contacts.ts`: `Contact`-Interface um `last_contacted_at`/`next_followup_at` ergänzt (fehlten bisher, werden für Anzeige/Sortierung benötigt)
- `src/components/contact-card.tsx`: neue Karten-Komponente — Name, Kategorie-/Stärke-Badges, letzter Kontakt, nächstes Follow-up (rot + "(überfällig)" wenn in der Vergangenheit), Klick öffnet Edit, Löschen-Button mit `stopPropagation`
- `src/components/contact-list.tsx`: komplett ersetzt — Filter-Leiste (Namenssuche, Kategorie-Select, Stärke-Select, alle UND-verknüpft, client-seitig via `useMemo`), Sortierung nach `next_followup_at` (null ans Ende), Empty-State vs. No-Results-State unterschieden
- `ContactFormDialog` aus PROJ-3 unverändert wiederverwendet
- Live verifiziert mit 3 Test-Kontakten (überfällig/zukünftig/ohne Follow-up): Sortierreihenfolge korrekt, Overdue-Highlight korrekt, Kategorie-Filter korrekt
- **Wichtiger Hinweis:** `next_followup_at` wird aktuell von keinem Feature aktiv gesetzt — der DB-Trigger dafür greift erst bei einem Interaction-Insert (PROJ-5, noch nicht gebaut). Bis dahin haben alle über PROJ-3 angelegten Kontakte `next_followup_at = null` und landen alle gleichrangig am Ende der Sortierung — funktional korrekt, aber Overdue-Highlight kommt erst mit PROJ-5 wirklich zum Einsatz

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
| Decision | Rationale | Date |
|----------|-----------|------|
| Client-seitiges Filtern/Sortieren statt Server-Roundtrip | Sofortiges Feedback, keine Latenz pro Tastenanschlag, ausreichend bei überschaubarer Datenmenge | 2026-06-19 |
| `ContactFormDialog` aus PROJ-3 unverändert wiederverwendet | Keine Logik-Duplikation, nur neuer Einstiegspunkt (Karte statt Liste) | 2026-06-19 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure

```
/ (Startseite, ersetzt die PROJ-3-Übergangsliste vollständig)
├── Filter-Leiste
│   ├── Namenssuche (Textfeld, live)
│   ├── Kategorie-Filter (Auswahl)
│   └── Beziehungsstärke-Filter (Auswahl)
├── "Kontakt hinzufügen"-Button
├── Kontakt-Karten (sortiert nach Follow-up-Dringlichkeit)
│   └── Pro Karte: Name, Kategorie-Badge, Stärke-Badge, letzter Kontakt,
│       nächstes Follow-up (rot hervorgehoben wenn überfällig)
│       → Klick öffnet das bestehende Bearbeiten-Formular aus PROJ-3
├── Empty State ("Noch keine Kontakte") — aus PROJ-3 übernommen
└── No-Results State ("Keine Kontakte zu diesen Filtern") — neu für Filter-Fall
```

### Data Model (plain language)

Keine Änderung — nutzt die bestehende `contacts`-Tabelle aus PROJ-1 unverändert. Kein neues Feld, keine neue Tabelle.

### Tech Decisions (justified)

- **Client-seitiges Filtern/Sortieren statt Server-Roundtrip pro Filteränderung:** Alle Kontakte werden einmal geladen (wie schon in PROJ-3), Filter/Suche operieren auf den bereits geladenen Daten im Browser — sofortiges Feedback ohne Netzwerk-Latenz bei jedem Tastenanschlag, sinnvoll bei der erwarteten überschaubaren Kontaktanzahl eines persönlichen Netzwerks.
- **Bestehendes `ContactFormDialog` aus PROJ-3 unverändert wiederverwendet:** Gleiche Felder, gleiche Validierung, keine Logik-Duplikation — nur der Einstiegspunkt (Karten-Klick statt Listenzeile) ändert sich.
- **shadcn `Card` + `Badge` für die Kontakt-Darstellung:** Standard-Komponenten bereits installiert, passen zum bestehenden Design-System ohne Custom-CSS.
- **Überfällig-Markierung rein visuell (rote Border/Text), keine Datenbank-Logik:** Berechnung (`next_followup_at < jetzt`) passiert client-seitig beim Rendern, kein zusätzliches DB-Feld oder Trigger nötig.

### Dependencies (Packages)
Keine neuen Packages — `Card`, `Badge`, `Input`, `Select` bereits installiert (shadcn/ui).

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
