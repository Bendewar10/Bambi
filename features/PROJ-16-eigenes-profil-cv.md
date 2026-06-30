# PROJ-16: Eigenes Profil (CV) + CV-Upload mit KI-Parsing

## Status: In Progress
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
| 3 neue Tabellen statt einer breiten Tabelle: `user_profile` (Singleton), `user_education`, `user_employment` (Child-Tables) | Bildung/Werdegang sind wiederholbar und datiert (mehrere Abschlüsse/Jobs mit Zeitraum) — analog zum bestehenden `project_participants`-neben-`projects`-Muster. Skills/Sprachen als `text[]`-Spalten auf der Singleton-Zeile statt eigener Tabellen, da unsortierte, undatierte einfache Listen ohne Pro-Eintrag-Metadaten | 2026-06-30 |
| `user_profile.updated_at` bewusst mitgeführt | Spätere Folgefeatures (PROJ-17) brauchen ein verlässliches Änderungs-Signal, um zu erkennen, wann ein Profil-Abgleich nötig ist | 2026-06-30 |
| Neuer privater Storage-Bucket `cv-uploads`, Pfad `{user_id}/{timestamp}-{filename}.pdf` | Erstes Storage-Feature im Repo (bisher ungenutzt) — `user_id` als oberstes Pfadsegment macht die Owner-Policy einfach (`storage.foldername(name)[1] = auth.uid()::text`), analog zum `auth.uid() = user_id`-Muster aller bestehenden Tabellen | 2026-06-30 |
| Kein Storage-Update-Policy, Re-Upload erzeugt neuen Pfad statt Overwrite | Vermeidet Teil-Schreib-Fehlerfälle, hält den zuletzt referenzierten CV-Pfad eindeutig über `user_profile.cv_file_path` | 2026-06-30 |
| Neue API-Route `/api/cv-parse`, gleiches Gerüst wie `/api/draft-message` (Auth-Check, zod-Body, try/catch um den AI-Call) | Konsistenz mit bestehenden server-seitigen AI-Routen dieses Repos, kein neues Muster nötig | 2026-06-30 |
| `generateObject` (Vercel AI SDK) statt `generateText` für das CV-Parsing | Strukturierte JSON-Antwort mit Zod-Schema statt freiem Text — bereits installiertes Package, kein neues Dependency | 2026-06-30 |
| Modell `claude-sonnet-4-6` für CV-Parsing (nicht Haiku) | Höhere Extraktions-Güte für ein einmaliges, wichtiges Parsing-Ergebnis gerechtfertigt — gleiches Modell, das dieses Repo bereits für seine "großen" AI-Aufgaben nutzt (Chat-Assistent), während Haiku für günstige/häufige Aufgaben reserviert bleibt (z. B. Nachrichtenvorschläge) | 2026-06-30 |
| PDF wird vom Client zuerst in Storage hochgeladen, die API-Route bekommt nur den Storage-Pfad (nicht die rohen Bytes erneut) | Vermeidet doppelten Datei-Transfer; die Datei existiert als durables Artefakt unabhängig davon, ob das Parsing gelingt | 2026-06-30 |
| Review-Dialog (`cv-review-dialog.tsx`) strukturell von `linkedin-import-dialog.tsx` (PROJ-10) abgeleitet | Bestehendes, bewährtes "Vorschau mit Checkbox pro Zeile, vor Bestätigung editierbar, Batch-Insert"-Muster wiederverwenden statt neu zu erfinden | 2026-06-30 |
| Manuelle Eingabe-Dialoge strukturell von `project-form-dialog.tsx` abgeleitet (react-hook-form + zod) | Konsistentes Formular-Pattern im gesamten Repo | 2026-06-30 |
| Neue Unterseite `/profil/lebenslauf` statt neuer Top-Level-Nav-Punkt | Bereits im Spec-Decision-Log festgehalten — kein 5. Nav-Punkt für einen Unteraspekt von "Profil" | 2026-06-30 |
| Kein eigener API-Endpunkt für CRUD auf `user_education`/`user_employment` (außer dem Parsing) | Direkte Supabase-Client-Calls + RLS, analog zum etablierten Muster bei `projects`/`project_participants` (kein bestehendes API-Route-Pattern für diese Art Ressource in diesem Repo) | 2026-06-30 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Komponenten-Struktur

