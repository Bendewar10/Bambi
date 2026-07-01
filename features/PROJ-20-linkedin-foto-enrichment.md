# PROJ-20: LinkedIn Foto-Enrichment (automatisches Profilbild-Scraping)

## Status: Planned
**Created:** 2026-07-01
**Last Updated:** 2026-07-01

## Summary
Kontakte bekommen automatisch ihr LinkedIn-Profilbild, ohne manuelle Pflege. Für jeden Kontakt mit LinkedIn-URL aber ohne Foto wird über einen Server-Dienst (Apify `harvestapi/linkedin-profile-scraper`) das Profilbild geholt, dauerhaft im Storage abgelegt und nur das Foto-Feld gesetzt. Das läuft (a) automatisch nach jedem CSV-Import und (b) einmal monatlich per Cron über den gesamten Bestand. Fotos erscheinen auf Kontakt-Karten und lassen sich per Klick vergrößern.

## Dependencies
- Requires: PROJ-10 (LinkedIn-CSV-Import) — Enrichment hängt sich an den Import-Flow
- Requires: PROJ-3 (Kontakt anlegen & verwalten) — `contacts.photo_url`, Kontakt-Karten
- Requires: PROJ-1 (Supabase Infrastructure) — Storage-Bucket, RLS
- Related: PROJ-9 (Monatlicher AI-Report) — teilt sich die Cron-Infrastruktur

## User Stories
- Als MBB-Berater möchte ich, dass importierte LinkedIn-Kontakte automatisch ihr Profilbild bekommen, damit ich Personen visuell schneller wiedererkenne, ohne jedes Foto manuell zu pflegen.
- Als Nutzer möchte ich, dass beim Foto-Nachladen **nur** das Bild ergänzt wird und keine anderen Kontaktfelder verändert werden, damit meine gepflegten Daten nicht überschrieben werden.
- Als Nutzer möchte ich, dass fehlende Fotos auch nachträglich (monatlich automatisch) ergänzt werden, damit auch später angelegte Kontakte irgendwann ein Bild bekommen, ohne dass ich etwas tun muss.
- Als Nutzer möchte ich ein Kontaktfoto anklicken und vergrößert ansehen können, damit ich das Gesicht klar erkenne.
- Als Nutzer möchte ich, dass ein Kontakt ohne (gefundenes) Foto weiterhin sauber mit Initialen dargestellt wird, damit die Oberfläche nie kaputt aussieht.

## Behavior / Ablauf

