import { create } from 'zustand';
import { Goal, Approval, CheckIn, AuditLog, User, PerformanceStatus, EscalationRule, EscalationLog, Notification } from './types';
import * as db from './db';
import {
  MOCK_GOALS_EXTENDED, MOCK_APPROVALS, MOCK_CHECKINS,
  MOCK_AUDIT_LOGS, MOCK_ESCALATION_RULES, MOCK_ESCALATION_LOGS, MOCK_NOTIFICATIONS,
} from './mock-data';
import { MOCK_USERS } from './auth-context';

// ─── Teams notification helper (fire-and-forget) ─────────────────────────────

function notifyTeams(body: Record<string, unknown>) {
  fetch('/api/notify/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {}); // silent — Teams is optional
}

// ─── Detect if Supabase is configured ────────────────────────────────────────

const USE_SUPABASE =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== '' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co';

// ─── Audit helper ─────────────────────────────────────────────────────────────

function auditEntry(
  userId: string,
  action: string,
  resourceType: AuditLog['resourceType'],
  resourceId: string,
  changes?: AuditLog['changes']
): AuditLog {
  // BRD §4 — mark as post-lock if the resource being changed is a locked goal
  const goals = useStore.getState?.()?.goals ?? [];
  const isLockedGoal =
    resourceType === 'goal' &&
    goals.some((g) => g.id === resourceId && g.status === 'locked');

  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId, action, resourceType, resourceId, changes,
    afterLock: isLockedGoal,
    timestamp: new Date(),
  };
}

// ─── State shape ──────────────────────────────────────────────────────────────

export interface AppState {
  goals: Goal[];
  approvals: Approval[];
  checkins: CheckIn[];
  auditLogs: AuditLog[];
  users: Record<string, User>;
  notifications: Notification[];
  escalationRules: EscalationRule[];
  escalationLogs: EscalationLog[];
  isLoading: boolean;

  // Bootstrap — load all data from Supabase (or mock)
  loadAll: () => Promise<void>;

