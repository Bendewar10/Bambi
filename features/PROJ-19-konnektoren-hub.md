# PROJ-19: Konnektoren-Hub (OAuth Integration Settings)

## Status: Planned
**Created:** 2026-07-01
**Last Updated:** 2026-07-01

## Dependencies
- PROJ-1 (Supabase Infrastructure) — Token-Speicherung in Supabase
- PROJ-2 (Auth) — User muss eingeloggt sein; Tokens sind user-scoped

## User Stories
- Als MBB-Berater möchte ich mein Google-Konto verbinden, damit zukünftige Features (City-Trip, Rolloff-Wizard) auf meinen Kalender und meine Mails zugreifen können — ohne dass ich diese Daten manuell eingeben muss.
- Als Nutzer möchte ich auf einen Blick sehen, welche Konnektoren ich verbunden habe und welche verfügbar sind, damit ich den Überblick über meine Datenzugriffe behalte.
- Als Nutzer möchte ich eine Verbindung jederzeit trennen können, damit meine Daten sofort widerrufen werden und ich die Kontrolle behalte.
- Als Nutzer möchte ich sehen, mit welchem Google-Konto ich verbunden bin, damit ich sichergehe, dass das richtige Konto verknüpft ist.
- Als zukünftiger Nutzer möchte ich sehen, welche Konnektoren geplant sind (Coming Soon), damit ich weiß, was die App noch können wird.

## Out of Scope
- **Daten-Konsum aus verbundenen Diensten** — PROJ-19 verbindet nur. Kalender-Events lesen, Emails auswerten etc. kommen in PROJ-13 (Rolloff-Wizard) und PROJ-14 (City-Trip-Modus).
- **Microsoft Outlook / Azure OAuth** — separate App Registration, höherer Aufwand. Wird als "Coming Soon" geteasert, Implementierung in späterem PROJ.
- **Apple iCloud Kalender** — kein Standard-OAuth, proprietäres CalDAV. Roadmap.
- **WhatsApp Business API** — kein OAuth-Connector-Pattern. Roadmap.
- **Granulare Scope-Auswahl durch den Nutzer** — User wählt nicht einzeln zwischen Calendar und Gmail; beide Scopes werden in einem Google-Consent-Screen gebündelt.
- **Background-Cron für Token-Refresh** — Token wird on-demand refreshed wenn ein Feature ihn braucht, nicht proaktiv.
- **Admin-Übersicht aller User-Verbindungen** — Single-User-App, kein Admin-Panel.
- **Webhook-Subscriptions / Push-Notifications von Google** — reine Pull-Architektur für MVP.

## Acceptance Criteria

### Konnektoren-Seite
- [ ] Angenommen der Nutzer ist eingeloggt, wenn er `/einstellungen/konnektoren` aufruft, dann sieht er eine Seite mit allen verfügbaren Konnektoren als Cards.
- [ ] Angenommen kein Konnektor ist verbunden, wenn der Nutzer die Seite aufruft, dann zeigt jede Card einen "Verbinden"-Button und keinen verbundenen Account-Namen.
- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er die Seite aufruft, dann wird er zur Login-Seite weitergeleitet.

### Sidebar-Navigation
- [ ] Angenommen der Nutzer ist eingeloggt, wenn er die Sidebar öffnet, dann sieht er einen "Einstellungen"-Eintrag mit Unterseite "Konnektoren".
- [ ] Angenommen Google verbunden ist, wenn der Nutzer in der Sidebar "Konnektoren" sieht, dann wird ein visueller Indikator (Badge/Dot) angezeigt dass mindestens ein Konnektor aktiv ist.

### Google OAuth Connect-Flow
- [ ] Angenommen der Nutzer ist auf der Konnektoren-Seite, wenn er auf "Google verbinden" klickt, dann wird er zum Google OAuth Consent Screen weitergeleitet mit Scopes `calendar.readonly` und `gmail.readonly`.
- [ ] Angenommen der Nutzer hat den Google Consent erteilt, wenn Google zum Callback zurückleitet, dann werden Access Token, Refresh Token, Ablaufzeit und verbundene Google-Email in Supabase gespeichert.
- [ ] Angenommen der OAuth erfolgreich war, wenn der Nutzer zurück zur Konnektoren-Seite kommt, dann zeigt die Google-Card: verbundene Email-Adresse + "Verbunden seit [Datum]" + "Trennen"-Button.
- [ ] Angenommen der Nutzer den Google Consent abbricht, wenn Google zum Callback zurückleitet, dann wird kein Token gespeichert und die Konnektoren-Seite zeigt "Verbindung abgebrochen" als Toast.
- [ ] Angenommen ein ungültiger OAuth-State-Parameter zurückkommt, wenn der Callback aufgerufen wird, dann wird der Request abgelehnt (CSRF-Schutz) und dem Nutzer eine Fehlermeldung angezeigt.

### Google Disconnect
- [ ] Angenommen Google verbunden ist, wenn der Nutzer auf "Trennen" klickt, dann erscheint ein Bestätigungsdialog ("Google-Verbindung trennen — Alle gespeicherten Tokens werden gelöscht.").
- [ ] Angenommen der Nutzer die Trennung bestätigt, wenn er auf "Ja, trennen" klickt, dann wird der Token in Supabase gelöscht UND Google OAuth Revoke aufgerufen.
- [ ] Angenommen die Trennung erfolgreich war, wenn der Revoke abgeschlossen ist, dann zeigt die Google-Card wieder den initialen Zustand mit "Verbinden"-Button.
- [ ] Angenommen der Google Revoke-Call schlägt fehl (Netzwerkfehler), wenn der Nutzer trennt, dann wird der Token trotzdem aus Supabase gelöscht (local-first) und dem Nutzer eine Warnung angezeigt ("Lokal getrennt — Google-Widerruf fehlgeschlagen, bitte manuell in Google-Kontoeinstellungen widerrufen.").

