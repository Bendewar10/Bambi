# PROJ-6: Follow-up Dashboard & Tagesansicht

## Status: Deployed
**Created:** 2026-06-22
**Last Updated:** 2026-06-28

> Refinement 2026-06-28: "Diese Woche" wird zu einer chronologisch sortierten "Nächste 14 Tage"-Sektion erweitert (7→14 Tage). Neue Sektion "Kürzlich erkannt" zeigt von PROJ-10 persistierte Jobwechsel-/Beförderungs-Events. Frontend dafür ist implementiert (siehe "Implementation Notes (Frontend Refine 2026-06-28)" unten), Backend (`contact_events`-Tabelle + RLS + `/api/draft-message`-Erweiterung) noch offen. Vorherige Refine-Notiz bleibt als Kontext erhalten: WhatsApp-Button durch Copy-Button ersetzt, Schreibstil-Lernen für AI-Vorschlag ergänzt (2026-06-24).

## Implementation Notes (Frontend Refine 2026-06-28)
- `src/lib/occasions.ts`: `computeOccasionSections` — Fenster für die zweite Sektion von 7 auf `UPCOMING_WINDOW_DAYS = 14` Tage erweitert; Rückgabe-Key `weekSection` → `upcomingSection` umbenannt (Code-Klarheit, da "Woche" nicht mehr stimmt); Einträge werden vor der Rückgabe chronologisch nach dem jeweils frühesten Anlassdatum sortiert (bei zwei Badges zählt das frühere)
- `src/lib/contact-events.ts` (neu): Typen `ContactEvent`/`ContactEventGroup` + `groupOpenEvents()` — gruppiert offene (`dismissed_at === null`) Events pro Kontakt zu einer Karte mit mehreren Badge-Typen
- `src/components/import-event-card.tsx` (neu): eigenständige Komponente analog zu `occasion-card.tsx`, aber ohne Kalender-Link (Import-Events haben kein Zukunftsdatum) — Badges, "Kontaktiert"-Button, "Vorschlag"-Button (ruft bestehende `/api/draft-message`-Route mit `occasionType: 'Jobwechsel' | 'Beförderung'` auf), Kopieren-Button
- `src/app/(app)/dashboard/page.tsx`: lädt jetzt zusätzlich `contact_events` (zweiter Supabase-Query neben `contacts`); Sektion "Diese Woche" → "Nächste 14 Tage" umbenannt; neue Sektion "Kürzlich erkannt" nur gerendert, wenn `groupOpenEvents(...)` mindestens eine Gruppe liefert; "Kontaktiert" auf einer Import-Event-Karte merkt sich die betroffenen Event-IDs (`dismissingEventIds`) und setzt nach erfolgreichem Speichern des Interaction-Formulars `dismissed_at` auf diese Zeilen, danach Reload von Kontakten + Events
- **Bewusst robust gegen fehlende Tabelle:** `contact_events`-Query fängt den Fehlerfall ab (Tabelle existiert in der DB noch nicht, da `/backend` für dieses Refine noch offen ist) und setzt `events` einfach auf `[]`, statt zu crashen — manuell verifiziert: Dashboard lädt weiterhin normal, "Kürzlich erkannt" bleibt unsichtbar, ein 404 landet nur in der Browser-Konsole
- **Noch offen für `/backend`:** Migration für `contact_events` (Tabelle + RLS-Policy analog zu `contacts`), `/api/draft-message` muss `occasionType` um `'Jobwechsel'`/`'Beförderung'` erweitern (aktuell 400 bei diesen Werten, da Zod-Enum noch nur `followup`/`birthday` kennt) inkl. passendem Prompt-Wortlaut, und PROJ-10 muss beim Import-Bestätigen tatsächlich in `contact_events` schreiben
- Manuell verifiziert (Playwright, gegen echten QA-Account): "Nächste 14 Tage" sichtbar, "Diese Woche" verschwunden, Karten korrekt chronologisch sortiert (naher Termin vor fernem), "Kürzlich erkannt" ausgeblendet ohne Backend-Tabelle
- `npm run build` + `npm run lint` + `npm test` (50/50) laufen fehlerfrei durch

## Backend Implementation Notes
- **Update 2026-06-23 (im Rahmen von PROJ-8):** Vercel-AI-Gateway-Account hatte keine Kreditkarte hinterlegt (`customer_verification_required`, 502 bei echtem Call) — auf Nutzerwunsch von Gateway-String-Modell auf direkten Anthropic-Provider umgestellt: `@ai-sdk/anthropic` installiert, `model: 'anthropic/claude-haiku-4.5'` → `model: anthropic('claude-haiku-4-5-20251001')`. Neue Env-Var `ANTHROPIC_API_KEY` ersetzt `AI_GATEWAY_API_KEY` (Nutzer trägt selbst ein). Tests weiterhin grün (mocken `generateText` komplett, Provider-Wechsel unabhängig davon)
- `src/lib/supabase-server.ts`: neuer Server-seitiger Supabase-Client (liest Session aus Cookies, gleiches Muster wie `src/middleware.ts`) — erste Wiederverwendung dieses Patterns außerhalb der Middleware
- `src/app/api/draft-message/route.ts`: neue POST-Route, erstes API-Endpoint im Projekt
  - Zod-Validierung von `contactId` (UUID) + `occasionType` (`followup`/`birthday`)
  - Session-Check via `auth.getUser()` → 401 ohne Login
  - Kontakt + letzte 3 Interaktions-Notizen werden über den Server-Client geladen — RLS aus PROJ-1 sorgt dafür, dass ein Kontakt einer fremden `user_id` als "nicht gefunden" (404) zurückkommt, kein expliziter Extra-Check nötig
  - AI-Anbindung: `generateText` aus dem `ai`-Package, Modell `claude-haiku-4-5-20251001` direkt über `@ai-sdk/anthropic` (bis 2026-06-23: `anthropic/claude-haiku-4.5` über Vercel AI Gateway, siehe Update oben)
  - Prompt unterscheidet sich nach `occasionType` (Geburtstagsgruß vs. Anknüpfung an letzte Notizen), Antwort serverseitig auf 300 Zeichen begrenzt
  - AI-Fehler → 502 mit Fehlermeldung, kein Crash
  - Benötigt `AI_GATEWAY_API_KEY` in `.env.local` (lokal) bzw. Vercel Env Vars (Produktion) — **Nutzer muss diesen Key selbst eintragen**, da `.env.local`/`.env.local.example` für KI-Tooling per Permission-Regel gesperrt sind
- `src/app/api/draft-message/draft-message.test.ts`: 5 Vitest-Integrationstests (401/400/404/200/502), `ai` und `@/lib/supabase-server` gemockt, kein echter API-Call in Tests
- **Update 2026-06-24 (Refine, Stil-Lernen):** `route.ts` lädt zusätzlich bis zu 20 jüngste Notizen über ALLE Kontakte des Nutzers (`interactions`-Query ohne `contactId`-Filter, RLS grenzt automatisch auf `auth.uid()` ein), filtert auf Notizen >20 Zeichen, nimmt die ersten 5 als Few-Shot-Stilbeispiele und hängt sie als zusätzliche Prompt-Instruktion an (für beide `occasionType`-Varianten). Kein Fehler/Blocker, wenn keine Notiz die Mindestlänge erfüllt — Prompt läuft dann wie bisher ohne Stilbeispiele. 2 neue Tests (`includes style examples...`, `generates without style examples...`) decken Filter-Logik + Few-Shot-Injection ab
- Routing-Änderung aus `/frontend` brach bestehende E2E-Login-Helper in `PROJ-3-contacts.spec.ts`/`PROJ-4-contacts-list.spec.ts`/`PROJ-5-interaction-log.spec.ts` (erwarteten Redirect auf `/`, jetzt `/dashboard`) — alle drei auf `/dashboard` + anschließendes `goto('/contacts')` angepasst, volle Regression (36/36) wieder grün
- `npm test` (7/7) + `npm run build` + `npm run lint` laufen fehlerfrei durch

