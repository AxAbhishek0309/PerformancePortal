import {
  Goal, Approval, CheckIn, AuditLog, Notification,
  DepartmentMetrics, QuarterlyTrend, EscalationRule, EscalationLog,
} from './types';

// ─── Default shared goal ──────────────────────────────────────────────────────
//
// One shared goal pushed by manager (mgr-001) to employee (emp-001).
//
// Status: 'locked' — already approved, active for check-ins.
// This is the employee's pending task: submit a quarterly check-in.
//
// isShared: true — employee can only adjust weightage, title/target are read-only.
// weightage: 100 — employee's full allocation is on this goal.
//
// This is the ONLY default goal. Employee can create their own additional goals
// (bottom-up flow: draft → submit → manager approves → locked).
// Admin can delete this goal from the Team Goals page.

const SHARED_GOAL: Goal = {
  id: 'goal-shared-demo',
  ownerId: 'emp-001',
  title: 'Achieve 95% Customer Satisfaction Score',
  description:
    'Maintain a CSAT score of 95% or above across all customer touchpoints ' +
    'by resolving tickets within SLA and proactively following up on escalations.',
  thrustArea: 'Customer Success',
  unitOfMeasurement: 'Percentage (%)',
  uomType: 'min',
  targetValue: 95,
  currentValue: 0,
  weightage: 50,
  deadline: new Date('2026-12-31'),
  status: 'locked',
  performanceStatus: 'not_started',
  isShared: true,
  sharedBy: 'mgr-001',
  parentGoalId: 'goal-shared-demo',
  createdAt: new Date('2026-05-01'),
  updatedAt: new Date('2026-05-01'),
  approvedBy: 'mgr-001',
  approvedAt: new Date('2026-05-01'),
};

export const MOCK_GOALS: Goal[] = [SHARED_GOAL];
export const MOCK_GOALS_EXTENDED = MOCK_GOALS;

// ─── Approvals ────────────────────────────────────────────────────────────────
// No pending approvals by default — shared goals skip the approval queue.

export const MOCK_APPROVALS: Approval[] = [];

// ─── Check-ins ────────────────────────────────────────────────────────────────
// No check-ins yet — employee's pending task is to submit one.

export const MOCK_CHECKINS: CheckIn[] = [];

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const MOCK_AUDIT_LOGS: AuditLog[] = [];

// ─── Notifications ────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-shared-1',
    userId: 'emp-001',
    type: 'goal_approved',
    title: 'Shared Goal Assigned',
    message:
      'Sarah Chen assigned you a shared goal: "Achieve 95% Customer Satisfaction Score". ' +
      'You can adjust the weightage. Submit a check-in when the window opens.',
    relatedId: 'goal-shared-demo',
    read: false,
    createdAt: new Date('2026-05-01'),
  },
  {
    id: 'notif-mgr-1',
    userId: 'mgr-001',
    type: 'checkin_requested',
    title: 'Shared Goal Pushed',
    message:
      '"Achieve 95% Customer Satisfaction Score" has been pushed to Alex Johnson. ' +
      'Awaiting their first check-in.',
    relatedId: 'goal-shared-demo',
    read: false,
    createdAt: new Date('2026-05-01'),
  },
];

// ─── Escalation Rules ─────────────────────────────────────────────────────────

export const MOCK_ESCALATION_RULES: EscalationRule[] = [
  { id: 'rule-001', trigger: 'goal_not_submitted',    thresholdDays: 7,  notifyRoles: ['manager', 'admin'], active: true },
  { id: 'rule-002', trigger: 'goal_not_approved',     thresholdDays: 5,  notifyRoles: ['manager', 'admin'], active: true },
  { id: 'rule-003', trigger: 'checkin_not_completed', thresholdDays: 10, notifyRoles: ['manager', 'admin'], active: true },
];

export const MOCK_ESCALATION_LOGS: EscalationLog[] = [];

// ─── Static reference data ────────────────────────────────────────────────────

export const MOCK_DEPARTMENT_METRICS: DepartmentMetrics[] = [
  { department: 'Engineering', completionRate: 0, avgWeightage: 50, activeGoals: 1, employees: 1 },
];

export const MOCK_QUARTERLY_TRENDS: QuarterlyTrend[] = [
  { quarter: 'Q3 2025', completionRate: 0, avgProgress: 0, goalsSubmitted: 0 },
  { quarter: 'Q4 2025', completionRate: 0, avgProgress: 0, goalsSubmitted: 0 },
  { quarter: 'Q1 2026', completionRate: 0, avgProgress: 0, goalsSubmitted: 0 },
  { quarter: 'Q2 2026', completionRate: 0, avgProgress: 0, goalsSubmitted: 0 },
];