### Coming Soon Konnektoren
- [ ] Angenommen der Nutzer die Seite aufruft, dann sieht er Microsoft Outlook als Card mit "Coming Soon"-Badge und deaktiviertem Button.
- [ ] Angenommen der Nutzer auf den deaktivierten Outlook-Button klickt, dann passiert nichts (Button ist disabled).

### Token-Sicherheit
- [ ] Angenommen ein Token in Supabase gespeichert wird, dann ist er über RLS nur für den eigenen User lesbar — kein anderer User kann fremde Tokens lesen oder schreiben.
- [ ] Angenommen der Nutzer seinen Account löscht, dann werden alle seine Connector-Tokens kaskadierend gelöscht (ON DELETE CASCADE).

## Edge Cases
- **Gleicher User verbindet zweimal:** Zweiter Connect-Flow überschreibt bestehenden Token (UPSERT) — kein doppelter Eintrag.
- **User verbindet anderes Google-Konto:** Token + Email werden überschrieben, altes Konto automatisch ersetzt. Kein Fehler, aber Card zeigt neue Email.
- **Access Token abgelaufen:** Downstream-Feature (PROJ-13/14) triggert Silent Refresh mit Refresh Token. Wenn Refresh Token auch ungültig → Nutzer sieht Hinweis "Google-Verbindung abgelaufen, bitte neu verbinden" auf Konnektoren-Seite.
- **Google widerruft Refresh Token** (z.B. User hat in Google-Settings manuell getrennt): Nächster API-Call schlägt mit 401 fehl → Token in Supabase als `status: 'expired'` markieren → Nutzer sieht Badge "Neu verbinden" auf Card.
- **OAuth Callback ohne aktive Session** (Tab geschlossen, Session abgelaufen während OAuth-Flow): Callback leitet zu Login, danach Redirect zurück zu `/einstellungen/konnektoren`.
- **Netzwerkfehler während Connect:** OAuth-State in Session geht nicht verloren, Nutzer kann erneut versuchen zu verbinden.

## Technical Requirements
- **Sicherheit:** OAuth State-Parameter (CSRF) — zufälliger Token in Server-Side Session, validiert im Callback
- **Token-Speicherung:** Supabase Tabelle `connector_tokens` — RLS strict user-scoped
- **Verschlüsselung:** Access Token + Refresh Token verschlüsselt at rest (Supabase Vault oder pgcrypto) — nicht im Klartext in DB
- **Extensibilität:** Connector-Registry als statisches Config-Objekt (z.B. `src/lib/connectors/registry.ts`) — neuer Konnektor = neuer Eintrag im Registry-Objekt + OAuth-Handler. Keine DB-Schema-Änderung nötig für neue Konnektoren.
- **Kein Token im Client:** Access/Refresh Tokens fließen nur Server-Side (API Routes) — nie zum Browser
- **Google OAuth:** Offline Access (`access_type=offline`, `prompt=consent`) — garantiert Refresh Token bei erstem Connect

## Open Questions
- [ ] Google OAuth Verification: App braucht Google Review für `gmail.readonly` Scope in Production (Sensitive Scope). Zeitaufwand ~1-4 Wochen. Soll MVP zunächst im "Testing"-Modus deployed werden (max. 100 Test-User)?
- [ ] Supabase Vault vs. pgcrypto: Welche Encryption-Methode für Token-Storage? Vault ist Supabase-nativ aber Beta; pgcrypto ist stabil aber mehr Setup.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| PROJ-19 = reine Verbindungs-Verwaltung, kein Daten-Konsum | Klare Trennung: Infrastructure in PROJ-19, Use Cases in PROJ-13/14. Unabhängig testbar und deploybar. | 2026-07-01 |
| MVP: nur Google (Calendar + Gmail) in einem OAuth-Flow | Outlook = separate Azure App Registration, höherer Aufwand. Google deckt Primär-Use-Cases ab. | 2026-07-01 |
| Beide Google Scopes in einem Consent-Screen gebündelt | User soll nicht zwischen Calendar und Gmail wählen — zu komplex, zu viele Erklärungen nötig. Einmal verbinden, alles freigeschaltet. | 2026-07-01 |
| Disconnect: sofort löschen + Google Revoke | Kein Soft-Delete — User erwartet vollständige Kontrolle. Datensparsamkeit. | 2026-07-01 |
| Silent on-demand Token-Refresh (kein Cron) | PROJ-19 selbst braucht keine Daten — Refresh-Logik gehört in die Features die Daten konsumieren (PROJ-13/14). | 2026-07-01 |
| Outlook als "Coming Soon" teasern | Nutzer soll sehen dass Extensibilität geplant ist. Keine falschen Erwartungen. | 2026-07-01 |
| Connector-Registry als statisches Config-Objekt | Neuer Konnektor = eine Zeile in Registry. Kein DB-Schema-Änderung, kein Migration-Aufwand. | 2026-07-01 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
