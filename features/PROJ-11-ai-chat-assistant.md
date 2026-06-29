# PROJ-11: AI Chat Assistant (Sidebar-Popup)

## Status: In Progress
**Created:** 2026-06-29
**Last Updated:** 2026-06-29 (Frontend)

## Dependencies
- PROJ-3 (Kontakt anlegen & verwalten) — Chat liest/schreibt Contact-Daten
- PROJ-5 (Interaktions-Log) — Chat liest/schreibt Interaction-Daten

## User Stories
- Als Nutzer möchte ich über ein Chat-Popup Fragen zu einzelnen Kontakten stellen können (z.B. "Wann hatte ich zuletzt Kontakt mit Tom?"), damit ich nicht manuell in der Kontaktliste suchen muss.
- Als Nutzer möchte ich aggregierte/übergreifende Fragen stellen können (z.B. "Wer hat im Juli Geburtstag?", "Wie viele Business-Kontakte sind überfällig?"), damit ich einen schnellen Überblick über mein gesamtes Netzwerk bekomme.
- Als Nutzer möchte ich per Chat-Nachricht Interaktionen loggen können (z.B. "Hab grad mit Anna telefoniert, log das"), damit ich nicht extra das Interaktions-Formular öffnen muss.
- Als Nutzer möchte ich per Chat Follow-up-Termine setzen können (z.B. "Erinnere mich in 2 Wochen an Tom"), damit Nachfass-Planung schneller geht als über die UI.
- Als Nutzer möchte ich per Chat neue Kontakte anlegen und bestehende Felder ändern können, damit Datenpflege auch unterwegs per Chat möglich ist.
- Als Nutzer möchte ich, dass der Chat bei riskanten Aktionen (Löschen, Überschreiben vorhandener Werte) erst nachfragt, damit mir keine Daten versehentlich verloren gehen.
- Als Nutzer möchte ich den Chat-Verlauf über Sessions hinweg wiederfinden, damit ich an frühere Unterhaltungen anknüpfen kann.

## Out of Scope
- Team-/Multi-User-Features (kein Team-Feature laut PRD)
- Automatisches Scoring/Ranking von Kontakten durch den Chat (Non-Goal aus PRD — Tier/Intervall bleiben manuell, Chat setzt sie nur auf expliziten Nutzerwunsch)
- LinkedIn-Sync oder externe Datenquellen im Chat (Non-Goal aus PRD)
- Tageslimit/Rate-Limiting für Nachrichten (v1 ohne Limit, da kein festes Budget — kann später nachgerüstet werden)
- Voice-Input (nur Text-Chat)
- Proaktive Chat-Nachrichten ohne Nutzeraktion (Chat antwortet nur auf Anfrage, initiiert nichts selbst)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen der Nutzer ist eingeloggt, wenn er auf einer beliebigen Seite den Chat-Button (unten rechts) klickt, dann öffnet sich das Chat-Panel von rechts mit dem bisherigen Verlauf (oder Leerzustand bei erster Nutzung)
- [ ] Angenommen der Chat ist leer (erste Nutzung), wenn der Nutzer das Panel öffnet, dann zeigt der Chat eine kurze Begrüßung mit 2-3 Beispiel-Fragen
- [ ] Angenommen der Nutzer stellt eine Frage zu einem einzelnen Kontakt, wenn der Kontaktname eindeutig zuordenbar ist, dann antwortet der Chat mit korrekten, aktuellen Daten aus Contacts/Interactions
- [ ] Angenommen der Nutzer stellt eine aggregierte Frage (z.B. "wer hat diese Woche Geburtstag"), wenn die Anfrage gesendet wird, dann berechnet der Chat die Antwort serverseitig aus den eigenen (RLS-geschützten) Daten, nicht aus geratenen Werten
- [ ] Angenommen der Nutzer bittet den Chat, eine Interaktion zu loggen, wenn die Angaben (Kontakt, Kanal, ggf. Notiz) klar erkennbar sind, dann wird der Interaction-Eintrag direkt angelegt und der Chat bestätigt die Aktion in der Antwort
- [ ] Angenommen der Nutzer bittet den Chat, einen Follow-up-Termin zu setzen, wenn der Kontakt eindeutig ist, dann wird `next_followup_at` direkt aktualisiert und bestätigt
- [ ] Angenommen der Nutzer bittet den Chat, einen neuen Kontakt anzulegen, wenn mindestens der Vorname genannt wird, dann wird der Kontakt direkt angelegt und der Chat bestätigt
- [ ] Angenommen der Nutzer bittet den Chat, ein bereits gefülltes Kontaktfeld zu überschreiben, wenn die Anfrage gesendet wird, dann zeigt der Chat zuerst den alten und neuen Wert und fragt nach Bestätigung, bevor geschrieben wird
- [ ] Angenommen der Nutzer bittet den Chat, einen Kontakt oder eine Interaktion zu löschen, wenn die Anfrage gesendet wird, dann zeigt der Chat eine Bestätigungsanfrage mit dem betroffenen Datensatz, bevor gelöscht wird
- [ ] Angenommen der Nutzer bittet um eine Bulk-Aktion (z.B. "lösch alle Kontakte ohne Follow-up"), wenn die Anfrage gesendet wird, dann zeigt der Chat die Anzahl und Liste der betroffenen Kontakte und fragt einmalig nach Bestätigung für alle, bevor irgendetwas geändert wird
- [ ] Angenommen eine Nutzeranfrage bezieht sich auf einen Namen, der zu mehreren Kontakten passt, wenn der Chat die Aktion ausführen soll, dann listet der Chat die Treffer (Name + Unterscheidungsmerkmal wie Arbeitgeber/Nachname) auf und fragt nach Auswahl, bevor irgendetwas geändert wird
- [ ] Angenommen der Nutzer bestätigt eine vorgeschlagene Aktion, wenn die Bestätigung gesendet wird, dann wird genau die zuvor angezeigte Aktion ausgeführt (kein erneutes Interpretieren der ursprünglichen Anfrage)
- [ ] Angenommen der Nutzer lehnt eine vorgeschlagene Aktion ab, wenn die Ablehnung gesendet wird, dann wird keine Datenänderung vorgenommen und der Chat bestätigt den Abbruch
- [ ] Angenommen die KI-Anfrage schlägt fehl (Timeout/API-Fehler), wenn der Nutzer eine Nachricht sendet, dann zeigt der Chat eine Fehlermeldung im Verlauf und die Nutzereingabe bleibt nicht verloren (erneut sendbar)
- [ ] Angenommen der Nutzer öffnet den Chat erneut nach einem Reload, dann sind frühere Nachrichten (bis zu den letzten 50) weiterhin sichtbar
- [ ] Angenommen ein anderer Nutzer ist eingeloggt, wenn er den Chat öffnet, dann sieht er ausschließlich seinen eigenen Verlauf und seine eigenen Kontakte/Interaktionen (RLS-Schutz)