## Implementation Notes
- Migration `add_birthday_to_contacts`: neue nullable Spalte `birthday` (date) auf `contacts`
- `src/lib/contacts.ts`: `Contact`-Interface um `birthday` ergänzt
- `src/components/contact-form-dialog.tsx`: Geburtstag-Feld ergänzt (optional, `type="date"`, Zod-Refine "nicht in der Zukunft" — bewusst ohne natives `max`-Attribut, siehe PROJ-5-Bugfix-Historie)
- `src/lib/occasions.ts`: reine Funktionen `computeOccasionSections`/`nextBirthdayOccurrence` — berechnen pro Kontakt, ob er in "Heute & überfällig" und/oder "Diese Woche" auftaucht, inkl. Mehrfach-Badges falls beide Anlässe im selben Zeitfenster liegen
- `src/lib/external-links.ts`: `buildWhatsAppLink` (Telefonnummer-Normalisierung auf Ziffern) und `buildCalendarLink` (Google-Calendar-Add-Event-URL, Ganztags-Event)
- `src/components/occasion-card.tsx`: neue Karten-Komponente — Badges, "Kontaktiert"-Button (öffnet bestehendes `InteractionFormDialog` aus PROJ-5), "Vorschlag"-Button (ruft `/api/draft-message` auf — **Route existiert noch nicht, folgt in `/backend`**, Fehlerfall bereits abgefangen), WhatsApp-Button (deaktiviert/Hinweis ohne Telefonnummer), Kalender-Link(s) pro aktivem Badge-Typ
- **Update 2026-06-24 (Refine):** WhatsApp-Button entfernt, ersetzt durch kanalunabhängigen Copy-Button (`navigator.clipboard.writeText`, lokaler `copied`-State zeigt "Kopiert!" für 2s, `copyError`-State bei Clipboard-Fehler). `buildWhatsAppLink`/`normalizePhoneForWhatsApp` aus `src/lib/external-links.ts` entfernt (keine Nutzung mehr). Telefonnummer-Hinweis ("Keine Telefonnummer hinterlegt") entfernt, da für Copy-Button irrelevant. Tests in `tests/PROJ-6-follow-up-dashboard.spec.ts` ersetzt (Clipboard-Permission via `context.grantPermissions`). Stil-Lernen (Backend-Teil) noch offen für `/backend`
- Neue Route-Gruppe `src/app/(app)/` mit gemeinsamem Layout (Header + Nav Dashboard/Kontakte), `src/app/(app)/dashboard/page.tsx` (neu) und `src/app/(app)/contacts/page.tsx` (bisheriger Inhalt von `/`, unverändert übernommen)
- `src/app/page.tsx` entfernt, `src/middleware.ts` erweitert: `/` und `/login` (wenn eingeloggt) leiten jetzt auf `/dashboard` um
- `npm run build` + `npm run lint` laufen fehlerfrei durch
- **Noch offen für `/backend`:** API-Route `/api/draft-message` (AI-Provider-Anbindung über Vercel AI Gateway, Session-Check, Kontakt-Notizen als Prompt-Kontext)

## Dependencies
- PROJ-3 (Kontakt anlegen & verwalten) — `contacts`-Tabelle, inkl. `city`/`phone`-Erweiterung; neues Feld `birthday` kommt mit diesem Feature dazu
- PROJ-5 (Interaktions-Log) — `last_contacted_at`/`next_followup_at` werden hier konsumiert, "Kontaktiert"-Aktion nutzt das bestehende Interaction-Formular wieder
- **Neu (Refine 2026-06-28):** PROJ-10 (LinkedIn-CSV-Import) — neue Tabelle `contact_events` wird beim Bestätigen eines Imports dort befüllt (Jobwechsel/Beförderung-Erkennung), PROJ-6 liest und zeigt sie nur an, schreibt sie nicht selbst (außer beim Dismiss via "Kontaktiert")

## User Stories
- Als Nutzer möchte ich nach dem Login sofort sehen, welche Kontakte heute oder überfällig sind, damit ich nicht erst durch die ganze Liste suchen muss
- Als Nutzer möchte ich auch sehen, wer diese Woche fällig wird oder Geburtstag hat, damit ich vorausplanen kann statt nur reaktiv zu sein
- Als Nutzer möchte ich direkt aus dem Dashboard einen Kontaktmoment loggen können, damit der Kontakt nach erfolgtem Kontakt aus der Liste verschwindet
- Als Nutzer möchte ich mir einen Nachrichtenvorschlag generieren lassen, damit ich nicht selbst überlegen muss, was ich schreibe
- Als Nutzer möchte ich den Vorschlag in meinen Schreibstil generiert bekommen, damit er nicht roboterhaft/generisch klingt und ich ihn ohne viel Nachbearbeiten verwenden kann
- Als Nutzer möchte ich den Vorschlag mit einem Klick kopieren können, damit ich ihn selbst in WhatsApp, SMS oder eine andere App einfügen kann, egal ob eine Telefonnummer hinterlegt ist
- Als Nutzer möchte ich einen Anlass mit einem Klick in meinen Kalender eintragen können, damit ich ihn nicht vergesse, falls ich jetzt nicht reagiere
- **Neu (Refine 2026-06-28):** Als Nutzer möchte ich eine 14-Tage-Vorschau in chronologischer Reihenfolge sehen, damit ich vorausplanen kann, ohne erst durch "Diese Woche" und die volle Liste zu suchen
- **Neu (Refine 2026-06-28):** Als Nutzer möchte ich auf dem Dashboard sehen, wenn ein LinkedIn-Import einen Jobwechsel oder eine Beförderung bei einem Kontakt erkannt hat, damit ich diesen Anlass nicht verpasse, nur weil ich ihn beim Import übersehen habe

## Out of Scope
- Geburtstags-Import aus externem Kalender (Google Calendar OAuth) — bewusst nicht, nur manuelles `birthday`-Feld am Kontakt (Entscheidung im Interview, Konsistenz mit PRD-Non-Goal "Kalender-Sync erst nach MVP")
- WhatsApp-Button/`wa.me`-Deep-Link — **entfernt im Refine vom 2026-06-24**, ersetzt durch kanalunabhängigen Copy-Button (siehe Decision Log)
- Auto-Log beim Senden (egal über welchen Kanal) — bewusst nicht, Nutzer loggt weiterhin manuell über bestehenden "Kontaktiert"-Button, kein Erkennungsmechanismus für "wurde tatsächlich gesendet" (Entscheidung im Refine vom 2026-06-24)
- Eigenes Feld für den exakten gesendeten Nachrichtentext — Stil-Lernen nutzt das bestehende Notizfeld aus PROJ-5, kein Zusatzfeld, um Quick-Add-Ziel aus PRD nicht zu gefährden
- Echte Calendar-Sync (Lesen bestehender Termine, Abgleich mit Kontakten) — nur einseitiger Add-Event-Link, kein OAuth
- Scoring/Ranking von Kontakten durch KI ("wer ist am wichtigsten") — KI wird nur für Nachrichten-Drafting genutzt, Reihenfolge/Sektionen sind reine Datums-Logik
- Caching/Speichern generierter Nachrichtenvorschläge — wird bei jedem Klick neu generiert, kein Verlauf
- Rate-Limiting für KI-Aufrufe — kein MVP-Bedarf bei erwarteter Nutzungsfrequenz eines persönlichen Netzwerks
- Eigene Sektion für "länger nicht gemeldet" (z.B. Kontakte ohne Follow-up-Intervall) — Dashboard zeigt nur Kontakte mit aktivem `next_followup_at` oder `birthday`, alles andere bleibt in `/contacts`
- Mobile Push-Benachrichtigungen — kein PWA-Aufwand laut PRD-Constraint
- **Neu (Refine 2026-06-28):** Erkennung selbst (was zählt als "Jobwechsel"/"Beförderung") bleibt vollständig in PROJ-10 — PROJ-6 liest nur die dort geschriebene `contact_events`-Tabelle und zeigt sie an, keine eigene Erkennungslogik
- **Neu:** Separater "Ignorieren ohne Interaction"-Button für Import-Events — bewusst nicht, "Kontaktiert" ist der einzige Dismiss-Weg (Konsistenz mit Follow-up/Geburtstag, kein zweiter Aktions-Typ nur für diese Sektion)
- **Neu:** Benachrichtigung (E-Mail/Push) bei neuem Import-Event außerhalb des Dashboards — Anzeige nur beim nächsten Dashboard-Besuch, kein Push-Mechanismus (PRD-Constraint)

## Acceptance Criteria

### Routing & Grundgerüst
- [ ] Angenommen der Nutzer ist eingeloggt, wenn er sich einloggt oder `/` aufruft, dann wird er auf `/dashboard` weitergeleitet (neue Default-Landingpage)
- [ ] Angenommen der Nutzer ist auf `/dashboard`, wenn er die volle Kontaktliste sehen will, dann erreicht er sie über einen Nav-Link zu `/contacts` (bisheriger Inhalt von `/`)

