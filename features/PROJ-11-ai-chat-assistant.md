# PROJ-11: AI Chat Assistant (Sidebar-Popup)

## Status: Planned
**Created:** 2026-06-29
**Last Updated:** 2026-06-29

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
- [ ] Welches Modell/welche Technik für Tool-Calling (Kontakt-Suche, Aktionen ausführen) — Architecture-Entscheidung
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
| _To be added by /architecture_ | | |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