```
/profil (bestehend, PROJ-15, unverändert)
+-- "Mein Lebenslauf"-Card/Button (NEU, verlinkt auf Unterseite)

/profil/lebenslauf (NEUE Unterseite)
+-- Empty State ("Noch kein Profil" + "CV hochladen"/"Manuell hinzufügen")
+-- Profil-Kopf (Headline, Skills, Sprachen als Tags)
+-- Bildung-Sektion
|   +-- Liste der Bildungs-Einträge (Institution, Abschluss, Zeitraum)
|   +-- "+ Ausbildung hinzufügen"-Button → Bildungs-Formular-Dialog
+-- Werdegang-Sektion
|   +-- Liste der Werdegang-Einträge (Arbeitgeber, Rolle, Zeitraum)
|   +-- "+ Berufserfahrung hinzufügen"-Button → Werdegang-Formular-Dialog
+-- "CV hochladen"-Button → Upload-Dialog
    +-- Datei-Auswahl (PDF)
    +-- Lade-Zustand während KI-Parsing läuft
    +-- Review-Dialog: editierbare Vorschau (gruppiert, Checkbox pro Zeile) → Bestätigen → Speichern
```

### B) Datenmodell (Klartext)

**Eigenes Profil** — eine Zeile pro Nutzer:
- Kurzbeschreibung/Headline (optional)
- Skills, Sprachen (jeweils eine einfache Liste)
- Referenz auf zuletzt hochgeladenen Lebenslauf (Dateipfad + Zeitpunkt)

**Bildungs-Eintrag** — mehrere pro Nutzer:
- Institution (Pflicht), Abschluss, Fachrichtung, Stadt, Zeitraum (Start optional, Ende optional = "läuft noch")

**Werdegang-Eintrag** — mehrere pro Nutzer:
- Arbeitgeber (Pflicht), Rolle, Stadt, Zeitraum, kurze Beschreibung (optional)

**Hochgeladene CVs:** PDF-Dateien liegen in einem privaten Datei-Speicher, nur für den jeweiligen Nutzer zugänglich, nicht öffentlich abrufbar.

Storage: Supabase Postgres (3 neue Tabellen) + Supabase Storage (neuer privater Bucket), RLS analog bestehender Tabellen (`auth.uid() = user_id`).

### C) Tech-Entscheidungen (warum)

- **Drei Tabellen statt einer** — Bildung und Werdegang sind wiederholbare, datierte Einträge (mehrere Studienabschlüsse, mehrere Jobs), passt zum bestehenden Muster für "ein Haupt-Objekt + mehrere Unter-Einträge" wie bei Projekten/Beteiligten.
- **CV-Upload mit KI-Parsing, aber immer mit Bestätigungs-Schritt** — die KI liest das PDF und schlägt Einträge vor, schreibt aber nichts automatisch — konsistent mit dem bereits etablierten "Vorschlagen statt automatisch Ausführen"-Prinzip der KI-Funktionen in diesem Tool.
- **Eigene Unterseite statt Erweiterung der bestehenden Profil-Seite** — die bestehende Profil-Seite (Case-Historie) und das neue CV-Profil sind inhaltlich unterschiedliche Dinge; eine eigene Unterseite hält beides übersichtlich getrennt.
- **Neuer Datei-Speicher-Bereich nur für CVs** — bisher speichert das Tool keine hochgeladenen Dateien; ein klar abgegrenzter, privater Bereich nur für Lebensläufe ist die einfachste sichere Lösung.

### D) Dependencies
Keine neuen Packages — das bereits installierte AI-Werkzeug unterstützt strukturierte Datenextraktion direkt, shadcn-Komponenten (Dialog, Checkbox, Input, Card) sind bereits installiert und im Projekt genutzt.