## Edge Cases
- Nutzer stellt Frage zu Kontakt, der nicht existiert → Chat antwortet, dass kein passender Kontakt gefunden wurde, statt zu raten/halluzinieren
- Nutzer schickt leere Nachricht → Senden-Button/Aktion bleibt deaktiviert oder wird ignoriert
- Nutzer bittet um Aktion mit fehlenden Pflichtangaben (z.B. "leg Kontakt an" ohne Namen) → Chat fragt gezielt nach der fehlenden Angabe, statt zu raten
- Nutzer bestätigt eine Aktion, aber der betroffene Datensatz wurde inzwischen anderswo geändert/gelöscht (z.B. in der UI) → Chat meldet, dass die Aktion nicht mehr ausführbar ist, statt einen Fehler zu verschlucken
- Sehr lange Konversation (>50 Nachrichten) → UI lädt nur die letzten 50, ältere bleiben in der DB erhalten
- Mehrere Browser-Tabs gleichzeitig offen → beide zeigen denselben persistierten Verlauf (kein Echtzeit-Sync zwischen Tabs nötig für v1, Reload reicht)
- Nutzer versucht über Chat auf Daten anderer Nutzer zuzugreifen (z.B. durch Prompt-Manipulation) → serverseitige RLS-Policies verhindern Zugriff unabhängig vom Prompt-Inhalt
- Netzwerkfehler beim Senden (Client offline) → Nutzereingabe bleibt im Eingabefeld erhalten, Fehlermeldung statt stillem Verlust

## Technical Requirements (optional)
- Security: Authentication required (wie bestehende API-Routen); alle Datenzugriffe serverseitig RLS-geschützt, niemals Client-Payload für Datenwerte vertrauen
- Destruktive Aktionen (Löschen, Überschreiben nicht-leerer Felder, Bulk-Änderungen) erfordern explizite Nutzerbestätigung vor Ausführung