  // Goal CRUD
  addGoal: (goal: Goal, actorId: string) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>, actorId: string) => Promise<void>;
  submitGoal: (id: string, actorId: string) => Promise<void>;
  deleteGoal: (id: string, actorId: string) => Promise<void>;
  setPerformanceStatus: (goalId: string, status: PerformanceStatus, actorId: string) => Promise<void>;

  // Approval workflow
  approveGoal: (approvalId: string, reviewerId: string) => Promise<void>;
  returnGoal: (approvalId: string, reviewerId: string, comment: string) => Promise<void>;
  rejectGoal: (approvalId: string, reviewerId: string, comment: string) => Promise<void>;
  editApprovalGoal: (approvalId: string, updates: Pick<Goal, 'targetValue' | 'weightage'>, actorId: string) => Promise<void>;

  // Admin
  unlockGoal: (goalId: string, actorId: string) => Promise<void>;
  pushSharedGoal: (baseGoal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>, recipientIds: string[], actorId: string) => Promise<void>;

  // Check-ins
  addCheckin: (checkin: CheckIn, actorId: string, performanceStatus: PerformanceStatus) => Promise<void>;
  addManagerComment: (checkinId: string, comment: string, actorId: string) => Promise<void>;

  // Notifications
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: (userId: string) => Promise<void>;
  addNotification: (n: Notification) => Promise<void>;

  // Escalation
  updateEscalationRule: (id: string, updates: Partial<EscalationRule>) => Promise<void>;
  addEscalationLog: (log: EscalationLog) => Promise<void>;
  resolveEscalation: (id: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<AppState>((set, get) => ({
  goals: MOCK_GOALS_EXTENDED,
  approvals: MOCK_APPROVALS,
  checkins: MOCK_CHECKINS,
  auditLogs: MOCK_AUDIT_LOGS,
  users: MOCK_USERS,
  notifications: MOCK_NOTIFICATIONS,
  escalationRules: MOCK_ESCALATION_RULES,
  escalationLogs: MOCK_ESCALATION_LOGS,
  isLoading: false,

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  loadAll: async () => {
    if (!USE_SUPABASE) return; // use mock data as-is
    set({ isLoading: true });
    try {
      const [goals, approvals, checkins, auditLogs, notifications, escalationRules, escalationLogs, userList] =
        await Promise.all([
          db.getAllGoals(),
          db.getAllApprovals(),
          db.getAllCheckins(),
          db.getAllAuditLogs(),
          db.getAllNotifications(),   // load all — header filters by current user client-side
          db.getEscalationRules(),
          db.getEscalationLogs(),
          db.getAllUsers(),
        ]);

      const usersMap: Record<string, User> = {};
      userList.forEach((u) => { usersMap[u.id] = u; });

      set({ goals, approvals, checkins, auditLogs, notifications, escalationRules, escalationLogs, users: usersMap });
    } catch (err) {
      console.error('loadAll error — falling back to mock data:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Goal CRUD ──────────────────────────────────────────────────────────────

  addGoal: async (goal, actorId) => {
    if (USE_SUPABASE) await db.createGoal(goal);
    const log = auditEntry(actorId, 'create', 'goal', goal.id);
    if (USE_SUPABASE) await db.createAuditLog(log);
    set((s) => ({ goals: [...s.goals, goal], auditLogs: [log, ...s.auditLogs] }));
  },

  updateGoal: async (id, updates, actorId) => {
    const existing = get().goals.find((g) => g.id === id);
    if (!existing) return;
    const changes: AuditLog['changes'] = {};
    (Object.keys(updates) as (keyof Goal)[]).forEach((k) => {
      if (existing[k] !== (updates as Partial<Goal>)[k])
        changes[k] = { before: existing[k], after: (updates as Partial<Goal>)[k] };
    });
    if (USE_SUPABASE) await db.updateGoal(id, updates);
    const log = auditEntry(actorId, 'update', 'goal', id, changes);
    if (USE_SUPABASE) await db.createAuditLog(log);
    set((s) => ({
      goals: s.goals.map((g) => g.id === id ? { ...g, ...updates, updatedAt: new Date() } : g),
      auditLogs: [log, ...s.auditLogs],
    }));
  },

  submitGoal: async (id, actorId) => {
    const { goals, approvals, notifications, users } = get();
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;

    // Route notification to the goal owner's manager, fallback to first manager found
    const owner = Object.values(users).find((u) => u.id === actorId);
    const managerId = owner?.managerId
      ?? Object.values(users).find((u) => u.role === 'manager')?.id
      ?? 'mgr-001';

    const newApproval: Approval = {
      id: `approval-${Date.now()}`,
      goalId: id, goalTitle: goal.title, goalDescription: goal.description,
      submittedBy: actorId, submittedAt: new Date(),
      status: 'pending', comments: '',
      history: [{ timestamp: new Date(), action: 'submitted', actor: actorId }],
    };
    const notif: Notification = {
      id: `notif-${Date.now()}`, userId: managerId,
      type: 'approval_needed', title: 'Goal Approval Required',
      message: `${owner?.name ?? actorId} submitted "${goal.title}" for approval`,
      relatedId: id, read: false, createdAt: new Date(),
    };
    const log = auditEntry(actorId, 'submit', 'goal', id);

    if (USE_SUPABASE) {
      await Promise.all([
        db.updateGoal(id, { status: 'submitted' }),
        db.createApproval(newApproval),
        db.createNotification(notif),
        db.createAuditLog(log),
      ]);
    }
    // Teams: notify manager that a goal was submitted
    notifyTeams({ event: 'goal_submitted', employeeName: owner?.name ?? actorId, goalTitle: goal.title });
    set({
      goals: goals.map((g) => g.id === id ? { ...g, status: 'submitted', updatedAt: new Date() } : g),
      approvals: [...approvals, newApproval],
      notifications: [...notifications, notif],
      auditLogs: [log, ...get().auditLogs],
    });
  },

  deleteGoal: async (id, actorId) => {
    if (USE_SUPABASE) await db.deleteGoal(id);
    const log = auditEntry(actorId, 'delete', 'goal', id);
    if (USE_SUPABASE) await db.createAuditLog(log);
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id), auditLogs: [log, ...s.auditLogs] }));
  },

  setPerformanceStatus: async (goalId, status, actorId) => {
    const old = get().goals.find((g) => g.id === goalId)?.performanceStatus;
    if (USE_SUPABASE) await db.updateGoal(goalId, { performanceStatus: status });
    const log = auditEntry(actorId, 'set-performance-status', 'goal', goalId, { performanceStatus: { before: old, after: status } });
    if (USE_SUPABASE) await db.createAuditLog(log);
    set((s) => ({
      goals: s.goals.map((g) => g.id === goalId ? { ...g, performanceStatus: status, updatedAt: new Date() } : g),
      auditLogs: [log, ...s.auditLogs],
    }));
  },

  // ── Approval workflow ──────────────────────────────────────────────────────

  approveGoal: async (approvalId, reviewerId) => {
    const { approvals, goals, notifications } = get();
    const approval = approvals.find((a) => a.id === approvalId);
    if (!approval) return;

    const updatedApproval: Partial<Approval> = {
      status: 'approved', reviewedBy: reviewerId, reviewedAt: new Date(),
      history: [...approval.history, { timestamp: new Date(), action: 'approved' as const, actor: reviewerId }],
    };
    const notif: Notification = {
      id: `notif-${Date.now()}`, userId: approval.submittedBy,
      type: 'goal_approved', title: 'Goal Approved',
      message: `Your goal "${approval.goalTitle}" has been approved`,
      relatedId: approval.goalId, read: false, createdAt: new Date(),
    };
    const log = auditEntry(reviewerId, 'approve', 'approval', approvalId, { status: { before: 'pending', after: 'approved' } });

    if (USE_SUPABASE) {
      await Promise.all([
        db.updateGoal(approval.goalId, { status: 'locked', approvedBy: reviewerId, approvedAt: new Date() }),
        db.updateApproval(approvalId, updatedApproval),
        db.createNotification(notif),
        db.createAuditLog(log),
      ]);
    }
    // Teams: notify employee their goal was approved
    const reviewer = Object.values(get().users).find((u) => u.id === reviewerId);
    notifyTeams({ event: 'goal_approved', goalTitle: approval.goalTitle, reviewerName: reviewer?.name ?? reviewerId });
    set({
      goals: goals.map((g) => g.id === approval.goalId ? { ...g, status: 'locked', approvedBy: reviewerId, approvedAt: new Date(), updatedAt: new Date() } : g),
      approvals: approvals.map((a) => a.id === approvalId ? { ...a, ...updatedApproval } : a),
      notifications: [...notifications, notif],
      auditLogs: [log, ...get().auditLogs],
    });
  },

  returnGoal: async (approvalId, reviewerId, comment) => {
    const { approvals, goals, notifications } = get();
    const approval = approvals.find((a) => a.id === approvalId);
    if (!approval) return;

    const updatedApproval: Partial<Approval> = {
      status: 'returned', comments: comment, reviewedBy: reviewerId, reviewedAt: new Date(),
      history: [...approval.history, { timestamp: new Date(), action: 'returned' as const, actor: reviewerId, comment }],
    };
    const notif: Notification = {
      id: `notif-${Date.now()}`, userId: approval.submittedBy,
      type: 'goal_returned', title: 'Goal Returned for Rework',
      message: `"${approval.goalTitle}" was returned: ${comment}`,
      relatedId: approval.goalId, read: false, createdAt: new Date(),
    };
    const log = auditEntry(reviewerId, 'return', 'approval', approvalId, { status: { before: 'pending', after: 'returned' } });

    if (USE_SUPABASE) {
      await Promise.all([
        db.updateGoal(approval.goalId, { status: 'returned' }),
        db.updateApproval(approvalId, updatedApproval),
        db.createNotification(notif),
        db.createAuditLog(log),
      ]);
    }
    // Teams: notify employee their goal was returned
    notifyTeams({ event: 'goal_returned', goalTitle: approval.goalTitle, comment });
    set({
      goals: goals.map((g) => g.id === approval.goalId ? { ...g, status: 'returned', updatedAt: new Date() } : g),
      approvals: approvals.map((a) => a.id === approvalId ? { ...a, ...updatedApproval } : a),
      notifications: [...notifications, notif],
      auditLogs: [log, ...get().auditLogs],
    });
  },

  rejectGoal: async (approvalId, reviewerId, comment) => {
    const { approvals, goals } = get();
    const approval = approvals.find((a) => a.id === approvalId);
    if (!approval) return;

    const updatedApproval: Partial<Approval> = {
      status: 'rejected', comments: comment, reviewedBy: reviewerId, reviewedAt: new Date(),
      history: [...approval.history, { timestamp: new Date(), action: 'rejected' as const, actor: reviewerId, comment }],
    };
    const log = auditEntry(reviewerId, 'reject', 'approval', approvalId);

    if (USE_SUPABASE) {
      await Promise.all([
        db.updateGoal(approval.goalId, { status: 'returned' }),
        db.updateApproval(approvalId, updatedApproval),
        db.createAuditLog(log),
      ]);
    }
    set({
      goals: goals.map((g) => g.id === approval.goalId ? { ...g, status: 'returned', updatedAt: new Date() } : g),
      approvals: approvals.map((a) => a.id === approvalId ? { ...a, ...updatedApproval } : a),
      auditLogs: [log, ...get().auditLogs],
    });
  },

  editApprovalGoal: async (approvalId, updates, actorId) => {
    const { approvals, goals } = get();
    const approval = approvals.find((a) => a.id === approvalId);
    if (!approval) return;
    const goal = goals.find((g) => g.id === approval.goalId);
    if (!goal) return;

    const changes: AuditLog['changes'] = {};
    if (updates.targetValue !== undefined && goal.targetValue !== updates.targetValue)
      changes['targetValue'] = { before: goal.targetValue, after: updates.targetValue };
    if (updates.weightage !== undefined && goal.weightage !== updates.weightage)
      changes['weightage'] = { before: goal.weightage, after: updates.weightage };

    if (USE_SUPABASE) await db.updateGoal(approval.goalId, updates);
    const log = auditEntry(actorId, 'inline-edit', 'goal', approval.goalId, changes);
    if (USE_SUPABASE) await db.createAuditLog(log);
    set((s) => ({
      goals: s.goals.map((g) => g.id === approval.goalId ? { ...g, ...updates, updatedAt: new Date() } : g),
      auditLogs: [log, ...s.auditLogs],
    }));
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  unlockGoal: async (goalId, actorId) => {
    if (USE_SUPABASE) await db.updateGoal(goalId, { status: 'draft' });
    const log = auditEntry(actorId, 'unlock', 'goal', goalId, { status: { before: 'locked', after: 'draft' } });
    if (USE_SUPABASE) await db.createAuditLog(log);
    set((s) => ({
      goals: s.goals.map((g) => g.id === goalId ? { ...g, status: 'draft', updatedAt: new Date() } : g),
      auditLogs: [log, ...s.auditLogs],
    }));
  },

  pushSharedGoal: async (baseGoal, recipientIds, actorId) => {
    const now = new Date();
    // Use a stable parentGoalId so achievement sync works across all copies
    const parentGoalId = `goal-shared-parent-${Date.now()}`;
    const newGoals: Goal[] = recipientIds.map((rid) => ({
      ...baseGoal,
      id: `goal-shared-${Date.now()}-${rid}`,
      ownerId: rid,
      isShared: true,
      sharedBy: actorId,
      parentGoalId,   // all copies share the same parentGoalId for sync
      createdAt: now,
      updatedAt: now,
    }));
    if (USE_SUPABASE) await Promise.all(newGoals.map((g) => db.createGoal(g)));
    const logs = newGoals.map((g) => auditEntry(actorId, 'push-shared-goal', 'goal', g.id));
    if (USE_SUPABASE) await Promise.all(logs.map(db.createAuditLog));
    set((s) => ({ goals: [...s.goals, ...newGoals], auditLogs: [...logs, ...s.auditLogs] }));
  },

  // ── Check-ins ──────────────────────────────────────────────────────────────

  addCheckin: async (checkin, actorId, performanceStatus) => {
    if (USE_SUPABASE) await db.createCheckin(checkin);
    // Update both currentValue AND performanceStatus atomically in one DB call
    if (USE_SUPABASE) await db.updateGoal(checkin.goalId, {
      currentValue: checkin.progressValue,
      performanceStatus,
    });
    const log = auditEntry(actorId, 'checkin', 'checkin', checkin.id);
    if (USE_SUPABASE) await db.createAuditLog(log);

    // BRD §2.1 — achievement updates by the primary owner sync across all linked shared goal copies
    const updatedGoal = get().goals.find((g) => g.id === checkin.goalId);
    const siblingIds = updatedGoal?.parentGoalId
      ? get().goals
          .filter((g) => g.parentGoalId === updatedGoal.parentGoalId && g.id !== checkin.goalId)
          .map((g) => g.id)
      : [];
    if (USE_SUPABASE) {
      await Promise.all(siblingIds.map((id) => db.updateGoal(id, { currentValue: checkin.progressValue, performanceStatus })));
    }

    set((s) => ({
      checkins: [...s.checkins, checkin],
      goals: s.goals.map((g) => {
        if (g.id === checkin.goalId) return { ...g, currentValue: checkin.progressValue, performanceStatus, updatedAt: new Date() };
        if (siblingIds.includes(g.id)) return { ...g, currentValue: checkin.progressValue, performanceStatus, updatedAt: new Date() };
        return g;
      }),
      auditLogs: [log, ...s.auditLogs],
    }));
    // Teams: notify manager that a check-in was submitted
    const checkinOwner = Object.values(get().users).find((u) => u.id === actorId);
    const checkinGoal = get().goals.find((g) => g.id === checkin.goalId);
    notifyTeams({
      event: 'checkin_submitted',
      employeeName: checkinOwner?.name ?? actorId,
      goalTitle: checkinGoal?.title ?? checkin.goalId,
      status: performanceStatus.replace(/_/g, ' '),
    });
  },

  addManagerComment: async (checkinId, comment, actorId) => {
    if (USE_SUPABASE) await db.updateCheckinComment(checkinId, comment);
    const log = auditEntry(actorId, 'manager-comment', 'checkin', checkinId);
    if (USE_SUPABASE) await db.createAuditLog(log);
    set((s) => ({
      checkins: s.checkins.map((c) => c.id === checkinId ? { ...c, managerComment: comment, commentedAt: new Date() } : c),
      auditLogs: [log, ...s.auditLogs],
    }));
  },

  // ── Notifications ──────────────────────────────────────────────────────────

  markNotificationRead: async (id) => {
    if (USE_SUPABASE) await db.markNotificationRead(id);
    set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) }));
  },

  markAllNotificationsRead: async (userId) => {
    if (USE_SUPABASE) await db.markAllNotificationsRead(userId);
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  },

  addNotification: async (n) => {
    if (USE_SUPABASE) await db.createNotification(n);
    set((s) => ({ notifications: [...s.notifications, n] }));
  },

  // ── Escalation ─────────────────────────────────────────────────────────────

  updateEscalationRule: async (id, updates) => {
    if (USE_SUPABASE) await db.updateEscalationRule(id, updates);
    set((s) => ({ escalationRules: s.escalationRules.map((r) => r.id === id ? { ...r, ...updates } : r) }));
  },

  addEscalationLog: async (log) => {
    if (USE_SUPABASE) await db.createEscalationLog(log);
    set((s) => ({ escalationLogs: [...s.escalationLogs, log] }));
  },

  resolveEscalation: async (id) => {
    if (USE_SUPABASE) await db.resolveEscalationLog(id);
    set((s) => ({ escalationLogs: s.escalationLogs.map((l) => l.id === id ? { ...l, resolvedAt: new Date() } : l) }));
  },
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectPendingApprovals = (s: AppState) =>
  s.approvals.filter((a) => a.status === 'pending');

export const selectUnreadNotifications = (s: AppState) =>
  s.notifications.filter((n) => !n.read);
