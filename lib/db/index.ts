import { supabase } from '../supabase';
import { Goal, Approval, CheckIn, AuditLog, Notification, EscalationRule, EscalationLog, User } from '../types';
import {
  rowToGoal, rowToApproval, rowToCheckin, rowToAudit,
  rowToNotification, rowToEscalationRule, rowToEscalationLog, rowToUser,
  goalToRow, approvalToRow, checkinToRow, auditToRow,
  notificationToRow, escalationRuleToRow, escalationLogToRow,
} from './sync-mappers';

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function getAllGoals(): Promise<Goal[]> {
  const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToGoal);
}

export async function createGoal(goal: Goal): Promise<void> {
  const { error } = await supabase.from('goals').insert(goalToRow(goal));
  if (error) throw error;
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
  if (updates.deadline !== undefined) row.deadline = updates.deadline.toISOString();
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.performanceStatus !== undefined) row.performance_status = updates.performanceStatus;
  if (updates.approvedBy !== undefined) row.approved_by = updates.approvedBy ?? null;
  if (updates.approvedAt !== undefined) row.approved_at = updates.approvedAt?.toISOString() ?? null;
  if (updates.isShared !== undefined) row.is_shared = updates.isShared;
  if (updates.sharedBy !== undefined) row.shared_by = updates.sharedBy ?? null;
  if (updates.parentGoalId !== undefined) row.parent_goal_id = updates.parentGoalId ?? null;
  row.updated_at = new Date().toISOString();

  const { error } = await supabase.from('goals').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export async function getAllApprovals(): Promise<Approval[]> {
  const { data, error } = await supabase.from('approvals').select('*').order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToApproval);
}

export async function createApproval(approval: Approval): Promise<void> {
  const { error } = await supabase.from('approvals').insert(approvalToRow(approval));
  if (error) throw error;
}

export async function updateApproval(id: string, updates: Partial<Approval>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.comments !== undefined) row.comments = updates.comments;
  if (updates.reviewedBy !== undefined) row.reviewed_by = updates.reviewedBy ?? null;
  if (updates.reviewedAt !== undefined) row.reviewed_at = updates.reviewedAt?.toISOString() ?? null;
  if (updates.history !== undefined) row.history = updates.history;

  const { error } = await supabase.from('approvals').update(row).eq('id', id);
  if (error) throw error;
}

// ─── Check-ins ────────────────────────────────────────────────────────────────

export async function getAllCheckins(): Promise<CheckIn[]> {
  const { data, error } = await supabase.from('checkins').select('*').order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToCheckin);
}

export async function createCheckin(checkin: CheckIn): Promise<void> {
  const { error } = await supabase.from('checkins').insert(checkinToRow(checkin));
  if (error) throw error;
}

export async function updateCheckinComment(id: string, comment: string): Promise<void> {
  const { error } = await supabase
    .from('checkins')
    .update({ manager_comment: comment, commented_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function getAllAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToAudit);
}

export async function createAuditLog(log: AuditLog): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert(auditToRow(log));
  if (error) throw error;
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
  const { error } = await supabase.from('notifications').insert(notificationToRow(n));
  if (error) throw error;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
  if (error) throw error;
}

// ─── Escalation Rules ─────────────────────────────────────────────────────────

export async function getEscalationRules(): Promise<EscalationRule[]> {
  const { data, error } = await supabase.from('escalation_rules').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToEscalationRule);
}

export async function updateEscalationRule(id: string, updates: Partial<EscalationRule>): Promise<void> {
  const { error } = await supabase.from('escalation_rules').update(escalationRuleToRow({ id, ...updates } as EscalationRule)).eq('id', id);
  if (error) throw error;
}

// ─── Escalation Logs ──────────────────────────────────────────────────────────

export async function getEscalationLogs(): Promise<EscalationLog[]> {
  const { data, error } = await supabase.from('escalation_logs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToEscalationLog);
}

export async function createEscalationLog(log: EscalationLog): Promise<void> {
  const { error } = await supabase.from('escalation_logs').insert(escalationLogToRow(log));
  if (error) throw error;
}

export async function resolveEscalationLog(id: string): Promise<void> {
  const { error } = await supabase
    .from('escalation_logs')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ─── Users / Profiles ─────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToUser);
}