## Open Questions
- [x] Welches Modell/welche Technik für Tool-Calling — geklärt, siehe Tech Design
- [ ] Soll Chat-Verlauf je Gerät oder global pro Nutzer-Account gespeichert werden (für v1 angenommen: global pro Nutzer-Account, da Single-User ohne Team-Feature)

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Chat kann volle CRUD-Aktionen auf Contacts/Interactions ausführen (nicht nur read-only) | Explizit vom Nutzer gewünscht — Chat soll "alles was man auch sonst machen kann" können | 2026-06-29 |
| Bestätigung nur bei destruktiven Aktionen (Löschen, Überschreiben vorhandener Werte, Bulk) | Balance zwischen Tempo (loggen/Follow-up setzen läuft direkt) und Sicherheit (irreversible Aktionen brauchen Schutz) | 2026-06-29 |
| Mehrdeutige Kontakt-Treffer → Chat fragt nach statt zu raten | Verhindert falsche Zuordnung bei gleichen Vornamen | 2026-06-29 |
| Bulk-Aktionen erlaubt, aber mit einmaliger Bestätigung über Gesamtliste | Nutzer wollte volle Aktionsfreiheit, aber Bulk-Löschen ohne Vorschau wäre zu riskant | 2026-06-29 |
| Chat-Verlauf dauerhaft in DB, UI zeigt nur letzte 50 Nachrichten | Ermöglicht Rückbezug auf frühere Fragen ohne Performance-Problem bei langer Nutzung | 2026-06-29 |
| Kein Tageslimit für Nachrichten in v1 | Solo-Projekt ohne festes Budget laut PRD; Haiku-Kosten pro Nachricht minimal | 2026-06-29 |
| Chat-Button auf jeder eingeloggten Seite verfügbar (nicht nur Dashboard) | Nutzer will Chat "immer erreichbar", nicht an eine Seite gebunden | 2026-06-29 |
| Priorität P1 (nicht P0) | Kein MVP-Blocker, baut auf bestehender KI-Infra (draft-message, network-insights) auf | 2026-06-29 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Modell: Claude Haiku 4.5 (wie draft-message/network-insights) | Konsistent mit Rest der App, günstiger; Tool-Beschreibungen klar genug gehalten, dass Haiku zuverlässig das richtige Tool wählt | 2026-06-29 |
| Tool-Calling über AI SDK (`tools`-Parameter) statt vollem Datendump im Prompt | Skaliert mit wachsender Kontaktliste, günstiger pro Anfrage, KI sucht/handelt gezielt statt alles im Kontext zu lesen | 2026-06-29 |
| Zwei-Phasen-Ausführung für destruktive Aktionen: Vorschlag (kein Write) → eigene Bestätigung führt exakt den gespeicherten Vorschlag aus | Erfüllt Acceptance Criteria "genau die zuvor angezeigte Aktion, kein erneutes Interpretieren" — Bestätigung ruft KEIN erneutes LLM auf, sondern führt 1:1 das aus, was vorgeschlagen wurde | 2026-06-29 |
| Pending Actions in eigener Tabelle `pending_actions` (nicht im Client-State) | Überlebt Reload/Tab-Wechsel; Status-Feld (pending/confirmed/declined/expired) macht Lifecycle klar nachvollziehbar | 2026-06-29 |
| Nur eine offene Pending Action gleichzeitig pro Nutzer | Verhindert Verwechslung, falls Nutzer eine neue Anfrage stellt, bevor er die vorherige bestätigt hat — ältere wird automatisch auf "expired" gesetzt | 2026-06-29 |
| Chat-Verlauf in eigener Tabelle `chat_messages`, RLS auf `user_id` | Gleiches Muster wie `contacts`/`interactions` — pro Nutzer isoliert, kein Sonderfall | 2026-06-29 |
| Right-Side Panel mit shadcn `Sheet` (wie `interaction-log-sheet.tsx`) | Bereits etabliertes Pattern im Projekt, keine neue Abhängigkeit nötig | 2026-06-29 |
| Floating Trigger-Button im Root-Layout (nicht pro Seite) | Einzige Stelle, die garantiert auf jeder eingeloggten Seite gerendert wird | 2026-06-29 |
| Keine neuen Packages nötig | `ai`, `@ai-sdk/anthropic`, `zod` bereits im Projekt (siehe draft-message/network-insights Routen) | 2026-06-29 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Component Structure
```
Root Layout (überall, eingeloggter Bereich)
└── ChatTrigger (schwebender Button, unten rechts, alle Seiten)
└── ChatPanel (Sheet, öffnet von rechts)
    ├── Empty State (Begrüßung + 2-3 Beispiel-Fragen, nur bei leerem Verlauf)
    ├── Message List (scrollbar, lädt letzte 50 Nachrichten)
    │   ├── User-Nachricht
    │   ├── Assistant-Nachricht (Text-Antwort)
    │   └── Pending-Action-Karte (bei vorgeschlagener destruktiver/Bulk-Aktion)
    │       ├── Klartext-Zusammenfassung ("Lösche Kontakt Tom Müller")
    │       ├── Bestätigen-Button
    │       └── Abbrechen-Button
    ├── Fehler-Banner (bei KI-/Netzwerkfehler, mit erneut senden)
    └── Eingabefeld + Senden-Button
```

