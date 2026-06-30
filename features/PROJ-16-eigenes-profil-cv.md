# PROJ-16: Eigenes Profil (CV) + CV-Upload mit KI-Parsing

## Status: Planned
**Created:** 2026-06-30
**Last Updated:** 2026-06-30

## Dependencies
- PROJ-3 (Kontakt anlegen & verwalten) — liefert das Kontaktmodell, das ein späteres Folgefeature (PROJ-17, noch nicht spezifiziert) gegen dieses Profil abgleichen wird. Kein technischer Hard-Dependency für PROJ-16 selbst.
- PROJ-15 (Profil) — `/profil/lebenslauf` ist eine Unterseite der bestehenden `/profil`-Route, aber funktional unabhängig (eigene Tabellen, eigene UI, kein gemeinsamer Code mit der Case-Liste).

## User Stories
- Als Berater möchte ich mein eigenes berufliches Profil (Bildung, Werdegang, Skills, Sprachen) im Tool hinterlegen, damit meine Karriere-Historie digital erfasst ist und später für intelligente Funktionen (z. B. Gemeinsamkeiten mit Kontakten) genutzt werden kann
- Als Berater möchte ich meinen Lebenslauf als PDF hochladen können, damit ich nicht jeden Eintrag manuell eintippen muss
- Als Berater möchte ich die aus dem PDF erkannten Daten vor dem Speichern sehen und korrigieren können, damit Fehler aus der automatischen Erkennung nicht ungeprüft übernommen werden
- Als Berater möchte ich auch ohne CV-Upload einzelne Stationen (Studium, Job) manuell nachtragen können, damit ich mein Profil jederzeit aktuell halten kann, auch lange nach dem letzten Upload

## Out of Scope
- Gemeinsamkeiten-Matching zwischen eigenem Profil und Kontakten — eigenes Folgefeature (PROJ-17), baut auf diesem Datenmodell auf, aber diese Spec liefert nur die Datenbasis
- Passives KI-Lernen aus geloggten Cases/Interaktionen (automatische Profil-Vorschläge ohne CV-Upload) — eigenes späteres Feature (PROJ-18), andere Pipeline-Form (Hintergrund-Extraktion statt On-Demand-Parsing)
- Foto-Upload für das eigene Profilbild — eigenes Feature (PROJ-7, Roadmap), nicht Teil dieser Spec
- Sichtbarkeit/Teilen des Profils mit anderen Nutzern — App ist strikt Single-User (siehe PRD Non-Goals), Profil ist ausschließlich für den Account-Owner selbst sichtbar
- Mehrfacher gleichzeitiger CV-Upload / Versionsverwaltung mehrerer CVs — nur der zuletzt hochgeladene CV-Pfad wird referenziert, ältere Uploads werden nicht als Historie verwaltet
- Automatisches Überschreiben bestehender Einträge durch einen erneuten CV-Upload — jeder Upload erzeugt neue Vorschau-Einträge, die der Nutzer einzeln bestätigt; bestehende Einträge werden nicht automatisch gelöscht/ersetzt
- Strukturierte Felder für Skills/Sprachen mit Niveau-Angaben (z. B. "Englisch C1") — für MVP einfache Text-Listen ohne Sub-Struktur

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen der Nutzer ist eingeloggt und hat noch kein Profil angelegt, wenn er `/profil/lebenslauf` öffnet, dann sieht er einen Empty-State mit Hinweis und den Optionen "CV hochladen" und "Manuell hinzufügen"
- [ ] Angenommen der Nutzer lädt eine gültige PDF-Datei hoch, wenn die KI-Verarbeitung abgeschlossen ist, dann sieht er eine editierbare Vorschau mit erkannten Einträgen, gruppiert nach Bildung/Werdegang/Skills/Sprachen — noch nichts ist gespeichert
- [ ] Angenommen die Vorschau zeigt erkannte Einträge, wenn der Nutzer einzelne Zeilen abwählt oder Felder korrigiert und dann bestätigt, dann werden nur die ausgewählten, ggf. korrigierten Werte gespeichert
- [ ] Angenommen der Nutzer bricht die Vorschau ab (ohne zu bestätigen), dann wird nichts gespeichert und das hochgeladene PDF bleibt nur als Datei im Storage bestehen, ohne dass Profil-Daten entstehen
- [ ] Angenommen der Nutzer lädt eine Datei hoch, die kein PDF ist, dann wird eine Validierungsfehlermeldung angezeigt und kein Upload/Parsing-Versuch gestartet
- [ ] Angenommen der Nutzer lädt eine PDF-Datei hoch, die größer als das Limit ist, dann wird eine Validierungsfehlermeldung angezeigt, kein Upload gestartet
- [ ] Angenommen die KI-Verarbeitung des PDFs schlägt fehl (z. B. unleserliches/gescanntes Dokument, API-Fehler), dann wird eine Fehlermeldung angezeigt und der Nutzer kann stattdessen manuell Einträge anlegen
- [ ] Angenommen der Nutzer klickt auf "Ausbildung hinzufügen" ohne CV-Upload, wenn er Institution (Pflichtfeld) ausfüllt und speichert, dann wird ein neuer Bildungs-Eintrag gespeichert
- [ ] Angenommen das Institution-Feld bei einem manuellen Bildungs-Eintrag ist leer, wenn der Nutzer speichern will, dann erscheint eine Validierungsfehlermeldung und der Eintrag wird nicht angelegt
- [ ] Angenommen der Nutzer klickt auf "Berufserfahrung hinzufügen" ohne CV-Upload, wenn er Arbeitgeber (Pflichtfeld) ausfüllt und speichert, dann wird ein neuer Werdegang-Eintrag gespeichert
- [ ] Angenommen ein Bildungs- oder Werdegang-Eintrag existiert, wenn der Nutzer ihn bearbeitet und speichert, dann werden die neuen Werte übernommen
- [ ] Angenommen ein Bildungs- oder Werdegang-Eintrag existiert, wenn der Nutzer ihn löscht, dann wird nur dieser Eintrag entfernt, alle anderen bleiben unverändert
- [ ] Angenommen der Nutzer hat Skills/Sprachen über CV-Upload oder manuell hinterlegt, wenn er die Profilseite erneut öffnet, dann sieht er die zuletzt gespeicherten Werte
- [ ] Angenommen Nutzer A ist eingeloggt, wenn er versucht, auf Profil-Daten oder CV-Dateien von Nutzer B zuzugreifen, dann liefert die Datenbank/das Storage keine Daten zurück (RLS)