### Sektionen & Anlass-Erkennung
- [ ] Angenommen ein Kontakt hat `next_followup_at <= heute`, wenn das Dashboard lädt, dann erscheint er in der Sektion "Heute & überfällig" mit Badge "Follow-up"
- [ ] **Geändert (Refine 2026-06-28, war 7 Tage):** Angenommen ein Kontakt hat `next_followup_at` zwischen morgen und in 14 Tagen, wenn das Dashboard lädt, dann erscheint er in der Sektion "Nächste 14 Tage" mit Badge "Follow-up"
- [ ] **Geändert (Refine 2026-06-28, war 7 Tage):** Angenommen ein Kontakt hat `birthday` (Monat+Tag) innerhalb der nächsten 14 Tage (inkl. heute, jahresübergreifend z.B. 28.12. → 10.01.), wenn das Dashboard lädt, dann erscheint er in der passenden Sektion (heute → "Heute & überfällig", in 1–14 Tagen → "Nächste 14 Tage") mit Badge "Geburtstag"
- [ ] Angenommen ein Kontakt hat sowohl ein fälliges Follow-up als auch einen Geburtstag innerhalb des jeweiligen Zeitfensters, wenn das Dashboard lädt, dann erscheint er mit beiden Badges auf derselben Karte, sofern beide Anlässe ins gleiche Zeitfenster fallen — fallen sie in unterschiedliche Fenster (z.B. Follow-up überfällig, Geburtstag erst in 10 Tagen), erscheint er einmal pro Sektion
- [ ] **Neu (Refine 2026-06-28):** Angenommen mehrere Kontakte erscheinen in der Sektion "Nächste 14 Tage", wenn das Dashboard lädt, dann sind ihre Karten chronologisch nach Anlassdatum sortiert (frühestes Datum zuerst); hat ein Kontakt zwei Badges mit unterschiedlichen Daten, zählt das jeweils frühere für die Sortierung dieser Karte
- [ ] Angenommen kein Kontakt hat einen aktiven Anlass, wenn das Dashboard lädt, dann wird ein Empty-State angezeigt ("Alles im Blick — aktuell nichts Fälliges.")
- [ ] Angenommen ein Kontakt hat weder `next_followup_at` noch `birthday` gesetzt, wenn das Dashboard lädt, dann erscheint er in keiner Sektion

### Kürzlich erkannt (Import-Events)
- [ ] **Neu (Refine 2026-06-28):** Angenommen ein bestätigter LinkedIn-Import hat bei einem Kontakt einen Jobwechsel oder eine Beförderung erkannt (siehe PROJ-10), wenn das Dashboard lädt, dann erscheint dieser Kontakt in einer eigenen Sektion "Kürzlich erkannt" mit Badge "Jobwechsel" und/oder "Beförderung", unabhängig von Follow-up/Geburtstag-Anlässen
- [ ] **Neu:** Angenommen eine Karte in "Kürzlich erkannt" wird angezeigt, wenn der Nutzer auf "Kontaktiert" klickt, dann öffnet sich das bestehende Interaction-Formular (PROJ-5); nach erfolgreichem Speichern wird das zugehörige `contact_events`-Event als erledigt markiert (`dismissed_at` gesetzt) und die Karte verschwindet aus "Kürzlich erkannt"
- [ ] **Neu:** Angenommen kein offenes Import-Event existiert, wenn das Dashboard lädt, dann wird die Sektion "Kürzlich erkannt" nicht angezeigt (kein eigener Empty-State, einfach ausgeblendet)
- [ ] **Neu (Architecture 2026-06-28):** Angenommen eine Karte in "Kürzlich erkannt" wird angezeigt, wenn der Nutzer auf "Vorschlag" klickt, dann generiert dieselbe bestehende `/api/draft-message`-Route einen Nachrichtenvorschlag (Anlass-Typ "Jobwechsel"/"Beförderung"), inkl. Loading-/Fehler-State, identisch zum Follow-up/Geburtstag-Verhalten
- [ ] **Neu:** Angenommen ein Kontakt hat mehrere offene Import-Events (z.B. zwei Imports nacheinander, jeweils neuer Jobwechsel), wenn das Dashboard lädt, dann erscheint er einmal mit allen offenen Badges zusammen, "Kontaktiert" markiert alle offenen Events dieses Kontakts gleichzeitig als erledigt

### Kontaktiert-Aktion
- [ ] Angenommen eine Dashboard-Karte wird angezeigt, wenn der Nutzer auf "Kontaktiert" klickt, dann öffnet sich das bestehende Interaction-Formular (PROJ-5) mit Datum vorausgefüllt auf heute
- [ ] Angenommen der Nutzer speichert das Interaction-Formular vom Dashboard aus, dann wird `next_followup_at` automatisch neu berechnet (bestehender DB-Trigger aus PROJ-5) und das Dashboard aktualisiert sich, sodass der Kontakt nur noch erscheint, falls der neue Termin weiterhin im jeweiligen Zeitfenster liegt

### AI-Nachrichtenvorschlag
- [ ] Angenommen eine Dashboard-Karte wird angezeigt, wenn der Nutzer auf "Vorschlag" klickt, dann wird ein kurzer Nachrichtentext generiert basierend auf den letzten Interaktions-Notizen (bei Follow-up-Anlass) bzw. dem Anlass "Geburtstag" (bei Geburtstags-Anlass) und im UI angezeigt
- [ ] Angenommen die Generierung läuft, wenn der Nutzer wartet, dann zeigt der Button einen Loading-State
- [ ] Angenommen die KI-Anfrage schlägt fehl (Netzwerk/Provider-Fehler), wenn das passiert, dann wird eine Fehlermeldung angezeigt, die Karte bleibt ansonsten funktionsfähig (Kopieren/Kalender/Kontaktiert weiterhin nutzbar)
- [ ] Angenommen ein Vorschlag wurde generiert, wenn der Nutzer ihn nicht mag, dann kann er erneut auf "Vorschlag" klicken, um einen neuen zu generieren (keine Historie, alter Text wird ersetzt)

### Schreibstil-Lernen
- [ ] Angenommen der Nutzer hat über alle Kontakte hinweg mindestens eine Interaktions-Notiz mit mehr als 20 Zeichen, wenn ein Vorschlag generiert wird, dann nutzt der Prompt die bis zu 5 jüngsten dieser Notizen (über alle Kontakte, nicht nur den aktuellen) als Stil-Beispiele
- [ ] Angenommen der Nutzer hat keine Notiz, die die Mindestlänge erfüllt, wenn ein Vorschlag generiert wird, dann läuft die Generierung wie bisher ohne Stil-Beispiele (kein Fehler, kein Blocker)

### Kopieren-Button
- [ ] Angenommen ein Vorschlag wurde generiert, wenn der Nutzer auf "Kopieren" klickt, dann wird der Vorschlagstext in die Zwischenablage kopiert und ein kurzes visuelles Feedback angezeigt (z.B. "Kopiert!")
- [ ] Angenommen noch kein Vorschlag generiert wurde, wenn der Nutzer die Karte sieht, dann ist der Kopieren-Button nicht nutzbar (kein Text zum Kopieren) — Vorschlag muss zuerst generiert werden
- [ ] Angenommen die Zwischenablage ist im Browser nicht verfügbar/erlaubt, wenn der Nutzer auf "Kopieren" klickt, dann wird eine Fehlermeldung angezeigt, die Karte bleibt ansonsten funktionsfähig

### Kalender-Link
- [ ] Angenommen eine Dashboard-Karte mit Follow-up-Anlass wird angezeigt, wenn der Nutzer auf "Zum Kalender hinzufügen" klickt, dann öffnet sich ein Google-Calendar-Add-Event-Link mit Titel "Follow-up: [Name]" und Datum = `next_followup_at`
- [ ] Angenommen eine Dashboard-Karte mit Geburtstags-Anlass wird angezeigt, wenn der Nutzer auf "Zum Kalender hinzufügen" klickt, dann öffnet sich ein Add-Event-Link mit Titel "Geburtstag: [Name]" und Datum = nächstes Auftreten des Geburtstags

### Geburtstag-Feld (Datenmodell-Erweiterung am Kontakt)
- [ ] Angenommen der Nutzer bearbeitet einen Kontakt, wenn er ein Geburtsdatum einträgt und speichert, dann wird es korrekt gespeichert und beim erneuten Öffnen vorausgefüllt
- [ ] Angenommen der Nutzer lässt das Geburtstag-Feld leer, wenn er speichert, dann wird der Kontakt trotzdem angelegt (optional, kein Pflichtfeld)
- [ ] Angenommen der Nutzer trägt ein Geburtsdatum in der Zukunft ein, wenn er speichern will, dann wird eine Validierungsfehlermeldung angezeigt