### B) Data Model (plain language)

**Chat-Nachricht** (Tabelle `chat_messages`):
- Wer (Nutzer-ID)
- Wer hat geschrieben (Nutzer oder Assistent)
- Text der Nachricht
- Zeitstempel
- Gespeichert in: Supabase, RLS-geschützt pro Nutzer

**Vorgeschlagene Aktion** (Tabelle `pending_actions`):
- Wer (Nutzer-ID)
- Zu welcher Chat-Nachricht gehört es
- Welche Art Aktion (z.B. "Kontakt löschen", "Feld überschreiben", "Bulk-Löschen")
- Klartext-Zusammenfassung, die dem Nutzer angezeigt wurde
- Die exakten Daten, die bei Bestätigung ausgeführt werden (z.B. welcher Kontakt, welches Feld, welcher neuer Wert)
- Status: wartend / bestätigt / abgelehnt / abgelaufen
- Zeitstempel
- Gespeichert in: Supabase, RLS-geschützt pro Nutzer

Direkte Aktionen (Interaktion loggen, Follow-up setzen, neuen Kontakt anlegen, leeres Feld befüllen) brauchen keinen Pending-Eintrag — die werden sofort beim Verarbeiten der Nachricht ausgeführt und das Ergebnis fließt direkt in die Assistant-Antwort ein.

### C) Tech Decisions (für PM erklärt)

- **Haiku-Modell**: gleiches Modell wie bei der Nachrichtenvorschlag-Funktion — günstig, schnell, für klar definierte Aufgaben (Tool auswählen, Antwort formulieren) ausreichend gut.
- **Tool-Calling statt Datendump**: die KI bekommt keine komplette Kontaktliste in jede Anfrage gepackt, sondern "Werkzeuge" (z.B. "Kontakt suchen", "Interaktion anlegen", "Follow-up setzen"), die sie bei Bedarf selbst aufruft. Bleibt schnell und günstig, egal wie groß das Netzwerk wird.
- **Zwei-Phasen-Bestätigung**: bei riskanten Aktionen schlägt die KI zuerst nur vor, was sie tun würde — ohne etwas zu verändern. Erst der Klick auf "Bestätigen" löst die echte Änderung aus, und zwar exakt das, was vorher angezeigt wurde (kein erneutes Nachdenken der KI, kein Risiko einer abweichenden Interpretation).
- **Eigene Tabelle für Vorschläge**: macht den Bestätigungs-Schritt zuverlässig, auch wenn der Nutzer das Browser-Tab wechselt oder neu lädt, bevor er bestätigt.

### D) Dependencies
Keine neuen Packages — `ai`, `@ai-sdk/anthropic`, `zod` sind bereits im Projekt installiert (genutzt von den bestehenden Routen `draft-message` und `network-insights`).

## Frontend Implementation Notes
- `src/components/chat-widget.tsx` — Floating Trigger-Button (unten rechts, fixed) + Sheet-Panel (shadcn `Sheet`, von rechts), enthält Message-List, Empty-State mit Beispiel-Prompts, Pending-Action-Karte (Bestätigen/Abbrechen), Fehler-Banner mit "Erneut senden", Eingabefeld (Enter sendet, Shift+Enter neue Zeile)
- Eingebunden in `src/app/(app)/layout.tsx` — läuft auf jeder eingeloggten Seite (Dashboard, Kontakte, Analytics)
- `src/lib/chat.ts` — Typen (`ChatMessage`, `PendingAction`) + Beispiel-Prompts-Konstante
- Erwarteter API-Vertrag (noch nicht implementiert, für `/backend`):
  - `GET /api/chat/messages` → `{ messages: ChatMessage[], pendingAction: PendingAction | null }`
  - `POST /api/chat` Body `{ content: string }` → `{ message: ChatMessage, pendingAction?: PendingAction | null }`
  - `POST /api/chat/confirm` Body `{ pendingActionId: string, decision: 'confirm' | 'decline' }` → `{ message: ChatMessage }`
- Verifiziert per Playwright-Screenshot (Login → Dashboard → Chat öffnen): Button + Panel rendern korrekt, Fehler-Banner zeigt erwarteten 404 (Backend fehlt noch), kein UI-Crash

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