### 1. Enrichment nach CSV-Import
- Nach Bestätigen des Imports (bestehender PROJ-10-Flow) wird für alle **in diesem Import betroffenen** Kontakte (neu angelegt + gematcht), die eine `linkedin_url` haben und deren `photo_url` leer ist, ein Foto-Enrichment ausgelöst.
- Enrichment läuft **asynchron im Hintergrund**: Der Import ist sofort fertig, Fotos erscheinen nach und nach.
- Dem Nutzer wird nach Import angezeigt, dass Fotos im Hintergrund geladen werden (z.B. „Fotos für X Kontakte werden geladen").

### 2. Monatlicher Cron
- Einmal pro Monat scannt ein Cron-Job **alle** Kontakte des Nutzers mit `linkedin_url` und leerem `photo_url` und lädt deren Fotos nach.
- Fängt damit automatisch Kontakte ein, die manuell, per Chat oder in einem früheren fehlgeschlagenen Lauf ohne Foto angelegt wurden.
- **Kein** LinkedIn-Verbindungs-Sync: Der Cron entdeckt keine neuen LinkedIn-Kontakte von selbst (kein LinkedIn-API — siehe Non-Goals der PRD). Neue Kontakte entstehen nur durch CSV-Upload, manuelles Anlegen oder Chat.

### 3. Foto-Verarbeitung (pro Kontakt)
- Server ruft Apify-Actor mit der `linkedin_url` auf → erhält Profilbild-URL.
- Bild wird **heruntergeladen** und im **public** Storage-Bucket `contact-photos` abgelegt (LinkedIn-Bild-URLs sind signiert und laufen ab → dürfen nicht direkt gespeichert werden). Gespeichert wird die dauerhafte public URL in `photo_url`.
- Nur `contacts.photo_url` wird gesetzt — **niemals** ein bereits vorhandenes Foto überschrieben, **niemals** ein anderes Feld angefasst.

### 4. Anzeige & Lightbox
- Foto erscheint als Avatar auf: Dashboard-Karten, Kontaktliste-Karten, Kontakt-Detail/Formular. (Dashboard nur Anzeige.)
- **Klick zum Vergrößern (Lightbox)** auf: **Kontaktliste-Karten** und **Kontakt-Detail/Formular**.
- Kein Foto (nicht gefunden / kein LinkedIn) → Fallback auf Initialen wie bisher.

## Out of Scope
- **Automatisches Entdecken neuer LinkedIn-Verbindungen** — kein LinkedIn-API (PRD Non-Goal). Neue Kontakte kommen nur über CSV/manuell/Chat.
- **Manueller Foto-Upload / eigenes Foto hochladen** — separat, gehört zu PROJ-7 (Foto-Upload).
- **Foto-Enrichment für das eigene Profil (CV)** — PROJ-16 betrifft nur eigene Daten.
- **Überschreiben / Aktualisieren vorhandener Fotos** — Enrichment füllt nur leere Fotos; kein „Foto auffrischen".
- **Andere Profildaten aus dem Scrape** (Headline, Erfahrung, Ausbildung, Skills) — dieses Feature holt ausschließlich das Profilbild. (Reichere Profil-Anreicherung könnte späteres Feature sein.)
- **E-Mail-Suche via Apify** (teurerer Scraper-Modus) — nicht Teil dieses Features.
- **Lightbox auf Dashboard-Karten** — dort bleibt der Avatar-Klick beim bestehenden Verhalten (Kontakt öffnen).
- **Retry-Verwaltung / manuelles Neu-Anstoßen einzelner fehlgeschlagener Fotos in der UI** — fehlgeschlagene werden beim nächsten Monats-Cron erneut versucht.

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ein Kontakt hat eine LinkedIn-URL und kein Foto, wenn das Enrichment für ihn läuft und ein Profilbild gefunden wird, dann wird das Bild im Storage gespeichert und nur `photo_url` gesetzt.
- [ ] Angenommen ein Kontakt hat bereits ein Foto, wenn das Enrichment läuft, dann bleibt sein Foto unverändert (keine Überschreibung).
- [ ] Angenommen ein Kontakt wird per Enrichment mit einem Foto versehen, wenn danach seine Daten geprüft werden, dann sind alle anderen Felder (Name, Arbeitgeber, Position, E-Mail, Notizen, etc.) unverändert.
- [ ] Angenommen ein CSV-Import wird bestätigt und enthält Kontakte mit LinkedIn-URL ohne Foto, wenn der Import abgeschlossen ist, dann wird der Import nicht durch das Foto-Laden blockiert und ein Hinweis zeigt, dass Fotos im Hintergrund geladen werden.
- [ ] Angenommen der monatliche Cron läuft, wenn es Kontakte mit LinkedIn-URL und ohne Foto gibt, dann werden für diese Fotos nachgeladen.
- [ ] Angenommen ein Kontakt hat keine LinkedIn-URL, wenn das Enrichment läuft, dann wird er übersprungen (kein Scrape-Aufruf).
- [ ] Angenommen der Scrape findet für eine LinkedIn-URL kein Profilbild, wenn das Enrichment für diesen Kontakt endet, dann bleibt `photo_url` leer und die Karte zeigt Initialen.
- [ ] Angenommen ein Kontakt hat ein Foto, wenn der Nutzer in der Kontaktliste oder im Kontakt-Detail auf das Foto klickt, dann wird es vergrößert (Lightbox) angezeigt.
- [ ] Angenommen ein Kontakt hat kein Foto, wenn er auf einer Karte dargestellt wird, dann werden seine Initialen angezeigt.
- [ ] Angenommen der Nutzer greift auf fremde Kontakte zu, wenn Enrichment oder Anzeige erfolgt, dann greift RLS auf `contacts` und nur eigene Kontakte sind zugänglich (Foto-Dateien liegen im public Bucket unter unratbarem UUID-Pfad).

## Edge Cases
- **Scrape schlägt fehl / Apify nicht erreichbar / Timeout:** Kontakt wird übersprungen, `photo_url` bleibt leer, restliche Kontakte laufen weiter; erneuter Versuch beim nächsten Monats-Cron. Import selbst schlägt nie wegen Fotos fehl.
- **LinkedIn-Profil hat kein Bild oder ist privat:** kein Foto gesetzt, Fallback Initialen.
- **LinkedIn-URL ungültig / Profil existiert nicht mehr:** übersprungen, kein Fehler nach außen.
- **Sehr großer Import (400+ Kontakte):** Enrichment in Batches im Hintergrund; Kosten (~$4/1000 Scrapes) und Laufzeit beachten.
- **Doppelter/erneuter CSV-Import derselben Kontakte:** Kontakte mit bereits vorhandenem Foto werden nicht erneut gescraped (Kosten sparen, kein Überschreiben).
- **Bild-Download klappt, Storage-Upload schlägt fehl:** kein `photo_url` gesetzt, wird beim nächsten Lauf erneut versucht.
- **Signierte LinkedIn-URL läuft während Verarbeitung ab:** Download passiert unmittelbar; abgelaufene URL → skip + Retry nächster Lauf.
- **Gleicher Kontakt in mehreren Läufen gleichzeitig (Import + Cron):** kein doppeltes Setzen, nur wenn `photo_url` leer (idempotent).

## Technical Requirements (optional)
- Enrichment läuft server-seitig (Apify-Zugriff nur über Server, nicht Client).
- Externer Dienst: Apify `harvestapi/linkedin-profile-scraper`; benötigt einen Apify-API-Token als Server-Env-Variable (in Vercel hinterlegen).
- Bilder dauerhaft im Supabase Storage (public Bucket `contact-photos`, unratbarer UUID-Pfad); LinkedIn-Bild-URLs nie direkt persistieren.
- RLS: Kontakte und Fotos strikt pro Nutzer isoliert.
- Import darf durch Enrichment nicht spürbar langsamer werden (async/entkoppelt).
- Idempotenz: Enrichment nur bei leerem `photo_url`.

## Open Questions
- [ ] Mechanik des Hintergrund-Enrichments (z.B. entkoppelte Server-Verarbeitung, Batchgröße, Rate-Limiting gegenüber Apify) — Detail für `/architecture`.
- [ ] Soll dem Nutzer irgendwo ein Fortschritt/Status („X von Y Fotos geladen") angezeigt werden, oder reicht stiller Hintergrundlauf? (aktuell: nur kurzer Hinweis nach Import)
- [ ] Genauer Tag/Zeitpunkt des Monats-Cron (mit PROJ-9-Report bündeln?).

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Enrichment setzt ausschließlich `photo_url`, nie andere Felder | Nutzer-gepflegte Daten dürfen nicht durch Scrape verfälscht werden | 2026-07-01 |
| Vorhandene Fotos werden nie überschrieben (nur leere gefüllt) | Idempotenz, Kosten sparen, keine ungewollten Änderungen | 2026-07-01 |
| Nur das Profilbild wird gescraped (nicht Headline/Erfahrung/etc.) | Fokus & Single Responsibility; reichere Anreicherung wäre eigenes Feature | 2026-07-01 |
| Zwei Trigger: async nach CSV-Import + monatlicher Cron | CSV deckt Neuimport ab; Cron fängt später/anders angelegte Kontakte automatisch ein | 2026-07-01 |
| Enrichment asynchron im Hintergrund (nicht synchron) | Große Importe (400+) würden UX sonst lange blockieren | 2026-07-01 |
| Kein automatisches Entdecken neuer LinkedIn-Verbindungen | Kein LinkedIn-API (PRD Non-Goal); nur Fotos zu bestehenden Kontakten | 2026-07-01 |
| Lightbox nur in Kontaktliste + Kontakt-Detail, nicht Dashboard | Dashboard-Avatar-Klick öffnet bereits den Kontakt; kein Konflikt | 2026-07-01 |
| Fehlgeschlagene Scrapes werden nicht in UI verwaltet, sondern beim nächsten Cron erneut versucht | Hält MVP einfach; selbstheilend | 2026-07-01 |
| Public Storage-Bucket statt privat+signiert | Einfacher; unratbarer UUID-Pfad; Fotos sind ohnehin public auf LinkedIn; akzeptables Risiko für Solo-CRM | 2026-07-01 |

### Technical Decisions
_To be added by /architecture_

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