## Edge Cases
- **Geändert (Refine 2026-06-28, war 7 Tage):** Geburtstag jahresübergreifend (z.B. heute 28.12., Geburtstag 10.01.) → zählt als "in den nächsten 14 Tagen", Jahreswechsel wird in der Berechnung berücksichtigt
- **Geändert (war 7 Tage):** Kontakt mit Follow-up überfällig UND Geburtstag in genau 14 Tagen → erscheint einmal in "Heute & überfällig" (nur Follow-up-Badge) und einmal in "Nächste 14 Tage" (nur Geburtstag-Badge), da unterschiedliche Zeitfenster
- ~~Telefonnummer im Freitext-Format mit Leerzeichen/Klammern (siehe PROJ-3) → wird vor dem `wa.me`-Link auf reine Ziffern (+ führendes `+`) normalisiert~~ — hinfällig seit Entfernung des WhatsApp-Buttons (2026-06-24), Copy-Button braucht keine Telefonnummer-Normalisierung
- Nutzer klickt "Kontaktiert" für einen Geburtstags-Anlass (ohne fälliges Follow-up) → loggt trotzdem eine Interaction, aktualisiert `last_contacted_at`/`next_followup_at` ganz normal, Geburtstags-Karte verschwindet trotzdem erst nächstes Jahr wieder (Geburtstag ist kein "erledigt"-Zustand, sondern wiederkehrend) — Karte bleibt bis das 14-Tage-Fenster verstrichen ist
- Zwei Kontakte mit identischem Geburtstag → beide erscheinen unabhängig, keine Gruppierung
- KI generiert sehr langen Text → Anzeige im UI mit Scroll/Begrenzung, Vorschlagstext wird serverseitig auf eine vernünftige Maximallänge begrenzt (z.B. 300 Zeichen) — Copy-Button hat kein URL-Längenlimit mehr (kein Link, reiner Zwischenablage-Text)
- Mehrere Browser-Tabs offen, Kontaktiert in einem Tab → anderer Tab zeigt veraltete Daten bis Reload (kein Realtime-Sync, kein MVP-Bedarf)
- Clipboard-API nicht verfügbar (alter Browser, kein sicherer Kontext/HTTP statt HTTPS) → Kopieren schlägt fehl, Fehlermeldung statt stillem No-Op
- Nutzer hat noch nie eine Notiz mit >20 Zeichen erfasst (z.B. ganz neuer Account) → Vorschlag wird trotzdem generiert, nur ohne Stil-Beispiele im Prompt
- **Neu (Refine 2026-06-28):** Kontakt hat sowohl ein offenes Import-Event als auch einen Follow-up/Geburtstags-Anlass im 14-Tage-Fenster → erscheint zweimal (einmal in "Kürzlich erkannt", einmal in "Heute & überfällig"/"Nächste 14 Tage"), keine Zusammenführung der Sektionen
- **Neu:** Derselbe Feldwechsel (z.B. employer) wird in zwei aufeinanderfolgenden Imports erkannt, ohne dass das erste Event dismissed wurde → zweites Event wird trotzdem zusätzlich angelegt (kein Dedupe), Kontakt zeigt dann ggf. das Badge "Jobwechsel" zweimal in der Detailansicht des Events — Dedupe ist kein MVP-Bedarf (geringe Praxisrelevanz, Nutzer importiert selten mehrfach ohne dazwischen zu reagieren)
- **Neu:** Kontakt mit offenem Import-Event wird gelöscht (PROJ-3 Löschen) → zugehörige `contact_events`-Zeilen werden per `ON DELETE CASCADE` mitgelöscht, kein verwaister Eintrag

## Technical Requirements
- Security: Der AI-Provider-Key darf niemals client-seitig exponiert werden → benötigt eine serverseitige API-Route (erstes Feature in diesem Projekt, das eine eigene Route statt direktem Supabase-Client-Zugriff braucht). Route muss die Supabase-Session des Nutzers verifizieren, bevor sie Kontakt-/Interaktionsdaten an den AI-Provider sendet (keine fremden Nutzerdaten dürfen in den Prompt gelangen)
- Security: RLS aus PROJ-1 deckt weiterhin den Datenzugriff ab (Dashboard liest nur eigene Kontakte/Interactions)
- **Geändert (Refine 2026-06-28, war 7 Tage):** Performance: Datums-Filterung (Sektionen, 14-Tage-Fenster) läuft client-seitig auf bereits geladenen Kontakten, analog zu PROJ-4 (keine zusätzlichen Server-Roundtrips)
- Validierung: `birthday` optional, Datum nicht in der Zukunft
- Stil-Lernen: Query für Few-Shot-Notizen läuft über alle Kontakte des eingeloggten Nutzers (nicht nur den aktuell angefragten Kontakt) — RLS aus PROJ-1 grenzt automatisch auf `auth.uid()` ein, kein zusätzlicher Authorization-Check nötig
- Clipboard: native Browser-Clipboard-API, kein neues Package
- **Neu (Refine 2026-06-28):** Neue Tabelle `contact_events` (von PROJ-10 beim Import-Bestätigen befüllt, von PROJ-6 nur gelesen/dismissed): mind. `id`, `contact_id` (FK → `contacts`, `ON DELETE CASCADE`), `user_id` (für RLS, gleiches Muster wie `contacts`), `type` (`Jobwechsel`/`Beförderung`), `detected_at` (timestamp, = Import-Zeitpunkt), `dismissed_at` (nullable timestamp). RLS-Policy analog zu `contacts`/`interactions`: nur eigene Zeilen (`user_id = auth.uid()`)
- **Neu:** Dashboard-Query für "Kürzlich erkannt" filtert `dismissed_at IS NULL`, gruppiert client-seitig pro `contact_id` (mehrere offene Events eines Kontakts → eine Karte, mehrere Badges)

