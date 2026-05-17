import { AppState } from './store';
import { EscalationLog, Notification } from './types';
import { isCheckinOpen, isGoalSettingOpen } from './cycle-schedule';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / DAY_MS);
}

function logExists(
  logs: EscalationLog[],
  trigger: EscalationLog['trigger'],
  targetUserId: string
): boolean {
  const weekAgo = Date.now() - 7 * DAY_MS;
  return logs.some(
    (l) =>
      l.trigger === trigger &&
      l.targetUserId === targetUserId &&
      !l.resolvedAt &&
      l.createdAt.getTime() > weekAgo
  );
}

/**
 * BRD §5.3 — evaluate escalation rules and create logs + in-app notifications.
 * Call on app load and after major state changes.
 */
export function runEscalationChecks(state: AppState): Partial<AppState> | null {
  const newLogs: EscalationLog[] = [];
  const newNotifs: Notification[] = [];
  const { goals, approvals, checkins, users, escalationRules, escalationLogs } = state;

  const activeRules = escalationRules.filter((r) => r.active);

  for (const rule of activeRules) {
    if (rule.trigger === 'goal_not_submitted' && isGoalSettingOpen()) {
      Object.values(users)
        .filter((u) => u.role === 'employee')
        .forEach((emp) => {
          const empGoals = goals.filter((g) => g.ownerId === emp.id);
          const hasDraft = empGoals.some((g) => g.status === 'draft');
          const hasSubmitted = empGoals.some(
            (g) => g.status === 'submitted' || g.status === 'locked' || g.status === 'approved'
          );
          if (empGoals.length === 0 || hasSubmitted || !hasDraft) return;
          const oldest = empGoals.reduce((min, g) => (g.createdAt < min ? g.createdAt : min), empGoals[0].createdAt);
          if (daysSince(oldest) < rule.thresholdDays) return;
          if (logExists(escalationLogs, 'goal_not_submitted', emp.id)) return;

          const escalatedTo = rule.notifyRoles.map((r) => `role:${r}`);
          newLogs.push({
            id: `esc-${Date.now()}-${emp.id}`,
            ruleId: rule.id,
            trigger: 'goal_not_submitted',
            targetUserId: emp.id,
            escalatedTo,
            message: `${emp.name} has not submitted goals within ${rule.thresholdDays} days of cycle open.`,
            createdAt: new Date(),
          });
          notifyRoles(newNotifs, rule.notifyRoles, users, {
            title: 'Goal submission overdue',
            message: `${emp.name} has not submitted their goal sheet.`,
            relatedId: emp.id,
          });
        });
    }

    if (rule.trigger === 'goal_not_approved') {
      approvals
        .filter((a) => a.status === 'pending')
        .forEach((a) => {
          if (daysSince(a.submittedAt) < rule.thresholdDays) return;
          const submitter = Object.values(users).find((u) => u.id === a.submittedBy);
          if (!submitter) return;
          if (logExists(escalationLogs, 'goal_not_approved', submitter.id)) return;

          newLogs.push({
            id: `esc-${Date.now()}-${a.id}`,
            ruleId: rule.id,
            trigger: 'goal_not_approved',
            targetUserId: submitter.id,
            escalatedTo: rule.notifyRoles.map((r) => `role:${r}`),
            message: `Goal "${a.goalTitle}" pending approval for ${daysSince(a.submittedAt)} days.`,
            createdAt: new Date(),
          });
          notifyRoles(newNotifs, rule.notifyRoles, users, {
            title: 'Approval overdue',
            message: `"${a.goalTitle}" awaits manager approval.`,
            relatedId: a.goalId,
          });
        });
    }

    if (rule.trigger === 'checkin_not_completed' && isCheckinOpen()) {
      const locked = goals.filter((g) => g.status === 'locked' || g.status === 'approved');
      const ownerIds = [...new Set(locked.map((g) => g.ownerId))];
      ownerIds.forEach((ownerId) => {
        const ownerGoals = locked.filter((g) => g.ownerId === ownerId);
        const ownerCheckins = checkins.filter((c) => c.ownerId === ownerId);
        const allDone = ownerGoals.every((g) => ownerCheckins.some((c) => c.goalId === g.id));
        if (allDone) return;
        if (logExists(escalationLogs, 'checkin_not_completed', ownerId)) return;

        const user = Object.values(users).find((u) => u.id === ownerId);
        newLogs.push({
          id: `esc-${Date.now()}-${ownerId}`,
          ruleId: rule.id,
          trigger: 'checkin_not_completed',
          targetUserId: ownerId,
          escalatedTo: rule.notifyRoles.map((r) => `role:${r}`),
          message: `${user?.name ?? ownerId} has incomplete check-ins during the active window.`,
          createdAt: new Date(),
        });
        notifyRoles(newNotifs, rule.notifyRoles, users, {
          title: 'Check-in reminder',
          message: `${user?.name ?? 'Employee'} has pending quarterly check-ins.`,
          relatedId: ownerId,
        });
      });
    }
  }

  if (newLogs.length === 0 && newNotifs.length === 0) return null;
  return {
    escalationLogs: [...escalationLogs, ...newLogs],
    notifications: [...state.notifications, ...newNotifs],
  };
}

function notifyRoles(
  out: Notification[],
  roles: Array<'employee' | 'manager' | 'admin'>,
  users: Record<string, import('./types').User>,
  payload: { title: string; message: string; relatedId?: string }
) {
  Object.values(users)
    .filter((u) => roles.includes(u.role))
    .forEach((u) => {
      out.push({
        id: `notif-esc-${Date.now()}-${u.id}-${Math.random().toString(36).slice(2, 5)}`,
        userId: u.id,
        type: 'checkin_requested',
        title: payload.title,
        message: payload.message,
        relatedId: payload.relatedId,
        read: false,
        createdAt: new Date(),
      });
    });
}
