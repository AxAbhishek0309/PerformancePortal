import {
  Goal,
  Approval,
  CheckIn,
  AuditLog,
  Notification,
  EscalationRule,
  EscalationLog,
  User,
} from '../types';
import { toDate } from '../utils';

/** Safely convert any date-like value (Date | string | number | null) to an ISO string. */
function toISO(value: Date | string | number | null | undefined): string {
  if (value == null) return new Date().toISOString();
  return toDate(value).toISOString();
}

// ─── DB row → app types ───────────────────────────────────────────────────────

export function rowToGoal(r: Record<string, unknown>): Goal {
  return {
    id: r.id as string,
    ownerId: r.owner_id as string,
    title: r.title as string,
    description: r.description as string,
    thrustArea: r.thrust_area as Goal['thrustArea'],
    unitOfMeasurement: r.unit_of_measurement as string,
    uomType: r.uom_type as Goal['uomType'],
    targetValue: Number(r.target_value),
    currentValue: Number(r.current_value),
    weightage: Number(r.weightage),
    deadline: toDate(r.deadline as string),
    status: r.status as Goal['status'],
    performanceStatus: r.performance_status as Goal['performanceStatus'],
    approvedBy: r.approved_by as string | undefined,
    approvedAt: r.approved_at ? toDate(r.approved_at as string) : undefined,
    isShared: Boolean(r.is_shared),
    sharedBy: r.shared_by as string | undefined,
    parentGoalId: r.parent_goal_id as string | undefined,
    createdAt: toDate(r.created_at as string),
    updatedAt: toDate(r.updated_at as string),
  };
}

export function rowToApproval(r: Record<string, unknown>): Approval {
  const history = (r.history as Approval['history']) ?? [];
  return {
    id: r.id as string,
    goalId: r.goal_id as string,
    goalTitle: r.goal_title as string,
    goalDescription: r.goal_description as string,
    submittedBy: r.submitted_by as string,
    submittedAt: toDate(r.submitted_at as string),
    reviewedBy: r.reviewed_by as string | undefined,
    reviewedAt: r.reviewed_at ? toDate(r.reviewed_at as string) : undefined,
    status: r.status as Approval['status'],
    comments: r.comments as string,
    history: history.map((h) => ({ ...h, timestamp: toDate(h.timestamp) })),
  };
}

export function rowToCheckin(r: Record<string, unknown>): CheckIn {
  return {
    id: r.id as string,
    goalId: r.goal_id as string,
    ownerId: r.owner_id as string,
    period: r.period as string,
    progressValue: Number(r.progress_value),
    notes: r.notes as string,
    submittedAt: toDate(r.submitted_at as string),
    managerComment: r.manager_comment as string | undefined,
    commentedAt: r.commented_at ? toDate(r.commented_at as string) : undefined,
  };
}

export function rowToAudit(r: Record<string, unknown>): AuditLog {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    action: r.action as string,
    resourceType: r.resource_type as AuditLog['resourceType'],
    resourceId: r.resource_id as string,
    changes: r.changes as AuditLog['changes'],
    afterLock: Boolean(r.after_lock),
    timestamp: toDate(r.timestamp as string),
  };
}

export function rowToNotification(r: Record<string, unknown>): Notification {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    type: r.type as Notification['type'],
    title: r.title as string,
    message: r.message as string,
    relatedId: r.related_id as string | undefined,
    read: Boolean(r.read),
    createdAt: toDate(r.created_at as string),
  };
}

export function rowToEscalationRule(r: Record<string, unknown>): EscalationRule {
  return {
    id: r.id as string,
    trigger: r.trigger as EscalationRule['trigger'],
    thresholdDays: Number(r.threshold_days),
    notifyRoles: r.notify_roles as EscalationRule['notifyRoles'],
    active: Boolean(r.active),
  };
}