## Open Questions
- [ ] Welcher AI-Provider/Modell genau (z.B. über Vercel AI Gateway) — technische Entscheidung, wird in `/architecture` getroffen
- [ ] Exakter Prompt-Wortlaut für Follow-up- vs. Geburtstags-Anlass — Feinschliff während `/frontend` oder `/backend`, keine Produktentscheidung
- [x] Genaues Schema/Migration für `contact_events` → Struktur (plain language) in `/architecture` festgelegt, siehe "Tech Design — Refine 2026-06-28"; exakte Spaltentypen/Indizes/RLS-Policy-Syntax folgen als Implementierungsdetail in `/backend` (2026-06-28)
- [x] Soll "Kürzlich erkannt" auch einen "Vorschlag"-AI-Draft-Button bekommen? → Ja, ruft dieselbe bestehende AI-Route auf (Konsistenz, kein Sonderfall), siehe Tech Decisions (2026-06-28)

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| `/dashboard` wird neue Default-Landingpage, volle Liste zieht nach `/contacts` | PRD-Kernmetrik ("fällige Kontakte sinkt auf 0") soll das Erste sein, was der Nutzer nach Login sieht | 2026-06-22 |
| Nur Kontakte mit `next_followup_at <= heute` ODER `birthday` in den nächsten 7 Tagen werden angezeigt | Direkte Kopplung an PRD-Erfolgsmetrik, kein "bald fällig"-Rauschen über die Woche hinaus | 2026-06-22 |
| Geburtstag als zweiter Anlass-Typ neben Follow-up, manuelles Feld statt Kalender-Import | Nutzerwunsch im Interview; Kalender-OAuth wurde bereits vorher bewusst ausgeschlossen (Komplexität/Solo-Projekt) | 2026-06-22 |
| 2 Sektionen ("Heute & überfällig" / "Diese Woche") statt einer einzigen sortierten Liste | Klarere Priorisierung — überfällig ist dringender als "diese Woche", visuelle Trennung unterstützt das | 2026-06-22 |
| "Kontaktiert"-Aktion gilt einheitlich für beide Anlass-Typen, loggt immer eine echte Interaction | Wiederverwendung von PROJ-5 statt neuer Spezial-Logik nur für Geburtstage | 2026-06-22 |
| AI-Draft + WhatsApp-Link + Kalender-Link gelten für beide Anlass-Typen | Konsistente Karten-UI, kein Sonderfall-UI nur für eine Anlass-Art | 2026-06-22 |
| Kein Caching von Vorschlägen, jeder Klick generiert neu | Einfachste Variante für MVP, kein Bedarf an Verlauf/Historie von Vorschlägen | 2026-06-22 |
| WhatsApp-Button deaktiviert ohne Telefonnummer/ohne generierten Vorschlag | Verhindert nutzlose Klicks auf einen Link ohne Inhalt oder Ziel | 2026-06-22 |
| WhatsApp-Button (`wa.me`-Link) entfernt, ersetzt durch Copy-Button | Nutzerwunsch im Refine — kanalunabhängig (auch ohne Telefonnummer nutzbar, nicht nur WhatsApp), einfacher als Auto-Log-Erkennung beim Senden | 2026-06-24 |
| Kein Auto-Log beim Senden, Nutzer loggt weiterhin manuell über "Kontaktiert" | Es gibt keinen verlässlichen Signal, dass eine kopierte Nachricht tatsächlich versendet wurde — Komplexität/Fehleranfälligkeit eines Erkennungsmechanismus steht in keinem Verhältnis zum Nutzen | 2026-06-24 |
| Schreibstil-Lernen nutzt bis zu 5 jüngste Interaktions-Notizen >20 Zeichen über ALLE Kontakte des Nutzers, kein neues Feld für den exakten gesendeten Text | Notizen pro einzelnem Kontakt oft zu wenige für Few-Shot-Beispiele; Mindestlänge filtert reine Stichwort-Notizen ("Kurzer Call") aus, die nicht als Stilbeispiel taugen; kein Zusatzfeld, um Quick-Add-Ziel aus PRD nicht zu gefährden | 2026-06-24 |
| "Diese Woche" (7 Tage) wird zu "Nächste 14 Tage" (7→14 Tage), Karten darin chronologisch nach Anlassdatum sortiert | Nutzerwunsch: Vorschau soll weiter vorausschauen und in Reihenfolge zeigen, wann etwas anfällt, statt nur unsortiert "diese Woche" | 2026-06-28 |
| Neue eigene Sektion "Kürzlich erkannt" statt Einbau der Import-Events in "Heute & überfällig"/"Nächste 14 Tage" | Import-Events haben kein "Anlassdatum in der Zukunft" wie Follow-up/Geburtstag (sie sind bereits eingetretene, beim Import erkannte Veränderungen) — Mischen mit den datumssortierten Sektionen wäre semantisch falsch | 2026-06-28 |
| "Kontaktiert" auf einem Import-Event nutzt dieselbe Interaction-Logging-Aktion wie Follow-up/Geburtstag und markiert das Event dabei als dismissed | Konsistenz mit bestehendem Muster, kein zweiter Aktions-Typ nötig; Nutzerentscheidung im Refine-Interview | 2026-06-28 |
| Import-Events bleiben sichtbar bis manuell über "Kontaktiert" abgehakt, kein automatisches Zeitfenster-Ausblenden | Nutzerentscheidung im Refine-Interview — ein erkannter Jobwechsel soll nicht stillschweigend verschwinden, nur weil ein fixes Zeitfenster abgelaufen ist | 2026-06-28 |
| (Reverst Entscheidung von PROJ-10, 2026-06-28) Erkannte Jobwechsel/Beförderungen werden jetzt doch persistiert, in neuer Tabelle `contact_events` statt nur als flüchtiges Vorschau-Ergebnis | Nutzerwunsch: Erkenntnis aus einem Import soll auch nach Schließen des Import-Dialogs auf dem Dashboard sichtbar bleiben — das ging mit der ursprünglichen "nicht speichern"-Entscheidung nicht | 2026-06-28 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Neue Route-Gruppe mit gemeinsamem Layout für `/dashboard` + `/contacts` | Header (E-Mail/Logout) und Navigation sollen auf beiden Seiten gleich aussehen, ohne Code-Duplikation | 2026-06-22 |
| Middleware leitet eingeloggte Nutzer auf `/dashboard` statt `/` um | `/` wird nicht mehr selbst gerendert, Dashboard ist die einzige Landingpage | 2026-06-22 |
| Sektionen/Anlässe werden client-seitig aus bereits geladenen Kontakten berechnet, keine neue Datenbank-Logik | Gleiches Pattern wie PROJ-4 (Filter/Sortierung im Browser), Datenmenge eines persönlichen Netzwerks ist klein genug | 2026-06-22 |
| `birthday` als neue nullable Spalte an `contacts`, kein neues Datenmodell/Tabelle | Gleiches Erweiterungsmuster wie `city`/`phone` aus PROJ-3 | 2026-06-22 |
| Neue serverseitige API-Route für den Nachrichtenvorschlag (statt direktem Supabase-Client-Zugriff) | Erstmals wird ein AI-Provider-Schlüssel benötigt — der darf nicht im Browser landen, also zwingend eine Route, die die Nutzer-Session serverseitig prüft, bevor sie Kontaktdaten an den AI-Provider schickt | 2026-06-22 |
| AI-Anbindung über Vercel AI Gateway (generisches Modell-Strings-Format) statt direktem Provider-Paket | Anbieter bleibt austauschbar, ein Schlüssel/eine Abrechnung statt mehrerer Provider-Integrationen | 2026-06-22 |
| WhatsApp-Link (`wa.me`) und Kalender-Link (Google-Calendar-Add-Event-URL) sind reine clientseitig generierte Links, kein neues Package | Beides sind nur URL-Konstruktionen, keine Bibliothek nötig | 2026-06-22 |
| Import-Event-Karte als eigene, neue Komponente statt Wiederverwendung der bestehenden Anlass-Karte | Unterschiedliche Aktionen/Badges (kein Kalender-Link, andere Badge-Typen) — eine gemeinsame Komponente für zwei unterschiedliche Karten-Formen hätte mehr Spezialfall-Logik erzeugt als zwei einfache Komponenten | 2026-06-28 |
| Bestehende `/api/draft-message`-Route bekommt zwei zusätzliche, gültige Anlass-Typ-Werte ("Jobwechsel"/"Beförderung") statt einer zweiten Route | Gleiche Sicherheits-/Session-Prüfung, gleiche Kontakt-Ladelogik wird für alle vier Anlass-Typen wiederverwendet — nur der Prompt-Wortlaut unterscheidet sich (Detail für `/backend`) | 2026-06-28 |
| "Kürzlich erkannt" wird zwischen "Nächste 14 Tage" und der vollen Kontaktliste-Verlinkung positioniert, eigene Sektion, kein Vermischen mit den Badges der anderen Karten | Import-Events haben kein Datum in der Zukunft, auf das sich eine gemeinsame chronologische Sortierung stützen könnte — eigene Sektion vermeidet eine künstliche Sortierreihenfolge | 2026-06-28 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure

```
Geteiltes Layout (gilt für /dashboard und /contacts)
├── Header: "Eingeloggt als [E-Mail]" + Logout-Button (bestehend, nur verschoben)
├── Navigation: "Dashboard" | "Kontakte"
│
├── /dashboard (neue Default-Landingpage)
│   ├── Sektion "Heute & überfällig"
│   │   └── Anlass-Karte (pro Kontakt/Anlass)
│   │       ├── Name + Badge(s): "Follow-up" und/oder "Geburtstag"
│   │       ├── "Kontaktiert"-Button → öffnet bestehendes Interaction-Formular (PROJ-5), vorausgefüllt mit heute
│   │       ├── "Vorschlag"-Button → ruft neue API-Route auf, zeigt generierten Text inline an (mit Loading-/Fehler-State)
│   │       ├── "Per WhatsApp senden"-Button → öffnet `wa.me`-Link mit Telefonnummer + Vorschlagstext (deaktiviert ohne Telefonnummer oder ohne Vorschlag)
│   │       └── "Zum Kalender hinzufügen"-Link → öffnet Google-Calendar-Add-Event-URL (Titel + Datum je nach Anlass-Typ)
│   ├── Sektion "Diese Woche" (gleiche Karten-Struktur, gleiche Aktionen)
│   └── Empty State ("Alles im Blick — aktuell nichts Fälliges.")
│
└── /contacts (bisheriger Inhalt von "/", inhaltlich unverändert)
    └── ContactList (PROJ-3/4/5, wie bisher)
```

### Data Model (plain language)

`contacts` bekommt eine neue Spalte `birthday` (Datum, optional) — gleiches Muster wie die `city`/`phone`-Erweiterung aus PROJ-3. Keine neue Tabelle für "Anlässe": Dashboard berechnet beide Anlass-Typen (Follow-up fällig, Geburtstag in den nächsten 7 Tagen) direkt aus den bereits vorhandenen Spalten `next_followup_at` und `birthday`, im Browser, beim Laden der Seite.

Nachrichtenvorschläge werden nicht gespeichert — sie entstehen bei jedem Klick neu und existieren nur im Browser-Zustand der jeweiligen Karte.

### Tech Decisions (justified)

- **Neue Route-Gruppe mit gemeinsamem Layout:** `/dashboard` und `/contacts` teilen sich Header und Navigation. Ein gemeinsames Layout vermeidet, dass Logout-Logik und Nutzer-Anzeige zweimal gepflegt werden müssen.
- **Middleware-Anpassung statt Redirect-Seite:** Die bestehende Middleware (aus PROJ-2) prüft bereits den Login-Status bei jedem Request — sie um ein Redirect-Ziel zu erweitern (`/` → `/dashboard`) ist einfacher als eine zusätzliche Redirect-Seite zu bauen.
- **Anlass-Berechnung im Browser, nicht in der Datenbank:** Konsistent mit dem bestehenden Muster aus PROJ-4 (Filter/Sortierung der Kontaktliste passiert client-seitig). Eine Datenbank-Funktion wäre hier unnötiger Mehraufwand, da die Datenmenge klein bleibt.
- **Neue serverseitige API-Route nur für den AI-Nachrichtenvorschlag:** Alle bisherigen Features greifen direkt vom Browser auf Supabase zu (RLS regelt die Sicherheit). Für die KI-Anbindung geht das nicht, weil der Provider-Schlüssel niemals im Browser-Code stehen darf. Die neue Route prüft zuerst, ob der anfragende Nutzer eingeloggt ist und ob ihm der angefragte Kontakt überhaupt gehört, bevor sie dessen Notizen an den AI-Provider schickt.
- **Vercel AI Gateway statt direktem Provider-Paket:** Ein einziger Zugang für KI-Anfragen, Anbieter lässt sich später ohne Code-Umbau wechseln (z.B. von einem schnellen/günstigen auf ein leistungsfähigeres Modell), ein Abrechnungsort statt mehrerer Provider-Konten.
- **`wa.me`- und Kalender-Link ohne neue Bibliothek:** Beides sind standardisierte URL-Formate, die der Browser direkt öffnen kann — keine Notwendigkeit für ein zusätzliches Package.

