# Feature Index

> Central tracking for all features. Updated by skills automatically.

## Status Legend
- **Roadmap** - `/init` done, feature identified in feature map, no spec file yet
- **Planned** - `/write-spec` done, full spec written, architecture not yet designed
- **Architected** - `/architecture` done, tech design approved, ready to build
- **In Progress** - `/frontend` or `/backend` active or completed, not yet in QA
- **In Review** - `/qa` active, testing in progress
- **Approved** - `/qa` passed, no critical/high bugs, ready to deploy
- **Deployed** - `/deploy` done, live in production

## Features

| ID | Feature | Status | Spec | Created | Dependencies |
|----|---------|--------|------|---------|---------------|
| PROJ-1 | Supabase Infrastructure Setup | Deployed | [Spec](PROJ-1-supabase-infrastructure-setup.md) | 2026-06-19 | None |
| PROJ-2 | Auth (Login) | Deployed | [Spec](PROJ-2-auth-login-signup.md) | 2026-06-19 | PROJ-1 |
| PROJ-3 | Kontakt anlegen & verwalten | Deployed | [Spec](PROJ-3-kontakt-anlegen-verwalten.md) | 2026-06-19 | PROJ-1, PROJ-2 |
| PROJ-4 | Kontaktliste & Filter | Deployed | [Spec](PROJ-4-kontaktliste-filter.md) | 2026-06-19 | PROJ-3 |
| PROJ-5 | Interaktions-Log | Deployed | [Spec](PROJ-5-interaktions-log.md) | 2026-06-19 | PROJ-3 |
| PROJ-6 | Follow-up Dashboard & Tagesansicht (inkl. Anlässe/Geburtstage, AI-Nachrichtenvorschlag, Copy-Button, Kalender-Link, 14-Tage-Vorschau, Import-Events) | Deployed | [Spec](PROJ-6-follow-up-dashboard.md) | 2026-06-19 | PROJ-3, PROJ-5, PROJ-10 |
| PROJ-7 | Foto-Upload | Roadmap | - | 2026-06-19 | PROJ-3 |
| PROJ-8 | Netzwerk-Analytics (periodisch) | Deployed | [Spec](PROJ-8-netzwerk-analytics.md) | 2026-06-22 | PROJ-3, PROJ-5 |
| PROJ-9 | Monatlicher AI-Report per Mail | Deployed | [Spec](PROJ-9-monatlicher-ai-report.md) | 2026-06-23 | PROJ-1, PROJ-5, PROJ-8 |
| PROJ-10 | LinkedIn-CSV-Import | Deployed | [Spec](PROJ-10-linkedin-csv-import.md) | 2026-06-24 | PROJ-3 |
| PROJ-11 | AI Chat Assistant (Sidebar-Popup) | Deployed | [Spec](PROJ-11-ai-chat-assistant.md) | 2026-06-29 | PROJ-3, PROJ-5 |
| PROJ-12 | Projekte/Cases (Engagement-Container: Beteiligte + Projekt-Log) | Deployed | [Spec](PROJ-12-projekte-cases.md) | 2026-06-30 | PROJ-3, PROJ-5 |
| PROJ-13 | Rolloff-Wizard (AI-Bulk-Nachfass bei Projektende) | Roadmap | - | 2026-06-30 | PROJ-12, PROJ-6 |
| PROJ-14 | City-Trip-Modus (Kontakte vor Ort + Batch-Draft) | Roadmap | - | 2026-06-30 | PROJ-12 |
| PROJ-15 | Profil (Umbenennung Projekte → Profil + Karriere-Stats-Header) | In Progress | [Spec](PROJ-15-profil.md) | 2026-06-30 | PROJ-12, PROJ-3, PROJ-6 |

<!-- Add features above this line -->

## Next Available ID: PROJ-16
