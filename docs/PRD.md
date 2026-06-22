# Product Requirements Document

## Vision
Personal Network OS — eine persönliche Beziehungspflege-App, kein klassisches CRM. Hilft dem Nutzer, alle Menschen im Leben (Business, Investoren, Community, Freunde, Bekannte) aktiv im Blick zu behalten: wann zuletzt Kontakt, was besprochen, wann nachfassen. LinkedIn ist zu formell und CV-fokussiert für diesen Zweck.

## Target Users
Der Nutzer selbst — Person mit großem, diversem Netzwerk über Business und Privatleben hinweg, die aktuell vergisst, Kontakte nachzufassen. Kernproblem: fehlendes systematisches Follow-up.

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
| P1 | Netzwerk-Analytics (periodisch) | Roadmap |

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
- Kein Team-Feature
- Kein E-Mail-Client
- Kein Kalender-Sync (erst nach MVP) — ausgenommen einseitige Add-to-Calendar-Links (kein OAuth, kein Lesen bestehender Termine)
- Keine native Mobile App
- Keine WhatsApp Business API (nur `wa.me`-Deep-Links, kein automatisches Senden ohne Klick)

---

Use `/write-spec` to create detailed feature specifications for each item in the roadmap above.