### Dependencies (Packages)
- `ai` (Vercel AI SDK) — neu, für die serverseitige Generierung des Nachrichtenvorschlags über das AI Gateway
- Keine weiteren neuen Packages — Routing/Layout nutzt Next.js-Bordmittel, WhatsApp-/Kalender-Links sind reine URL-Strings, restliche UI nutzt bereits installierte shadcn/ui-Komponenten (`Card`, `Badge`, `Button`)

## Tech Design — Refine 2026-06-28 (14-Tage-Vorschau + Kürzlich erkannt)

### Component Structure

```
/dashboard
├── Sektion "Heute & überfällig" (unverändert)
│   └── Anlass-Karte (Follow-up/Geburtstag, unverändert)
├── Sektion "Nächste 14 Tage" (vorher "Diese Woche")
│   └── Anlass-Karte (gleiche Komponente wie bisher) — Fenster 7→14 Tage, Karten jetzt chronologisch nach Anlassdatum sortiert
├── Sektion "Kürzlich erkannt" (NEU — nur sichtbar, wenn mindestens ein offenes Import-Event existiert, sonst komplett ausgeblendet)
│   └── Import-Event-Karte (neue, eigenständige Komponente)
│       ├── Name + Badge(s): "Jobwechsel" und/oder "Beförderung" (mehrere offene Events desselben Kontakts werden zu einer Karte zusammengefasst)
│       ├── "Kontaktiert"-Button → öffnet bestehendes Interaction-Formular (PROJ-5); nach erfolgreichem Speichern werden alle offenen Events dieses Kontakts als erledigt markiert
│       └── "Vorschlag"-Button → ruft dieselbe bestehende AI-Route auf wie die Anlass-Karten (Route lernt die neuen Anlass-Typ-Werte "Jobwechsel"/"Beförderung")
└── Empty State (unverändert) — bezieht sich weiterhin nur auf "Heute & überfällig"/"Nächste 14 Tage"; "Kürzlich erkannt" hat keinen eigenen Empty-State, blendet sich bei null offenen Events einfach komplett aus
```

### Data Model (plain language)

Neue Tabelle `contact_events`: Jede Zeile gehört zu genau einem Kontakt und hält fest, welche Art von Veränderung erkannt wurde (Jobwechsel oder Beförderung), wann sie beim Import entdeckt wurde, und ob der Nutzer sie bereits bearbeitet hat (offen = noch nicht bearbeitet, erledigt = Zeitpunkt gesetzt, sobald "Kontaktiert" geklickt wurde). Ein Kontakt kann mehrere offene Zeilen gleichzeitig haben (z.B. zwei Imports nacheinander ohne Reaktion dazwischen).

Befüllt wird die Tabelle ausschließlich von PROJ-10 (beim Bestätigen eines Imports). PROJ-6 liest nur die offenen Zeilen und markiert sie beim Klick auf "Kontaktiert" als erledigt — schreibt also nie neue Zeilen, nur den Erledigt-Zeitpunkt auf bereits bestehenden.

Jede Zeile ist fest mit einem Kontakt verknüpft — wird der Kontakt gelöscht, verschwinden seine Events automatisch mit (keine verwaisten Datensätze). Der gleiche Schutzmechanismus wie bei `contacts`/`interactions` sorgt dafür, dass ein Nutzer ausschließlich seine eigenen Events sieht.

### Tech Decisions (justified)

- **Neue Tabelle statt neue Spalte am Kontakt:** Ein Kontakt kann mehrere offene Events gleichzeitig haben — eine einzelne Spalte könnte immer nur den letzten Stand abbilden, eine Historie mit mehreren offenen Einträgen bräuchte zwangsläufig eine eigene Tabelle.
- **Kein neuer API-Endpoint:** Schreiben passiert im selben direkten Datenbank-Zugriff, den PROJ-10 für den restlichen Import bereits nutzt; Lesen und Erledigt-Markieren passiert genauso direkt vom Dashboard aus wie bei Kontakten/Interaktionen. Die bestehende Zugriffsregel (gleiche wie bei allen anderen Tabellen) schützt automatisch mit.
- **Gruppierung mehrerer offener Events eines Kontakts im Browser:** Gleiches Muster wie die bestehende Kombination von Follow-up- und Geburtstags-Badge auf einer Anlass-Karte — keine neue Server-Logik nötig.
- **Sortierung der "Nächste 14 Tage"-Sektion im Browser:** Konsistent mit dem bestehenden Prinzip, dass alle Datums-Logik client-seitig auf bereits geladenen Daten läuft (kein neuer Datenbank-Sortier-Mechanismus).
- **"Kontaktiert" auf einer Import-Event-Karte nutzt dasselbe Interaction-Formular:** Ein Speichern-Klick löst zwei Effekte aus (Kontaktmoment loggen + Events erledigt markieren) statt zwei getrennte Aktionen anzubieten — weniger Bedienaufwand, ein bekanntes Formular.
- **"Vorschlag" ruft dieselbe bestehende AI-Route auf:** Sicherheits-/Session-Prüfung und Kontakt-Ladelogik bleiben identisch, nur der Prompt-Wortlaut unterscheidet sich je Anlass-Typ (Feinschliff in `/backend`) — vermeidet eine zweite, fast identische Route.

### Dependencies (Packages)
Keine neuen Packages — neue Tabelle nutzt dasselbe Supabase-Setup wie alle anderen, UI nutzt weiterhin bereits installierte shadcn/ui-Komponenten.

## QA Test Results

**Tested:** 2026-06-22
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### Routing & Grundgerüst
- [x] Login/`/` redirects to `/dashboard`
- [x] Nav link reaches `/contacts`

#### Sektionen & Anlass-Erkennung
- [x] Overdue follow-up → "Heute & überfällig" + Follow-up-Badge
- [x] Follow-up in 1–7 Tagen → "Diese Woche" + Follow-up-Badge
- [x] Geburtstag heute → "Heute & überfällig" + Geburtstag-Badge
- [x] Geburtstag in 1–7 Tagen (inkl. Jahreswechsel-Fall getestet) → "Diese Woche" + Geburtstag-Badge
- [x] Beide Anlässe im selben Zeitfenster → beide Badges auf einer Karte
- [x] Beide Anlässe in unterschiedlichen Zeitfenstern → zweimal, je ein Badge
- [x] Kein Anlass irgendwo → Empty-State "Alles im Blick — aktuell nichts Fälliges."
- [x] Kontakt ohne `next_followup_at`/`birthday` → erscheint nirgends

#### Kontaktiert-Aktion
- [x] Öffnet bestehendes Interaction-Formular, Datum auf heute vorausgefüllt
- [x] Speichern aktualisiert Dashboard, Kontakt verschwindet wenn neuer Termin außerhalb Fenster liegt

#### AI-Nachrichtenvorschlag
- [x] Generiert Text, zeigt ihn inline an (getestet mit gemocktem `/api/draft-message`, kein echter AI-Call nötig)
- [x] Loading-State ("Generiere...") während Anfrage läuft
- [x] Fehlerfall zeigt Fehlermeldung, Karte bleibt funktionsfähig (Kontaktiert-Button weiter nutzbar)
- [x] Erneutes Klicken ersetzt alten Vorschlag durch neuen

#### WhatsApp-Link
- [x] Mit Telefonnummer + generiertem Vorschlag → `wa.me`-Link mit Nummer + Text
- [x] Ohne Telefonnummer → Hinweis "Keine Telefonnummer hinterlegt" statt Link (siehe BUG-2 zum Timing dieses Hinweises)
- [x] Ohne generierten Vorschlag → kein nutzbarer WhatsApp-Button vorhanden

#### Kalender-Link
- [x] Follow-up-Anlass → Link mit Titel "Follow-up: [Name]" + korrektem Datum
- [x] Geburtstags-Anlass → Link mit Titel "Geburtstag: [Name]" + nächstem Vorkommen

#### Geburtstag-Feld
- [x] Speichern + Vorausfüllen beim erneuten Öffnen
- [x] Leeres Feld erlaubt, Kontakt wird trotzdem angelegt
- [x] Geburtsdatum in der Zukunft → Validierungsfehler, nicht gespeichert

**24/24 Acceptance Criteria passed.**

### Edge Cases Status

#### EC-1: Geburtstag jahresübergreifend (z.B. 28.12. → 02.01.)
- [x] Korrekt erkannt als "in den nächsten 7 Tagen" (getestet via Tagesoffset-Wrap)