## Frontend Implementation Notes
<!-- Added by /frontend -->
- Neue Dateien: `src/lib/user-profile.ts` (Typen `UserProfile`/`EducationEntry`/`EmploymentEntry`, `formatEntryDateRange` als Re-Export von `formatDateRange` aus `lib/projects.ts` statt Duplikat, `sortByStartDateDesc`-Helper)
- Neue Route `src/app/(app)/profil/lebenslauf/page.tsx` → rendert `CvProfile`
- `src/components/cv-profile.tsx`: Haupt-Seite, lädt `user_profile`/`user_education`/`user_employment` parallel, Empty-State wenn nichts vorhanden, sonst Headline+Skills+Sprachen-Badges, Bildung-/Werdegang-Sektionen mit Edit (Klick auf Zeile) und Delete (Icon, keine Bestätigung — geringes Risiko, manuell editierbar)
- `src/components/education-form-dialog.tsx`, `employment-form-dialog.tsx`: strukturell identisch zu `project-form-dialog.tsx` (react-hook-form + zod, Enddatum-≥-Startdatum-Validierung)
- `src/components/cv-upload-dialog.tsx`: PDF-Validierung (Typ, max 10 MB) client-seitig, Upload zu Storage-Bucket `cv-uploads` unter `{user_id}/{timestamp}-{filename}`, POST an `/api/cv-parse` (kein manueller Auth-Header nötig — Session läuft über Cookies, gleiches Muster wie bestehende `/api/draft-message`-Aufrufe), bei Fehler Hinweis auf manuelle Eingabe als Fallback
- `src/components/cv-review-dialog.tsx`: adaptiert von `linkedin-import-dialog.tsx` — gruppierte Vorschau (Ausbildung/Werdegang/Skills/Sprachen), Checkbox pro Zeile, Skills/Sprachen als entfernbare Badges, Bestätigen schreibt nur ausgewählte Zeilen + upserted `user_profile` (`onConflict: 'user_id'`), Abbrechen speichert nichts
- `src/components/project-list.tsx`: neue "Mein Lebenslauf"-Card verlinkt auf `/profil/lebenslauf`, unterhalb des Stats-Headers aus PROJ-15
- Tabellen (`user_profile`, `user_education`, `user_employment`), Storage-Bucket `cv-uploads` und `/api/cv-parse` existieren noch nicht — Supabase-Calls gehen vom in der Architektur festgelegten Schema aus, folgen in `/backend` (gleiches Vorgehen wie bei PROJ-12)
- Lint-Fix während Implementierung: `cv-profile.tsx` rief `setIsLoading(true)` redundant synchron im Mount-Effect auf (Initial-State ist bereits `true`) — neue `react-hooks/set-state-in-effect`-Regel hat das korrekt angemeckert, entfernt
- Build (`npm run build`) und Lint (`npm run lint`) laufen fehlerfrei; `/profil/lebenslauf` erscheint korrekt in der Build-Routen-Tabelle

## Backend Implementation Notes
<!-- Added by /backend -->
- Migration `supabase/migrations/0005_create_user_profile.sql`: Tabellen `user_profile` (Singleton, `user_id unique`), `user_education`, `user_employment`, alle Owner-only RLS (4 Policies je Tabelle, `auth.uid() = user_id`), Indizes auf `user_id`
- Neuer Storage-Bucket `cv-uploads` (privat, `public = false`), 3 Storage-RLS-Policies (select/insert/delete) auf `storage.objects`, gescoped über `(storage.foldername(name))[1] = auth.uid()::text` — kein Update-Policy (Re-Upload erzeugt neuen Pfad, siehe Tech Design)
- Migration live via Supabase MCP angewendet, danach `list_tables` + `get_advisors` (security) verifiziert: alle 3 Tabellen RLS-enabled, keine neuen Security-Findings (nur bereits bestehender, unabhängiger `auth_leaked_password_protection`-Hinweis)
- Neue API-Route `src/app/api/cv-parse/route.ts`: gleiches Gerüst wie `/api/draft-message` (Auth-Check 401, zod-Body-Validierung), lädt PDF server-seitig aus `cv-uploads` herunter (RLS verweigert fremde Pfade bereits hier), base64-kodiert, `generateObject` (Vercel AI SDK, `ai@6.0.208` + `@ai-sdk/anthropic@3.0.62`, beide bereits installiert) mit Modell `claude-sonnet-4-6`, PDF als `file`-Content-Part (`mediaType: 'application/pdf'`), Zod-Schema deckungsgleich mit dem Frontend-`ParsedCv`-Typ; Fehler beim AI-Call → 502, fehlende/fremde Datei → 404
- Keine Integration-Tests (Vitest) für diese Route geschrieben, da sie einen echten PDF-Upload + Claude-Call braucht (kein sinnvoller Mock ohne externe Abhängigkeit zu kapseln) — Abdeckung erfolgt über E2E in `/qa`
- `npm run build` + `npm run lint` fehlerfrei; `/api/cv-parse` erscheint korrekt in der Build-Routen-Tabelle

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