## Edge Cases
- Enddatum eines Bildungs-/Werdegang-Eintrags liegt vor dem Startdatum → Validierungsfehler
- Laufende Ausbildung/Anstellung (kein Enddatum) → erlaubt, Enddatum bleibt optional
- Sehr lange Werdegang-Beschreibung → max. 500 Zeichen, analog zu bestehenden Freitextfeldern im Tool
- CV-PDF enthält keine erkennbaren Bildungs-/Werdegang-Abschnitte → Vorschau zeigt leere Gruppen mit Hinweis statt Fehler, Nutzer kann trotzdem manuell ergänzen
- Doppelter Klick auf "Hochladen"/"Speichern" während Request läuft → Button disabled (Loading-State), kein doppelter Insert/Upload
- Nutzer lädt einen zweiten CV hoch, nachdem bereits Einträge existieren → neue Vorschau wird unabhängig von bestehenden Einträgen erzeugt, nichts wird automatisch gelöscht oder überschrieben (siehe Out of Scope)
- Sehr großes PDF (z. B. mehrseitiger CV mit eingebetteten Bildern) nahe am Größenlimit → Upload wird serverseitig zeitlich begrenzt (Timeout), bei Überschreitung Fehlermeldung statt endlosem Laden

## Technical Requirements
- Security: RLS auf `user_profile`, `user_education`, `user_employment` analog zu bestehenden Tabellen (`auth.uid() = user_id`); Storage-Bucket `cv-uploads` privat mit Owner-only-Policies, kein öffentlicher Zugriff auf hochgeladene PDFs
- Validierung: Institution/Arbeitgeber Pflichtfelder (max 200 Zeichen je analog zu bestehenden Namensfeldern), übrige Felder optional, Enddatum ≥ Startdatum falls beide gesetzt, Beschreibung max 500 Zeichen
- PDF-Upload: nur `application/pdf`, Größenlimit (Empfehlung 10 MB, analog typischer CV-Dateigrößen)
- KI-Parsing liefert ausschließlich einen Vorschlag — kein automatisches Schreiben in die Datenbank ohne explizite Nutzerbestätigung

## Open Questions
_Keine offenen Fragen — vollständig im Rahmen einer vorgelagerten Plan-Phase mit dem Nutzer abgestimmt (siehe Decision Log)._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Volles CV-Profil (Bildung, Werdegang, Skills, Sprachen) statt nur Bildung | Nutzer hat sich explizit für den größten Scope entschieden — "echtes CV hochladen und alles erfasst" | 2026-06-30 |
| CV-Upload mit KI-Parsing direkt im MVP, nicht als Folge-Feature | Nutzer hat sich explizit dafür entschieden statt eines einfacheren manuellen Starts | 2026-06-30 |
| Zwei gleichwertige Eingabewege: CV-Upload UND manuelle Formulare | "Kontinuierlich aktualisiert" setzt voraus, dass der Nutzer auch lange nach dem letzten CV-Upload einzelne neue Stationen nachtragen kann, ohne erneut ein ganzes CV hochladen zu müssen | 2026-06-30 |
| Eigene Unterseite `/profil/lebenslauf` statt Tab/Sektion auf `/profil` | `/profil` (PROJ-15) zeigt Case-Historie + Stats — konzeptionell etwas anderes als persönliche CV-Fakten; PROJ-15s eigener Decision Log nennt ein Account-/CV-Profil bereits explizit als "eigenes Feature falls später gewünscht" | 2026-06-30 |
| Kein automatisches Schreiben aus dem CV-Parsing — immer Bestätigungs-Vorschau | Konsistent mit dem bestehenden "propose → confirm"-Muster der AI-Chat-Assistenz (PROJ-11); Fehlerkennungen aus PDF-Parsing dürfen nicht ungeprüft in die Datenbank | 2026-06-30 |
| Skills/Sprachen als einfache Listen ohne Niveau-Struktur | Reduziert Scope für MVP, Niveau-Angaben (z. B. "Englisch C1") sind nicht für die geplante Matching-Funktion (PROJ-17) erforderlich | 2026-06-30 |
| Re-Upload überschreibt bestehende Einträge nicht automatisch | Verhindert versehentlichen Datenverlust bei wiederholtem CV-Upload; Nutzer behält volle Kontrolle über jeden einzelnen Eintrag | 2026-06-30 |
| PROJ-17 (Gemeinsamkeiten-Matching) und PROJ-18 (passives Lernen) bewusst als eigene Folge-Specs ausgegliedert | Single-Responsibility-Prinzip des Repos — unabhängig testbar/deploybar; Matching braucht ohnehin echte Profildaten aus PROJ-16 als Voraussetzung | 2026-06-30 |

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
