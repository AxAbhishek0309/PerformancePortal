<div align="center">

# ⚡ Atomberg Goal Portal
### In-House Goal Setting & Performance Tracking System
#### AtomQuest Hackathon 1.0 — Problem Statement Submission

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Groq AI](https://img.shields.io/badge/Groq-AI_Suggestions-F55036?style=for-the-badge)](https://groq.com)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

</div>

---

## 🚀 Quick Start

```bash
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

Open → [http://localhost:3000/login](http://localhost:3000/login)

### 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 👨‍💼 Employee | `employee@company.com` | `password123` |
| 👩‍💼 Manager (L1) | `manager@company.com` | `password123` |
| 👨‍💻 Admin / HR | `admin@company.com` | `password123` |

---

## 🗺️ User Journey Flows

### 👨‍💼 Employee Flow

```
  LOGIN
    │
    ▼
  My Goals Dashboard
    │
    ├─── No goals yet?
    │         │
    │         ▼
    │    Create Goal (draft)
    │    ┌─────────────────────────────────┐
    │    │  • Select Thrust Area           │
    │    │  • Title + Description          │
    │    │  • UoM Type (Min/Max/Timeline/  │
    │    │    Zero)                        │
    │    │  • Target Value + Weightage     │
    │    │  • Deadline                     │
    │    │  ✨ AI Suggest (Groq)           │
    │    └─────────────────────────────────┘
    │         │
    │         ▼
    │    Repeat until total weightage = 100%
    │    (min 10% per goal, max 8 goals)
    │         │
    │         ▼
    │    Submit Goal Sheet ──────────────────► Manager notified
    │                                          (in-app + Teams)
    │
    ├─── Goal returned?
    │         │
    │         ▼
    │    Edit → Resubmit
    │
    └─── Goal locked (approved)?
              │
              ▼
         Submit Quarterly Check-in
         ┌──────────────────────────────┐
         │  • Actual Achievement value  │
         │  • Progress Notes            │
         │  • Status: Not Started /     │
         │    On Track / Completed      │
         └──────────────────────────────┘
              │
              ▼
         Manager sees update in real-time
         Manager adds structured comment
```

---

### 👩‍💼 Manager (L1) Flow

```
  LOGIN
    │
    ▼
  Team Dashboard
    │
    ├─── Pending Approvals?
    │         │
    │         ▼
    │    Review Goal Sheet
    │    ┌──────────────────────────────────┐
    │    │  • View goal details             │
    │    │  • Inline-edit Target/Weightage  │
    │    │  • Approve → Goal LOCKED         │
    │    │  • Return (with comment)         │
    │    │  • Reject (with comment)         │
    │    └──────────────────────────────────┘
    │         │
    │         ▼
    │    Employee notified (in-app + Teams)
    │
    ├─── Check-in window open?
    │         │
    │         ▼
    │    Team Page → Planned vs Actual Table
    │    ┌──────────────────────────────────┐
    │    │  Employee │ Goal │ Planned │      │
    │    │  Actual   │ Score│ Status  │ 💬   │
    │    └──────────────────────────────────┘
    │         │
    │         ▼
    │    Click 💬 → Goal Detail → Add Comment
    │
    └─── Push Shared Goal?
              │
              ▼
         Shared Goals Page
         Select employees → Push KPI
         (Recipients can only adjust weightage)
```

---

### 👨‍💻 Admin / HR Flow

```
  LOGIN
    │
    ▼
  Admin Dashboard (org-wide metrics)
    │
    ├─── Team Goals Page
    │         │
    │         ├── Unlock locked goal (employee can edit again)
    │         └── Delete goal(s) — with confirmation
    │
    ├─── Audit Logs
    │         │
    │         └── Post-lock changes only (BRD §4)
    │             Who changed what and when → Export CSV
    │
    ├─── Escalations
    │         │
    │         ├── Configure rules (threshold days, toggle on/off)
    │         ├── View open escalation logs
    │         └── Resolve escalations
    │
    ├─── Analytics
    │         │
    │         ├── QoQ Trends (line chart)
    │         ├── Dept Performance (bar chart)
    │         ├── Goal Distribution by Thrust Area (pie)
    │         ├── Performance Status Breakdown (donut)
    │         ├── Employee Weighted Scores (horizontal bar)
    │         └── Manager Effectiveness (check-in rates)
    │
    ├─── Completion Dashboard
    │         │
    │         └── Per-employee check-in status by quarter
    │             Completed / On Track / Not Started badges
    │
    └─── Settings → Danger Zone
              │
              └── Reset to Demo State (wipes DB, restores seed)
```

---

## 📐 Goal Lifecycle State Machine

```
                    ┌─────────────────────────────────────────┐
                    │           GOAL LIFECYCLE                │
                    └─────────────────────────────────────────┘

  Employee creates
        │
        ▼
    ┌───────┐   Submit Sheet    ┌───────────┐
    │ DRAFT │ ────────────────► │ SUBMITTED │
    └───────┘  (weightage=100%) └───────────┘
        ▲                             │
        │                    Manager reviews
        │                             │
        │              ┌──────────────┼──────────────┐
        │              ▼              ▼              ▼
        │          APPROVE         RETURN         REJECT
        │              │              │              │
        │              ▼              ▼              ▼
        │         ┌────────┐    ┌──────────┐   ┌──────────┐
        │         │ LOCKED │    │ RETURNED │   │ RETURNED │
        │         └────────┘    └──────────┘   └──────────┘
        │              │              │
        │              │         Employee edits
        │              │              │
        │         Check-ins      Resubmit ──────────────────►
        │         available           │
        │              │         (back to SUBMITTED)
        │              ▼
        │    ┌──────────────────┐
        │    │  QUARTERLY       │
        │    │  CHECK-INS       │
        │    │  (Jul/Oct/Jan/   │
        │    │   Mar-Apr)       │
        │    └──────────────────┘
        │              │
        │    Admin UNLOCK (exception)
        └──────────────┘
```

---

## 📊 BRD Progress Score Formulas

```
┌─────────────────┬──────────────────────────────┬─────────────────────────────┐
│   UoM Type      │   Description                │   Formula                   │
├─────────────────┼──────────────────────────────┼─────────────────────────────┤
│ Min (Numeric)   │ Higher is better             │ Achievement ÷ Target × 100  │
│                 │ e.g. Revenue, Sales          │                             │
├─────────────────┼──────────────────────────────┼─────────────────────────────┤
│ Max (Numeric)   │ Lower is better              │ Target ÷ Achievement × 100  │
│                 │ e.g. TAT, Cost               │                             │
├─────────────────┼──────────────────────────────┼─────────────────────────────┤
│ Timeline        │ Date-based completion        │ Completion date vs Deadline │
│                 │                              │ Past deadline = 0%          │
├─────────────────┼──────────────────────────────┼─────────────────────────────┤
│ Zero            │ Zero = Success               │ If 0 → 100%, else 0%        │
│                 │ e.g. Safety incidents        │                             │
└─────────────────┴──────────────────────────────┴─────────────────────────────┘

  Weighted Score = Σ ( Goal Weightage% × Progress Score% )
                   across all goals for an employee
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Next.js 16 App Router (React)               │  │
│  │                                                          │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │  Employee   │  │   Manager    │  │     Admin      │  │  │
│  │  │  Pages      │  │   Pages      │  │    Pages       │  │  │
│  │  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │  │
│  │         └────────────────┼──────────────────┘           │  │
│  │                          ▼                               │  │
│  │              ┌───────────────────────┐                   │  │
│  │              │   Zustand Store       │                   │  │
│  │              │   (in-memory state)   │                   │  │
│  │              └───────────┬───────────┘                   │  │
│  └──────────────────────────┼───────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │ fetch (API calls)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes (Server)                  │
│                                                                 │
│   /api/sync    ──── GET/POST/PATCH/PUT/DELETE ──► Supabase     │
│   (service role key — bypasses RLS)                            │
│                                                                 │
│   /api/ai/suggest ──────────────────────────────► Groq API     │
│                                                                 │
│   /api/notify/teams ────────────────────────────► Teams        │
│                                                    Webhook      │
│   /api/reset-demo ──────────────────────────────► Supabase     │
│   (admin only — wipes + reseeds)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                        │
│                                                                 │
│   profiles  ◄──── goals ◄──── approvals                       │
│                     │                                          │
│                     ├──── checkins                             │
│                     └──── audit_logs                           │
│                                                                 │
│   notifications   escalation_rules   escalation_logs           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📅 BRD Cycle Schedule

```
  JAN          MAY          JUL          OCT          MAR/APR
   │            │            │            │            │
   ▼            ▼            ▼            ▼            ▼
┌──────┐  ┌──────────┐  ┌────────┐  ┌────────┐  ┌──────────┐
│  Q3  │  │  GOAL    │  │  Q1    │  │  Q2    │  │  Q4 /    │
│CHECK │  │ SETTING  │  │ CHECK  │  │ CHECK  │  │ ANNUAL   │
│  IN  │  │ WINDOW   │  │   IN   │  │   IN   │  │          │
└──────┘  └──────────┘  └────────┘  └────────┘  └──────────┘
           May 1 →        July        October     Mar–Apr
           Jun 30
```

---

## 🔔 Teams Integration Events

```
  Goal Submitted  ──────────────────────► 📋 Manager notified in Teams
  Goal Approved   ──────────────────────► ✅ Employee notified in Teams
  Goal Returned   ──────────────────────► 🔄 Employee notified in Teams
  Check-in Done   ──────────────────────► 📊 Manager notified in Teams

  Each card includes a deep-link → opens directly in the portal
```

---

## 🛡️ Escalation Module

```
  Rule triggers when threshold exceeded:

  ┌─────────────────────────────────────────────────────────┐
  │  TRIGGER                    │  DEFAULT THRESHOLD        │
  ├─────────────────────────────┼───────────────────────────┤
  │  Goal not submitted         │  7 days after cycle open  │
  │  Goal not approved          │  5 days after submission  │
  │  Check-in not completed     │  10 days into window      │
  └─────────────────────────────┴───────────────────────────┘
                    │
                    ▼
         In-app notification → Manager + Admin
         Escalation log created → Admin can resolve
         Runner checks every 5 minutes (client-side)
```

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| State | Zustand (in-memory + Supabase sync) |
| Database | Supabase (PostgreSQL) |
| Auth | Mock auth (localStorage) |
| AI | Groq (llama-3 for goal suggestions) |
| Notifications | Microsoft Teams (Incoming Webhook) |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Deployment | Vercel |

---

## 📦 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Optional | AI goal suggestions via Groq |
| `NEXT_PUBLIC_RELAX_CYCLE` | Optional | `true` = open all windows for demo |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-only; bypasses RLS |
| `TEAMS_WEBHOOK_URL` | Optional | Teams Incoming Webhook URL |
| `NEXT_PUBLIC_APP_URL` | Optional | App URL for Teams deep-links |

---

## 🚀 Deploy to Vercel

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "initial"
git remote add origin https://github.com/YOUR_USERNAME/REPO.git
git push -u origin main

# 2. Import on vercel.com → Add env vars → Deploy
```

---

## ✅ BRD Compliance Summary

| Section | Requirement | Status |
|---------|-------------|--------|
| §2.1 | Goal creation (Thrust Area, UoM, Target, Weightage) | ✅ |
| §2.1 | Validation: 100% total, min 10%, max 8 goals | ✅ |
| §2.1 | Manager L1 approval + inline edit | ✅ |
| §2.1 | Shared goals with achievement sync | ✅ |
| §2.2 | Quarterly check-ins with actual value + status | ✅ |
| §2.2 | Manager planned vs actual view + comment | ✅ |
| §2.2 | All 4 progress formulas (Min/Max/Timeline/Zero) | ✅ |
| §2.3 | Cycle window enforcement (5 windows) | ✅ |
| §4 | Achievement CSV export | ✅ |
| §4 | Real-time completion dashboard | ✅ |
| §4 | Post-lock audit trail | ✅ |
| §5.2 | Microsoft Teams notifications | ✅ |
| §5.3 | Escalation rules + auto-runner | ✅ |
| §5.4 | Analytics (QoQ, dept, distribution, manager effectiveness) | ✅ |
| Bonus | AI goal suggestions (Groq) | ✅ |
