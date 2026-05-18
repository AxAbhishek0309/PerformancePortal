/**
 * All DB operations go through /api/sync (POST/PATCH) which uses the service
 * role key server-side. Direct client-side Supabase calls with the anon key
 * would be blocked by RLS (error 42501) because no permissive policies exist.
 *
 * This module is kept for read operations only (used during initial load in
 * store.loadAll). Writes are handled exclusively via the sync API route.
 */
import { supabase } from '../supabase';
import { Goal, Approval, CheckIn, AuditLog, Notification, EscalationRule, EscalationLog, User } from '../types';
import {
  rowToGoal, rowToApproval, rowToCheckin, rowToAudit,
  rowToNotification, rowToEscalationRule, rowToEscalationLog, rowToUser,
  goalToRow, approvalToRow, checkinToRow, auditToRow,
  notificationToRow, escalationRuleToRow, escalationLogToRow,
} from './sync-mappers';

// ─── Sync API helper ─────────────────────────────────────────────────────────
// All mutations go through /api/sync (PATCH) which uses the service role key.
// This avoids RLS 42501 errors that occur when the anon client tries to write.

async function syncPatch(table: string, id: string, data: Record<string, unknown>): Promise<void> {
  const res = await fetch('/api/sync', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, id, data }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? `sync PATCH failed on ${table}`);
}

async function syncPost(table: string, row: Record<string, unknown>): Promise<void> {
  // PUT upserts a single pre-mapped DB row directly (no re-mapping server-side)
  const res = await fetch('/api/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, row }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? `sync PUT failed on ${table}`);
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function getAllGoals(): Promise<Goal[]> {
  const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToGoal);
}

export async function createGoal(goal: Goal): Promise<void> {
  await syncPost('goals', goalToRow(goal) as Record<string, unknown>);
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
  // Convert camelCase partial to snake_case partial for DB
  const row: Record<string, unknown> = {};
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.thrustArea !== undefined) row.thrust_area = updates.thrustArea;
  if (updates.unitOfMeasurement !== undefined) row.unit_of_measurement = updates.unitOfMeasurement;
  if (updates.uomType !== undefined) row.uom_type = updates.uomType;
  if (updates.targetValue !== undefined) row.target_value = updates.targetValue;
  if (updates.currentValue !== undefined) row.current_value = updates.currentValue;
  if (updates.weightage !== undefined) row.weightage = updates.weightage;
  if (updates.deadline !== undefined) row.deadline = (updates.deadline instanceof Date ? updates.deadline : new Date(updates.deadline as string)).toISOString();
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.performanceStatus !== undefined) row.performance_status = updates.performanceStatus;
  if (updates.approvedBy !== undefined) row.approved_by = updates.approvedBy ?? null;
  if (updates.approvedAt !== undefined) row.approved_at = updates.approvedAt ? (updates.approvedAt instanceof Date ? updates.approvedAt : new Date(updates.approvedAt as string)).toISOString() : null;
  if (updates.isShared !== undefined) row.is_shared = updates.isShared;
  if (updates.sharedBy !== undefined) row.shared_by = updates.sharedBy ?? null;
  if (updates.parentGoalId !== undefined) row.parent_goal_id = updates.parentGoalId ?? null;
  row.updated_at = new Date().toISOString();

  await syncPatch('goals', id, row);
}

export async function deleteGoal(id: string): Promise<void> {
  const res = await fetch('/api/sync', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: 'goals', id }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? 'sync DELETE failed on goals');
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export async function getAllApprovals(): Promise<Approval[]> {
  const { data, error } = await supabase.from('approvals').select('*').order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToApproval);
}

export async function createApproval(approval: Approval): Promise<void> {
  await syncPost('approvals', approvalToRow(approval) as Record<string, unknown>);
}

export async function updateApproval(id: string, updates: Partial<Approval>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.comments !== undefined) row.comments = updates.comments;
  if (updates.reviewedBy !== undefined) row.reviewed_by = updates.reviewedBy ?? null;
  if (updates.reviewedAt !== undefined) row.reviewed_at = updates.reviewedAt ? (updates.reviewedAt instanceof Date ? updates.reviewedAt : new Date(updates.reviewedAt as string)).toISOString() : null;
  if (updates.history !== undefined) row.history = updates.history;

  await syncPatch('approvals', id, row);
}

// ─── Check-ins ────────────────────────────────────────────────────────────────

export async function getAllCheckins(): Promise<CheckIn[]> {
  const { data, error } = await supabase.from('checkins').select('*').order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToCheckin);
}

export async function createCheckin(checkin: CheckIn): Promise<void> {
  await syncPost('checkins', checkinToRow(checkin) as Record<string, unknown>);
}

export async function updateCheckinComment(id: string, comment: string): Promise<void> {
  await syncPatch('checkins', id, {
    manager_comment: comment,
    commented_at: new Date().toISOString(),
  });
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function getAllAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToAudit);
}

export async function createAuditLog(log: AuditLog): Promise<void> {
  await syncPost('audit_logs', auditToRow(log) as Record<string, unknown>);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToNotification);
}

export async function getAllNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToNotification);
}

export async function createNotification(n: Notification): Promise<void> {
  await syncPost('notifications', notificationToRow(n) as Record<string, unknown>);
}

export async function markNotificationRead(id: string): Promise<void> {
  await syncPatch('notifications', id, { read: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const res = await fetch('/api/sync', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: 'notifications', bulkUpdate: { read: true }, where: { user_id: userId } }),
  });
  const json = await res.json();
  if (!json.ok) console.warn('[db] markAllNotificationsRead failed:', json.error);
}

// ─── Escalation Rules ─────────────────────────────────────────────────────────

export async function getEscalationRules(): Promise<EscalationRule[]> {
  const { data, error } = await supabase.from('escalation_rules').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToEscalationRule);
}

export async function updateEscalationRule(id: string, updates: Partial<EscalationRule>): Promise<void> {
  await syncPatch('escalation_rules', id, escalationRuleToRow({ id, ...updates } as EscalationRule) as Record<string, unknown>);
}

// ─── Escalation Logs ──────────────────────────────────────────────────────────

export async function getEscalationLogs(): Promise<EscalationLog[]> {
  const { data, error } = await supabase.from('escalation_logs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToEscalationLog);
}

export async function createEscalationLog(log: EscalationLog): Promise<void> {
  await syncPost('escalation_logs', escalationLogToRow(log) as Record<string, unknown>);
}

export async function resolveEscalationLog(id: string): Promise<void> {
  await syncPatch('escalation_logs', id, { resolved_at: new Date().toISOString() });
}

// ─── Users / Profiles ─────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToUser);
}
