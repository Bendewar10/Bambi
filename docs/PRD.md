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
| P0 (MVP) | Kontaktliste & Filter | Planned |
| P0 (MVP) | Interaktions-Log | Planned |
| P0 (MVP) | Follow-up Dashboard & Tagesansicht | Planned |
| P1 | Foto-Upload | Planned |

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
- Keine KI-Analyse von Kontakten
- Kein Team-Feature
- Kein E-Mail-Client
- Kein Kalender-Sync (erst nach MVP)
- Keine native Mobile App

---

Use `/write-spec` to create detailed feature specifications for each item in the roadmap above.
