import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isSupabaseServerConfigured } from '@/lib/supabase/config';
import {
  rowToGoal, rowToApproval, rowToCheckin, rowToAudit,
  rowToNotification, rowToEscalationRule, rowToEscalationLog, rowToUser,
  goalToRow, approvalToRow, checkinToRow, auditToRow,
  notificationToRow, escalationRuleToRow, escalationLogToRow, userToRow,
} from '@/lib/db/sync-mappers';
import { MOCK_USERS } from '@/lib/auth-context';
import { User } from '@/lib/types';

// ─── GET — load all data ──────────────────────────────────────────────────────

export async function GET() {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ configured: false });
  }

  try {
    const db = createServiceClient();

    const [goals, approvals, checkins, auditLogs, notifications, escalationRules, escalationLogs, profiles] =
      await Promise.all([
        db.from('goals').select('*').order('created_at', { ascending: false }),
        db.from('approvals').select('*').order('submitted_at', { ascending: false }),
        db.from('checkins').select('*').order('submitted_at', { ascending: false }),
        db.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(500),
        db.from('notifications').select('*').order('created_at', { ascending: false }),
        db.from('escalation_rules').select('*'),
        db.from('escalation_logs').select('*').order('created_at', { ascending: false }),
        db.from('profiles').select('*'),
      ]);

    // Build users map
    const users: Record<string, ReturnType<typeof rowToUser>> = { ...MOCK_USERS };
    (profiles.data ?? []).forEach((p) => { users[p.id] = rowToUser(p); });

    return NextResponse.json({
      configured: true,
      goals: (goals.data ?? []).map(rowToGoal),
      approvals: (approvals.data ?? []).map(rowToApproval),
      checkins: (checkins.data ?? []).map(rowToCheckin),
      auditLogs: (auditLogs.data ?? []).map(rowToAudit),
      notifications: (notifications.data ?? []).map(rowToNotification),
      escalationRules: (escalationRules.data ?? []).map(rowToEscalationRule),
      escalationLogs: (escalationLogs.data ?? []).map(rowToEscalationLog),
      users,
    });
  } catch (err) {
    console.error('[sync GET]', err);
    return NextResponse.json({ configured: false, error: String(err) });
  }
}

// ─── POST — upsert full state ─────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ ok: false, reason: 'not_configured' });
  }

  try {
    const body = await request.json();
    const db = createServiceClient();

    // Upsert users/profiles
    const userList = Object.values(body.users ?? {}) as User[];
    if (userList.length) {
      await db.from('profiles').upsert(userList.map(userToRow), { onConflict: 'id' });
    }

    // Upsert all tables in dependency order
    const tables: Array<{ name: string; rows: unknown[] }> = [
      { name: 'goals',            rows: (body.goals ?? []).map(goalToRow) },
      { name: 'approvals',        rows: (body.approvals ?? []).map(approvalToRow) },
      { name: 'checkins',         rows: (body.checkins ?? []).map(checkinToRow) },
      { name: 'audit_logs',       rows: (body.auditLogs ?? []).map(auditToRow) },
      { name: 'notifications',    rows: (body.notifications ?? []).map(notificationToRow) },
      { name: 'escalation_rules', rows: (body.escalationRules ?? []).map(escalationRuleToRow) },
      { name: 'escalation_logs',  rows: (body.escalationLogs ?? []).map(escalationLogToRow) },
    ];

    for (const { name, rows } of tables) {
      if (!rows.length) continue;
      const { error } = await db.from(name).upsert(rows as never[], { onConflict: 'id' });
      if (error) {
        console.error(`[sync POST] ${name}:`, error.message);
        // Don't fail the whole sync for one table error
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[sync POST]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// ─── PATCH — single-record mutations (fast path) ─────────────────────────────

export async function PATCH(request: Request) {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ ok: false, reason: 'not_configured' });
  }

  try {
    const { table, id, data } = await request.json();
    const db = createServiceClient();
    const { error } = await db.from(table).upsert({ id, ...data }, { onConflict: 'id' });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