#### EC-2: Follow-up überfällig + Geburtstag in genau 7 Tagen
- [x] Erscheint einmal in "Heute & überfällig" (nur Follow-up) und einmal in "Diese Woche" (nur Geburtstag)

#### EC-3: Telefonnummer im Freitext-Format
- [x] Wird vor `wa.me`-Link auf Ziffern normalisiert — **BUG-1:** führendes `+` wird ebenfalls entfernt, entgegen der dokumentierten Entscheidung "reine Ziffern (+ führendes `+`)". Funktional unkritisch, da `wa.me` beide Formate akzeptiert.

#### EC-4: Geburtstag = 29. Februar, Zieljahr kein Schaltjahr
- [ ] **BUG-3 (Low):** `nextBirthdayOccurrence` baut `new Date(year, 1, 29)`; in einem Nicht-Schaltjahr rollt JS das automatisch auf den 1. März. Nicht in den dokumentierten Edge Cases, geringe Praxisrelevanz.

#### EC-5: Zwei Kontakte mit identischem Geburtstag
- [x] Beide erscheinen unabhängig, keine Gruppierung (Logik ist pro-Kontakt, keine spezielle Behandlung nötig)

#### EC-6: Kontaktiert für Geburtstags-Anlass ohne fälliges Follow-up
- [x] Loggt Interaction normal, Geburtstags-Karte bleibt bis Fenster verstrichen (erwartetes Verhalten, da Geburtstag nicht "erledigt"-Zustand kennt)

### Security Audit Results
- [x] Authentication: `/dashboard`, `/contacts` und `/api/draft-message` nicht ohne Login erreichbar (Middleware redirected auf `/login`)
- [x] Authorization: Authentifizierter Nutzer kann keinen Draft für einen Kontakt einer fremden `user_id` erzeugen — RLS liefert korrekt 404 (verifiziert mit echtem fremden Kontakt aus einem anderen Account)
- [x] RLS auf `contacts`/`interactions` aktiv (verifiziert via Supabase Advisors + `list_tables`)
- [x] Kein API-Key/Secret im Client-Bundle (AI-Anbindung ausschließlich serverseitig in `/api/draft-message`)
- [x] Input validation: `contactId`/`occasionType` serverseitig per Zod validiert (400 bei Fehlformat)
- [ ] **BUG-4 (Informational):** Unauthentifizierte Requests an `/api/draft-message` werden von der Middleware abgefangen (307 → `/login`), bevor die Route ihren eigenen 401-Check erreicht. Kein Sicherheitsproblem (Zugriff bleibt blockiert), aber der 401-Zweig in `route.ts` ist über echten Browser-Traffic nie erreichbar — nur relevant für die Lesbarkeit/Wartung des Codes.
- Rate limiting: laut Spec bewusst kein MVP-Bedarf (Out-of-Scope-Entscheidung), nicht getestet

### Bugs Found

#### BUG-1: WhatsApp-Link entfernt führendes "+" entgegen Spec-Entscheidung — FIXED
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Kontakt mit Telefonnummer `+49 151 234 567` anlegen, Follow-up/Geburtstag-Anlass erzeugen
  2. Auf Dashboard "Vorschlag" klicken, dann "Per WhatsApp senden" öffnen
  3. Expected (laut Decision Log/Edge Cases): Link enthält `wa.me/+49151234567` (führendes `+` erhalten)
  4. Actual (vor Fix): Link enthält `wa.me/49151234567` (kein `+`) — `normalizePhoneForWhatsApp` in `src/lib/external-links.ts:1-3` nutzte `replace(/[^\d]/g, '')`, das entfernte auch `+`
- **Fix:** `normalizePhoneForWhatsApp` (`src/lib/external-links.ts`) behält ein führendes `+`, wenn die Eingabe damit beginnt, und entfernt alle übrigen Nicht-Ziffern. Test `tests/PROJ-6-follow-up-dashboard.spec.ts` ("WhatsApp link includes phone + draft text") aktualisiert, erwartet jetzt `wa.me/+49151234567`.

#### BUG-2: "Keine Telefonnummer hinterlegt"-Hinweis erscheint erst nach Vorschlag-Generierung — FIXED
- **Severity:** Low
- **Steps to Reproduce:**
  1. Kontakt ohne Telefonnummer mit aktivem Anlass auf Dashboard anzeigen
  2. Expected (AC-Wortlaut: "wenn die Karte angezeigt wird, dann ist der WhatsApp-Button deaktiviert mit Hinweis..."): Hinweis sichtbar sobald Karte angezeigt wird
  3. Actual (vor Fix): Vor Klick auf "Vorschlag" ist weder Button noch Hinweis sichtbar — Hinweis erschien erst nachdem ein Vorschlag generiert wurde (`src/components/occasion-card.tsx:96-112`)
- **Fix:** Hinweis ist jetzt ein eigener Block in `occasion-card.tsx`, unabhängig vom Vorschlag-State — sichtbar sobald die Karte ohne Telefonnummer gerendert wird, bleibt auch nach Vorschlag-Generierung sichtbar (WhatsApp-Button erscheint nur, wenn `contact.phone` gesetzt ist). Test "missing phone shows hint instead of WhatsApp link" prüft jetzt Sichtbarkeit vor UND nach Klick auf "Vorschlag".

#### BUG-3: Geburtstag 29. Februar rollt in Nicht-Schaltjahren auf 1. März — FIXED
- **Severity:** Low
- **Steps to Reproduce:**
  1. Kontakt mit `birthday = 19XX-02-29` anlegen
  2. Dashboard in einem Jahr laden, in dem der 29.2. nicht existiert
  3. Expected: sinnvolle Behandlung (z.B. 28.2. oder 1.3., je nach Produktentscheidung)
  4. Actual (vor Fix): `nextBirthdayOccurrence` (`src/lib/occasions.ts:20-27`) übergab `29` direkt an `new Date(year, 1, 29)`, JS normalisierte das in Nicht-Schaltjahren automatisch auf den 1. März — kein Crash, aber nicht explizit entschieden/dokumentiert
- **Fix:** `nextBirthdayOccurrence` (`src/lib/occasions.ts`) ermittelt jetzt explizit per `isLeapYear`/`resolveBirthdayDay`, ob der 29.2. im jeweiligen Jahr existiert, und fällt sonst bewusst auf den 28.2. zurück (statt impliziter JS-Date-Normalisierung auf 1.3.).

#### BUG-4: 401-Zweig in `/api/draft-message` über Browser-Traffic unerreichbar
- **Severity:** Informational
- **Steps to Reproduce:**
  1. Unauthentifizierten POST-Request an `/api/draft-message` senden
  2. Expected laut Route-Code: 401 JSON `{error: "Nicht eingeloggt."}`
  3. Actual: Middleware (`src/middleware.ts`) fängt den Request vorher ab und liefert 307 → `/login`, da der Matcher auch `/api/*` einschließt
- **Priority:** Nice to have (kein Sicherheitsrisiko, da Zugriff weiterhin blockiert ist — nur der dedizierte 401-Pfad in der Route ist faktisch totes Code für echten Traffic)

### Regression & Test Infra Notes
- `npm test` (7/7), `npm run lint`, `npm run build` fehlerfrei
- Volle E2E-Regression (PROJ-3/4/5/6, 59 Tests) mit `--workers=1` 100% grün
- Mit Standard-Parallelausführung (`fullyParallel`, mehrere Worker) traten in PROJ-3/4/5 vereinzelt Login-Fehlschläge auf ("Email oder Passwort falsch.") — verursacht durch Supabase-Auth-Rate-Limiting bei vielen parallelen Password-Grant-Logins, **keine PROJ-6-Regression** (mit `--workers=1` reproduzierbar 100% stabil). Empfehlung: CI ggf. mit reduzierter Worker-Zahl für Auth-schwere Specs laufen lassen.
- Neue Datei `tests/PROJ-6-follow-up-dashboard.spec.ts` (24 Tests) deckt alle Acceptance Criteria + 2 Security-Checks ab, AI-Calls werden über `page.route` gemockt (kein echter/kostenpflichtiger AI-Gateway-Call in Tests)

### Summary
- **Acceptance Criteria:** 24/24 passed
- **Bugs Found:** 4 total (0 critical, 0 high, 1 medium, 2 low, 1 informational)
- **Security:** Pass (Auth, RLS-Authorization, Secret-Handling, Input-Validation alle bestanden)
- **Production Ready:** YES
- **Recommendation:** Deploy. BUG-1/2/3 sind optionale Polish-Items, kein Blocker.

## QA Test Results — Refine 2026-06-24 (Copy-Button + Schreibstil-Lernen)

**Tested:** 2026-06-24
**App URL:** http://localhost:3000 (Dev), echter Anthropic-Call gegen Produktions-Supabase-Projekt verifiziert
**Tester:** QA Engineer (AI)

