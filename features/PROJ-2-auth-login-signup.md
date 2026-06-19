# PROJ-2: Auth (Login)

## Status: Planned
**Created:** 2026-06-19
**Last Updated:** 2026-06-19

## Dependencies
- PROJ-1 (Supabase Infrastructure Setup) — benötigt Supabase-Client + Projekt für `auth.users`

## User Stories
- Als Nutzer möchte ich mich mit Email/Passwort einloggen, damit ich auf meine Kontakte und Interaktionen zugreifen kann
- Als Nutzer möchte ich mich ausloggen können, damit meine Session auf einem geteilten Gerät nicht offen bleibt
- Als nicht-eingeloggter Nutzer möchte ich beim Versuch, eine geschützte Seite aufzurufen, automatisch zum Login weitergeleitet werden, damit ich nicht versehentlich auf leere/fehlerhafte Inhalte stoße
- Als Nutzer möchte ich bei falschen Login-Daten eine klare Fehlermeldung sehen, damit ich weiß, dass ich mich vertippt habe (statt eines stillen Fehlschlags)

## Out of Scope
- Öffentliches Signup-Formular — Account wird einmalig manuell über Supabase Dashboard/CLI angelegt, da Solo-Projekt (laut PRD: "der Nutzer selbst" als einziger Target User)
- Passwort-Reset / "Passwort vergessen" — bei Bedarf direkt im Supabase-Dashboard zurückgesetzt, kein Self-Service-Email-Flow für MVP
- Social Login (Google/GitHub etc.) — nicht angefragt, Email/Passwort reicht für Solo-Nutzung
- Eigene Header/Nav-Komponente — Logout-Button liegt vorerst auf der Platzhalter-Startseite, zieht erst mit PROJ-4/PROJ-6 in ein echtes Layout um
- Mehrfaktor-Authentifizierung (2FA) — kein Bedarf bei 1 Account, kann später nachgerüstet werden
- Echter Dashboard-Inhalt nach Login — Platzhalter-Startseite bis PROJ-4 (Kontaktliste) / PROJ-6 (Follow-up Dashboard) existieren

## Acceptance Criteria

- [ ] Angenommen ein Account existiert in Supabase Auth, wenn der Nutzer korrekte Email/Passwort eingibt und auf "Login" klickt, dann wird er eingeloggt und zur Platzhalter-Startseite (`/`) weitergeleitet
- [ ] Angenommen der Nutzer gibt falsche Email/Passwort-Kombination ein, wenn er "Login" klickt, dann erscheint eine klare Fehlermeldung ("Email oder Passwort falsch") ohne dass die Eingabefelder geleert werden
- [ ] Angenommen der Nutzer lässt ein Pflichtfeld (Email oder Passwort) leer, wenn er "Login" klickt, dann wird eine Validierungsfehlermeldung pro leerem Feld angezeigt, kein Request an Supabase wird gesendet
- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er eine geschützte Route direkt per URL aufruft, dann wird er automatisch zu `/login` weitergeleitet
- [ ] Angenommen der Nutzer ist eingeloggt, wenn er `/login` direkt aufruft, dann wird er automatisch zur Startseite (`/`) weitergeleitet statt das Login-Formular erneut zu sehen
- [ ] Angenommen der Nutzer ist eingeloggt, wenn er auf "Logout" klickt, dann wird seine Session beendet und er landet auf `/login`
- [ ] Angenommen die Supabase-API ist während des Login-Versuchs nicht erreichbar (Netzwerkfehler/Timeout), wenn der Nutzer "Login" klickt, dann erscheint eine Fehlermeldung und die eingegebenen Werte bleiben im Formular erhalten

## Edge Cases
- Doppelter Klick auf "Login" während Request läuft → Button muss disabled sein (Loading-State), kein doppelter Request
- Session läuft während aktiver Nutzung ab (Token-Expiry) → Supabase-Client refresht automatisch im Hintergrund; falls Refresh fehlschlägt, nächster geschützter Request/Redirect wirft Nutzer zu `/login`
- Nutzer löscht Cookies/localStorage manuell während Session aktiv → wird beim nächsten Seitenaufruf als nicht eingeloggt behandelt, Redirect zu `/login`
- Brute-Force-Versuche auf Login → abgefangen durch Supabases eingebautes Rate-Limiting auf Auth-Endpunkten, keine zusätzliche App-seitige Logik nötig
- Whitespace in Email-Eingabe (z.B. versehentliches Leerzeichen am Ende) → vor Request trimmen

## Technical Requirements
- Security: Route-Schutz via Next.js Middleware (`middleware.ts`), prüft Supabase-Session bei jedem Request auf geschützten Pfaden
- Security: Keine Klartext-Passwörter im Client-State länger als nötig halten, kein Logging von Passwort-Feldern
- Auth Best Practice: `window.location.href` für Post-Login-Redirect verwenden (nicht `router.push`), `data.session` vor Redirect verifizieren, Loading-State in allen Pfaden (Erfolg/Fehler/Finally) zurücksetzen

## Open Questions
_Keine offenen Fragen — siehe Decision Log._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Kein öffentliches Signup-Formular | Solo-Projekt, PRD nennt nur "der Nutzer selbst" als Target User — Account einmalig manuell anlegen reicht, kleinere Angriffsfläche als offene Registrierung | 2026-06-19 |
| Kein Passwort-Reset-Flow | Nur 1 Account, Dashboard-Reset bei Bedarf ausreichend, spart Email-Template-Setup für MVP | 2026-06-19 |
| Redirect-Ziel nach Login: Platzhalter-Startseite (`/`) statt eigene `/dashboard`-Route | Vermeidet Leerlauf-Route ins Nichts, da echter Dashboard-Inhalt erst PROJ-4/PROJ-6 liefert | 2026-06-19 |
| Logout-Button auf Platzhalter-Startseite statt eigene Nav-Komponente | Vermeidet doppelte Arbeit — echtes Layout kommt mit PROJ-4/PROJ-6 | 2026-06-19 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Route-Schutz via Next.js Middleware statt Client-seitigem Check pro Seite | Zentrale Durchsetzung, greift auch bei direktem URL-Aufruf, kein Content-Flash vor Redirect, Standard-Pattern für Supabase+Next.js | 2026-06-19 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