export function rowToEscalationLog(r: Record<string, unknown>): EscalationLog {
  return {
    id: r.id as string,
    ruleId: r.rule_id as string,
    trigger: r.trigger as EscalationLog['trigger'],
    targetUserId: r.target_user_id as string,
    escalatedTo: r.escalated_to as string[],
    message: r.message as string,
    resolvedAt: r.resolved_at ? toDate(r.resolved_at as string) : undefined,
    createdAt: toDate(r.created_at as string),
  };
}

export function rowToUser(r: Record<string, unknown>): User {
  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    password: r.password as string | undefined,
    role: r.role as User['role'],
    department: r.department as string | undefined,
    avatar: r.avatar as string | undefined,
    managerId: r.manager_id as string | undefined,
  };
}

// ─── app types → DB rows ──────────────────────────────────────────────────────

export function goalToRow(g: Goal) {
  return {
    id: g.id,
    owner_id: g.ownerId,
    title: g.title,
    description: g.description,
    thrust_area: g.thrustArea,
    unit_of_measurement: g.unitOfMeasurement,
    uom_type: g.uomType,
    target_value: g.targetValue,
    current_value: g.currentValue,
    weightage: g.weightage,
    deadline: toISO(g.deadline),
    status: g.status,
    performance_status: g.performanceStatus,
    approved_by: g.approvedBy ?? null,
    approved_at: g.approvedAt ? toISO(g.approvedAt) : null,
    is_shared: g.isShared ?? false,
    shared_by: g.sharedBy ?? null,
    parent_goal_id: g.parentGoalId ?? null,
    created_at: toISO(g.createdAt),
    updated_at: toISO(g.updatedAt),
  };
}

export function approvalToRow(a: Approval) {
  return {
    id: a.id,
    goal_id: a.goalId,
    goal_title: a.goalTitle,
    goal_description: a.goalDescription,
    submitted_by: a.submittedBy,
    submitted_at: toISO(a.submittedAt),
    reviewed_by: a.reviewedBy ?? null,
    reviewed_at: a.reviewedAt ? toISO(a.reviewedAt) : null,
    status: a.status,
    comments: a.comments,
    history: a.history,
  };
}

export function checkinToRow(c: CheckIn) {
  return {
    id: c.id,
    goal_id: c.goalId,
    owner_id: c.ownerId,
    period: c.period,
    progress_value: c.progressValue,
    notes: c.notes,
    submitted_at: toISO(c.submittedAt),
    manager_comment: c.managerComment ?? null,
    commented_at: c.commentedAt ? toISO(c.commentedAt) : null,
  };
}

export function auditToRow(l: AuditLog) {
  return {
    id: l.id,
    user_id: l.userId,
    action: l.action,
    resource_type: l.resourceType,
    resource_id: l.resourceId,
    changes: l.changes ?? null,
    after_lock: l.afterLock ?? false,
    timestamp: toISO(l.timestamp),
  };
}

export function notificationToRow(n: Notification) {
  return {
    id: n.id,
    user_id: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    related_id: n.relatedId ?? null,
    read: n.read,
    created_at: toISO(n.createdAt),
  };
}

export function escalationRuleToRow(r: EscalationRule) {
  return {
    id: r.id,
    trigger: r.trigger,
    threshold_days: r.thresholdDays,
    notify_roles: r.notifyRoles,
    active: r.active,
  };
}

export function escalationLogToRow(l: EscalationLog) {
  return {
    id: l.id,
    rule_id: l.ruleId,
    trigger: l.trigger,
    target_user_id: l.targetUserId,
    escalated_to: l.escalatedTo,
    message: l.message,
    resolved_at: l.resolvedAt ? toISO(l.resolvedAt) : null,
    created_at: toISO(l.createdAt),
  };
}

export function userToRow(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    password: u.password ?? null,
    role: u.role,
    department: u.department ?? null,
    avatar: u.avatar ?? null,
    manager_id: u.managerId ?? null,
  };
}
