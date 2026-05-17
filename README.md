# Performance Management Portal (Atomberg Hackathon)

Goal setting, manager approval, quarterly check-ins, and admin governance — built with **Next.js 16**, **Zustand**, and optional **Supabase** persistence.

## Quick start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login)

### Demo accounts

| Role     | Email                 | Password      |
|----------|-----------------------|---------------|
| Employee | employee@company.com  | password123   |
| Manager  | manager@company.com   | password123   |
| Admin    | admin@company.com     | password123   |

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Optional | AI goal suggestions |
| `NEXT_PUBLIC_RELAX_CYCLE` | Optional | `true` = open all BRD cycle windows for demos |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-only; enables `/api/sync` |

Without Supabase, data persists in **localStorage** via Zustand.

## Supabase setup (recommended for submission)

1. Create a project at [supabase.com](https://supabase.com)
2. In **SQL Editor**, run `supabase/migrations/001_initial.sql`
3. Add keys to `.env.local`
4. Restart dev server — app loads from DB and syncs changes automatically

## BRD coverage

- **Phase 1:** Goal sheet, thrust areas, UoM formulas, 100% / 10% / 8-goal rules, manager approval, shared goals
- **Phase 2:** Quarterly check-ins, performance status, progress scoring, cycle windows
- **Roles:** Employee, Manager (L1), Admin/HR
- **Reporting:** CSV export, completion dashboard, post-lock audit filter
- **Bonus:** Escalation rules + auto-runner, analytics charts

## Deploy (Vercel)

```bash
npm run build
```

Set env vars in Vercel dashboard, connect Supabase, deploy.

## Architecture

```
Browser (Next.js App Router)
  → Zustand (UI state + localStorage fallback)
  → /api/sync (when Supabase configured)
  → Supabase PostgreSQL
```
