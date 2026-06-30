# Product Requirements Document

## Vision
Personal Network OS für **MBB-/Strategieberater** — eine persönliche Beziehungspflege-App, kein klassisches CRM. Hilft, das berufliche und private Netzwerk trotz Projekt-Taktung, Reise-Alltag und Zeitknappheit aktiv im Blick zu behalten: wann zuletzt Kontakt, was besprochen, wann nachfassen. Für Berater ist das Netzwerk Karriere- und Exit-Kapital — Cases rotieren, Client-Beziehungen schlafen nach Projektende ein, Alumni verteilen sich auf PE/Industrie/Startups. LinkedIn ist zu formell und CV-fokussiert für diesen Zweck.

## Target Users
**Primär:** MBB-/Top-Strategieberater (McKinsey, Bain, BCG & vergleichbar) — zeitarm, projektbasiert, reise-intensiv, exit-/alumni-orientiert. Kernproblem: fehlendes systematisches Follow-up bei extremer Zeitknappheit; Client-Kontakte verpuffen nach Projektende. Hoher Wert auf persönlichem Beziehungsaufbau, aber nur mit minimalem Zeitaufwand machbar.

**Sekundär (Hintergrund):** Jede Person mit großem, diversem Netzwerk über Business und Privatleben hinweg, die Kontakte nachzufassen vergisst.

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | Supabase Infrastructure Setup | Planned (spec done) |
| P0 (MVP) | Auth (Login) | Planned (spec done) |
| P0 (MVP) | Kontakt anlegen & verwalten | Planned (spec done) |
| P0 (MVP) | Kontaktliste & Filter | Planned (spec done) |
| P0 (MVP) | Interaktions-Log | Deployed |
| P0 (MVP) | Follow-up Dashboard & Tagesansicht (inkl. Anlässe/Geburtstage, AI-Nachrichtenvorschlag, WhatsApp-Link, Kalender-Link) | Planned (spec done) |
| P1 | Foto-Upload | Planned |
| P1 | Netzwerk-Analytics (periodisch) | Deployed |
| P1 | Monatlicher AI-Report per Mail | Planned (spec done) |
| P1 | AI Chat Assistant (Sidebar-Popup) | Deployed |
| P0 (MBB) | Projekte/Cases (Engagement-Container: Beteiligte + Projekt-Log) | Deployed |
| P1 (MBB) | Rolloff-Wizard (AI-Bulk-Nachfass bei Projektende) | Roadmap |
| P1 (MBB) | City-Trip-Modus (Kontakte vor Ort + Batch-Draft, basiert auf Projekt-Stadt+Zeitfenster) | Roadmap |
| P1 (MBB) | Profil (Umbenennung Projekte → Profil + Karriere-Stats-Header) | Deployed |
| P1 (MBB) | Eigenes Profil (CV) + CV-Upload mit KI-Parsing | Planned (spec done) |
| P1 (MBB) | Gemeinsamkeiten-Feld bei Kontakten (KI-Matching Profil ↔ Kontakt) | Roadmap |
| P2 (MBB) | Passives KI-Lernen aus Cases/Interaktionen (automatische Profil-Vorschläge) | Roadmap |

## Success Metrics
- Tägliche Nutzung
- Anzahl fälliger Kontakte sinkt auf 0 nach Nutzung des Dashboards
- Quick-Add < 1 Minute, Interaktions-Log-Eintrag < 30 Sekunden

## Constraints
- Solo-Projekt, kein festes Budget/Timeline
- Tech Stack festgelegt: Next.js (App Router) + TypeScript + Tailwind CSS, Supabase (Postgres + RLS + Auth), Vercel Hosting
- Responsive: Desktop primär (Laptop-Alltag), Mobile-Browser sekundär nutzbar — keine native App, kein PWA-Aufwand
- Design-System: Tailwind + shadcn/ui Defaults (keine eigene Vorgabe)

## Non-Goals
- Keine LinkedIn/API-Synchronisation
- Kein automatisches Scoring/Ranking einzelner Kontakte (Beziehungs-Tier & Wiedervorlage-Intervall werden manuell gesetzt, KI wird nur für Nachrichtenvorschläge und aggregierte Netzwerk-Analytics genutzt)
- Kein Team-Feature — Projekte/Cases sind persönlich (single-user, RLS-geschützt), kein geteiltes Team-Projekt, keine Kollaboration
- Kein E-Mail-Client
- Kein Kalender-Sync (erst nach MVP) — ausgenommen einseitige Add-to-Calendar-Links (kein OAuth, kein Lesen bestehender Termine)
- Keine native Mobile App
- Keine WhatsApp Business API (nur `wa.me`-Deep-Links, kein automatisches Senden ohne Klick)

---

Use `/write-spec` to create detailed feature specifications for each item in the roadmap above.
