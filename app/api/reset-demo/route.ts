import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isSupabaseServerConfigured } from '@/lib/supabase/config';

const DEMO_GOAL = {
  id: 'goal-shared-demo',
  owner_id: 'emp-001',
  title: 'Achieve 95% Customer Satisfaction Score',
  description:
    'Maintain a CSAT score of 95% or above across all customer touchpoints ' +
    'by resolving tickets within SLA and proactively following up on escalations.',
  thrust_area: 'Customer Success',
  unit_of_measurement: 'Percentage (%)',
  uom_type: 'min',
  target_value: 95,
  current_value: 0,
  weightage: 50,
  deadline: '2026-12-31T23:59:59Z',
  status: 'locked',
  performance_status: 'not_started',
  is_shared: true,
  shared_by: 'mgr-001',
  parent_goal_id: 'goal-shared-demo',
  approved_by: 'mgr-001',
  approved_at: '2026-05-01T00:00:00Z',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
};

const DEMO_NOTIFICATIONS = [
  {
    id: 'notif-shared-1',
    user_id: 'emp-001',
    type: 'goal_approved',
    title: 'Shared Goal Assigned',
    message:
      'Sarah Chen assigned you a shared goal: "Achieve 95% Customer Satisfaction Score". ' +
      'You can adjust the weightage. Submit a check-in when the window opens.',
    related_id: 'goal-shared-demo',
    read: false,
    created_at: '2026-05-01T00:00:00Z',
  },
  {
    id: 'notif-mgr-1',
    user_id: 'mgr-001',
    type: 'checkin_requested',
    title: 'Shared Goal Pushed',
    message:
      '"Achieve 95% Customer Satisfaction Score" has been pushed to Alex Johnson. Awaiting their first check-in.',
    related_id: 'goal-shared-demo',
    read: false,
    created_at: '2026-05-01T00:00:00Z',
  },
];

export async function POST() {
  if (!isSupabaseServerConfigured()) {
    // No Supabase — nothing to reset, mock data is in-memory
    return NextResponse.json({ ok: true, mode: 'mock' });
  }

  try {
    const db = createServiceClient();

    // Wipe transactional tables in FK-safe order
    // goals has ON DELETE CASCADE so checkins/approvals go with it
    await db.from('audit_logs').delete().neq('id', '');
    await db.from('escalation_logs').delete().neq('id', '');
    await db.from('notifications').delete().neq('id', '');
    await db.from('checkins').delete().neq('id', '');
    await db.from('approvals').delete().neq('id', '');
    await db.from('goals').delete().neq('id', '');

    // Insert demo goal
    const { error: goalErr } = await db.from('goals').insert(DEMO_GOAL);
    if (goalErr) throw new Error(`goals: ${goalErr.message}`);

    // Insert demo notifications
    const { error: notifErr } = await db.from('notifications').insert(DEMO_NOTIFICATIONS);
    if (notifErr) throw new Error(`notifications: ${notifErr.message}`);

    return NextResponse.json({ ok: true, mode: 'supabase' });
  } catch (err) {
    console.error('[reset-demo]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