### Scope
Nur die Delta-Änderungen aus dem Refine: WhatsApp-Button → Copy-Button, Schreibstil-Lernen im AI-Prompt. Restliche Acceptance Criteria bereits oben (2026-06-22) verifiziert und durch Regressionslauf erneut bestätigt.

### Acceptance Criteria Status

#### Kopieren-Button
- [x] Vorschlag generiert + Klick auf "Kopieren" → Text in Zwischenablage, Button-Label wechselt kurz zu "Kopiert!" (E2E mit `context.grantPermissions(['clipboard-read','clipboard-write'])`, `navigator.clipboard.readText()` verifiziert exakten Inhalt)
- [x] Kein Vorschlag generiert → Kopieren-Button nicht vorhanden, unabhängig davon ob Telefonnummer hinterlegt ist
- [ ] Zwischenablage nicht verfügbar/erlaubt → Fehlermeldung (`copyError`-State implementiert, code-reviewed; **nicht automatisiert getestet**, da Playwright-Permission-Denial für Clipboard nicht zuverlässig simulierbar ist — Risiko gering, reiner Fallback-Pfad)

#### Schreibstil-Lernen
- [x] ≥1 Notiz >20 Zeichen über alle Kontakte → bis zu 5 jüngste als Few-Shot-Beispiele im Prompt (Vitest: `includes style examples (>20 chars, max 5)...`, prüft `generateText`-Aufrufparameter direkt)
- [x] Keine Notiz erfüllt Mindestlänge → Generierung läuft ohne Stilbeispiele, kein Fehler (Vitest: `generates without style examples...`)
- [x] **Echter End-to-End-Verifikation:** Testkontakt mit Notiz "Hey du, mega cool dass wir gequatscht haben, lass uns bald wieder telen!" angelegt, echter `/api/draft-message`-Call (kein Mock) → 200, generierter Text übernahm erkennbar Tonalität/Wortwahl der Notiz ("Hey [Name], mega cool dass wir uns austauschen, lass uns bald wieder absprechen!"). Bestätigt: Supabase-Query (`.not('note','is',null)`) und Prompt-Injection funktionieren gegen echte DB/echten Anthropic-Call, kein Crash. Testdaten danach bereinigt.

**5/6 Acceptance Criteria automatisiert verifiziert, 1 manuell/code-reviewed (Clipboard-Fehlerfall).**

### Edge Cases Status
- [x] Clipboard-API nicht verfügbar → Fehlermeldung statt stillem No-Op (Code-Review: `try/catch` um `navigator.clipboard.writeText`, setzt `copyError`)
- [x] Kein Account mit Notizen >20 Zeichen → Vorschlag wird trotzdem generiert (siehe AC oben)

### Security Audit Results
- [x] Schreibstil-Query (`interactions` ohne `contactId`-Filter) bleibt durch bestehende RLS aus PROJ-1 auf `auth.uid()` beschränkt — kein expliziter User-Filter im Code nötig, gleiches Muster wie alle anderen Queries in diesem Projekt. Stichprobe: Query liefert ausschließlich Notizen des eingeloggten Test-Accounts.
- [x] Kein neues Secret/Package — `navigator.clipboard` ist Browser-API, kein externer Code
- [x] Keine neue Angriffsfläche durch Entfernen des WhatsApp-Buttons (reine Funktionsreduktion)

### Bugs Found
Keine neuen Bugs gefunden.

### Regression Testing
- `npm test`: 36/36 grün (34 bestehend + 2 neue für Stil-Lernen-Prompt-Logik)
- `npm run lint`, `npm run build`: fehlerfrei
- E2E `tests/PROJ-6-follow-up-dashboard.spec.ts`: 23/23 grün (`--workers=1`)
- E2E Regression PROJ-3/4/5 (32 Tests, `--workers=1`): 100% grün, keine Auswirkung durch PROJ-6-Änderungen

### Summary
- **Acceptance Criteria (Delta):** 5/6 automatisiert + 1 code-reviewed, alle bestanden
- **Bugs Found:** 0
- **Security:** Pass
- **Production Ready:** YES
- **Recommendation:** Deploy

## QA Test Results — Refine 2026-06-28 ("Karte öffnen" + Geburtstagsdatum)

**Tested:** 2026-06-28
**App URL:** http://localhost:3000 (Dev)
**Tester:** QA Engineer (AI)

### Scope
Nutzerwunsch (Chat, kein formaler `/refine`): Anlass-Karten auf dem Dashboard sollen erlauben, die Kontaktkarte (`ContactFormDialog`) trotz Geburtstags-/Follow-up-Trigger direkt zu öffnen, und das Geburtstagsdatum soll lesbar auf der Karte stehen. Beides additiv, keine bestehende AC verändert.

### Acceptance Criteria Status (neu)
- [x] Angenommen eine Anlass-Karte hat das Badge "Geburtstag", wenn die Karte angezeigt wird, dann steht das Geburtstagsdatum (de-DE formatiert) lesbar auf der Karte
- [x] Angenommen eine Anlass-Karte wird angezeigt (Follow-up und/oder Geburtstag), wenn der Nutzer auf "Karte öffnen" klickt, dann öffnet sich der bestehende `ContactFormDialog` (PROJ-3) vorausgefüllt mit dem Kontakt dieser Karte
- [x] Angenommen der `ContactFormDialog` wurde vom Dashboard aus geöffnet, wenn der Nutzer speichert oder abbricht, dann schließt sich der Dialog und das Dashboard lädt die Kontakte neu (Karte verschwindet, falls der Anlass dadurch außerhalb des Zeitfensters fällt)

### Regression
- `npm test`: 50/50 grün (Vitest)
- `npm run lint`, `npm run build`: fehlerfrei
- E2E `tests/PROJ-6-follow-up-dashboard.spec.ts`: 25/25 grün auf Chromium (2 neue Tests: "occasion card shows the formatted birthday date", "'Karte öffnen' opens the contact's edit dialog pre-filled with that contact"), bestehende 23 ACs weiterhin grün → keine Regression
- Cross-Browser: Mobile-Safari-Projekt hat 1 **vorbestehenden** Fail (`copy button copies draft text...`, `context.grantPermissions: Unknown permission: clipboard-write`) — WebKit/Playwright unterstützt diese Permission nicht, unabhängig von dieser Änderung, nicht neu eingeführt. Nicht blockierend für diesen Scope.

### Security Audit
- [x] Keine neue Angriffsfläche: "Karte öffnen" rendert denselben `ContactFormDialog`, der bereits auf `/contacts` genutzt wird, mit demselben clientseitig schon geladenen (RLS-gefilterten) Kontakt-Objekt — kein zusätzlicher Datenzugriff, kein neuer Server-Call

### Bugs Found
Keine.

### Out of Scope für diese Runde
- `src/app/api/draft-message/route.ts` war bereits vor dieser Session uncommitted verändert (Prompt nutzt jetzt zusätzlich Nachname/Arbeitgeber/Jobtitel/Stadt/Kategorie/Stärke als Kontext) — gehört nicht zum hier angefragten Feature und wurde in dieser QA-Runde nicht geprüft. Vor Deploy separat testen (echter AI-Call, Datenleck-Check: dürfen nur eigene Kontaktfelder in den Prompt).

### Summary
- **Acceptance Criteria (Delta):** 3/3 passed
- **Bugs Found:** 0
- **Security:** Pass
- **Production Ready:** YES (für diesen Scope)
- **Recommendation:** Deploy. `draft-message/route.ts`-Änderung separat verifizieren vor `/deploy`.

## Deployment
- **Production URL:** https://bambi-w26q.vercel.app
- **Deployed:** 2026-06-22
- **Verified in production:** Login → `/dashboard` redirect works, empty-state renders correctly, auth gate on `/dashboard` and `/api/draft-message` returns 307 → `/login` for unauthenticated requests, no console/page errors.

### Update 2026-06-24 (Refine: Copy-Button + Schreibstil-Lernen)
- Commit `5e94cf5` gepusht zu `origin/main`, Tag `v1.7.0-PROJ-6`
- Vercel-Build erfolgreich (43s), Deployment `Ready`, Production
- `https://bambi-w26q.vercel.app/login` mit 200 verifiziert

### Update 2026-06-28 (Refine: "Karte öffnen" + Geburtstagsdatum + reicherer AI-Draft-Kontext)
- Commit `07ed6a8` gepusht zu `origin/main`
- Vercel-Build erfolgreich (47s), Deployment `Ready`, Production
- `https://bambi-w26q.vercel.app/login` mit 200 verifiziert
- `src/app/api/draft-message/route.ts`-Änderung (Nachname/Arbeitgeber/Jobtitel/Stadt/Kategorie/Stärke als Prompt-Kontext) ging mit diesem Deploy live, war vor Deploy nicht separat QA-getestet (Nutzerentscheidung: "Beides deployen")
