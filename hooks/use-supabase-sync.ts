'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { toDate } from '@/lib/utils';
import { Goal, Approval, CheckIn, AuditLog, Notification, EscalationRule, EscalationLog, User } from '@/lib/types';

// ─── Date revival helpers ─────────────────────────────────────────────────────
// NextResponse.json() serialises Date → ISO string. These functions coerce them
// back to Date objects before setting them into the Zustand store.

function reviveGoal(g: Record<string, unknown>): Goal {
  return {
    ...(g as unknown as Goal),
    deadline:    toDate(g.deadline as string),
    createdAt:   toDate(g.createdAt as string),
    updatedAt:   toDate(g.updatedAt as string),
    approvedAt:  g.approvedAt  ? toDate(g.approvedAt  as string) : undefined,
  };
}

function reviveApproval(a: Record<string, unknown>): Approval {
  const history = ((a.history ?? []) as Array<Record<string, unknown>>).map((h) => ({
    ...(h as Approval['history'][number]),
    timestamp: toDate(h.timestamp as string),
  }));
  return {
    ...(a as unknown as Approval),
    submittedAt: toDate(a.submittedAt as string),
    reviewedAt:  a.reviewedAt ? toDate(a.reviewedAt as string) : undefined,
    history,
  };
}

function reviveCheckin(c: Record<string, unknown>): CheckIn {
  return {
    ...(c as unknown as CheckIn),
    submittedAt:  toDate(c.submittedAt as string),
    commentedAt:  c.commentedAt ? toDate(c.commentedAt as string) : undefined,
  };
}

function reviveAuditLog(l: Record<string, unknown>): AuditLog {
  return {
    ...(l as unknown as AuditLog),
    timestamp: toDate(l.timestamp as string),
  };
}

function reviveNotification(n: Record<string, unknown>): Notification {
  return {
    ...(n as unknown as Notification),
    createdAt: toDate(n.createdAt as string),
  };
}

function reviveEscalationLog(l: Record<string, unknown>): EscalationLog {
  return {
    ...(l as unknown as EscalationLog),
    createdAt:  toDate(l.createdAt as string),
    resolvedAt: l.resolvedAt ? toDate(l.resolvedAt as string) : undefined,
  };
}

/**
 * Supabase sync hook.
 *
 * On mount  → GET /api/sync  → hydrate Zustand store from DB (with date revival)
 * On change → POST /api/sync (debounced 1.5s) → persist mutations to DB
 *
 * Falls back silently to in-memory mock data when Supabase is not configured.
 */
export function useSupabaseSync() {
  const hydrated = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to all mutable slices
  const goals            = useStore((s) => s.goals);
  const approvals        = useStore((s) => s.approvals);
  const checkins         = useStore((s) => s.checkins);
  const auditLogs        = useStore((s) => s.auditLogs);
  const notifications    = useStore((s) => s.notifications);
  const escalationRules  = useStore((s) => s.escalationRules);
  const escalationLogs   = useStore((s) => s.escalationLogs);
  const users            = useStore((s) => s.users);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/sync')
      .then((r) => r.json())
      .then((data) => {
        if (!data.configured) return; // use mock data

        // Revive all Date fields that JSON serialisation turned into strings
        const revivedGoals         = (data.goals            ?? []).map(reviveGoal);
        const revivedApprovals     = (data.approvals        ?? []).map(reviveApproval);
        const revivedCheckins      = (data.checkins         ?? []).map(reviveCheckin);
        const revivedAuditLogs     = (data.auditLogs        ?? []).map(reviveAuditLog);
        const revivedNotifications = (data.notifications    ?? []).map(reviveNotification);
        const revivedEscLogs       = (data.escalationLogs   ?? []).map(reviveEscalationLog);

        useStore.setState({
          goals:           revivedGoals.length           ? revivedGoals           : useStore.getState().goals,
          approvals:       revivedApprovals,
          checkins:        revivedCheckins,
          auditLogs:       revivedAuditLogs,
          notifications:   revivedNotifications,
          escalationRules: data.escalationRules?.length  ? data.escalationRules   : useStore.getState().escalationRules,
          escalationLogs:  revivedEscLogs,
          users:           data.users                    ?? useStore.getState().users,
        });

        // Mark hydrated after a tick so the initial setState doesn't trigger a push
        setTimeout(() => { hydrated.current = true; }, 200);
      })
      .catch((err) => {
        console.warn('[sync] load failed, using mock data:', err);
        // Still mark hydrated so mutations can be pushed later
        setTimeout(() => { hydrated.current = true; }, 200);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced push on any mutation ─────────────────────────────────────────
  useEffect(() => {
    if (!hydrated.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals, approvals, checkins, auditLogs,
          notifications, escalationRules, escalationLogs, users,
        }),
      }).catch((err) => console.warn('[sync] push failed:', err));
    }, 1500);

    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [goals, approvals, checkins, auditLogs, notifications, escalationRules, escalationLogs, users]);
}
