# Organizza

Internal SaaS for Organizza (events production & staffing) to manage events, schedules, team, and HR records. Built with Next.js (App Router, TypeScript, Tailwind v4) and Supabase (Postgres, Auth, Storage).

Originally designed as an HTML/CSS/JS mockup in Claude Design (preserved under [`design/`](design/) for reference) and re-implemented here as a real application.

## Features

- **Auth** — Supabase email/password. No public sign-up: the first account in an empty project becomes admin; after that admins invite colleagues from Definições → Utilizadores. Any other new account starts with no access.
- **Dashboard** — live stats, upcoming events, today's shift agenda, overdue-task alerts.
- **Eventos** — cards / table / calendar views, filters, sorting, New Event panel.
- **Event Workspace** — Overview, Team, Files (Supabase Storage), Tasks, Notes.
- **Calendário** — weekly staffing grid with drag-and-drop shift reassignment and overlap/conflict detection.
- **Equipa** — public roster (skills, availability, participated events).
- **Pessoas** *(admin-only)* — sensitive HR records: IBAN/NIF masked with reveal, contract details, documents.
- **Documentos** — company-wide file library by category.
- **Definições** — profile, notification preferences, admin user-role management.
- **Plantas** *(staff)* + **Planta & lugares** *(couples, `/plano`)* — wedding floor-plan and seating planner. Staff control every map; invited couples log in to manage guests and seats per table, and every change they make is logged and colour-coded for staff. Read-only link for venues, print/PDF. See [`docs/seating-planner.md`](docs/seating-planner.md).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Supabase project, then copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Project Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` — same page, the **secret** key (only used by the seed script, never sent to the browser)
3. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor. Creates all tables, RLS policies, and the `documents` storage bucket.
   Then run [`supabase/seating-plans.sql`](supabase/seating-plans.sql), [`supabase/client-accounts.sql`](supabase/client-accounts.sql) [`supabase/plans-trash.sql`](supabase/plans-trash.sql) and [`supabase/lock-signup.sql`](supabase/lock-signup.sql) for the seating planner and closed sign-up, and add `<your-site>/plano/definir-password` to Supabase → Authentication → Redirect URLs.
4. (Optional) Seed demo data — 12-person roster, 9 events, sample tasks/notes/shifts:
   ```bash
   npm run seed
   ```
   Everyone gets the password `organizza-demo`; admin account is `ana.costa@organizza.pt`.
5. Start the dev server:
   ```bash
   npm run dev
   ```

## Data model

See [`supabase/schema.sql`](supabase/schema.sql). Every tenant-scoped table carries an `org_id` defaulting to a single seeded row — the app is single-company for now, but multi-tenancy later is a filter change rather than a rewrite.

RLS summary: everyone signed in can read events/tasks/shifts/notes/documents/roster; only `admin` role can create/edit events and shifts, and only admins can read or write `people_hr` / `hr_documents` (the sensitive HR tables).

## Known follow-ups

Not implemented yet, trimmed from the original design for scope:
- No dedicated Timeline tab on Event Workspace (no backing table)
- No avatar/cover image uploads
- Notification preferences are stored but no emails are actually sent
- Drag-and-drop shift reassignment is mouse-only (no touch support)
