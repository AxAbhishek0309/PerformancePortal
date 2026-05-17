import {
  Goal, Approval, CheckIn, AuditLog, Notification,
  DepartmentMetrics, QuarterlyTrend, EscalationRule, EscalationLog,
} from './types';

// ─── Demo Goals ───────────────────────────────────────────────────────────────
//
// 2 demo goals owned by emp-001 (Alex Johnson).
// Weightages intentionally set to 50% + 30% = 80% so the employee has 20%
// remaining to create a new goal and experience the full submit → approve flow.
//
// Goal 1 — "locked" (approved & active): 50%, progress ~70%
// Goal 2 — "draft" (editable, deletable):  30%, progress 0%

export const MOCK_GOALS: Goal[] = [
  {
    id: 'goal-demo-1',
    ownerId: 'emp-001',
    title: 'Grow Q2 Product Revenue to $500k',
    description:
      'Drive new product line sales through targeted outreach and upsell campaigns. ' +
      'Focus on enterprise accounts in the APAC region.',
    thrustArea: 'Revenue Growth',
    unitOfMeasurement: 'Amount ($)',
    uomType: 'min',
    targetValue: 500000,
    currentValue: 348000,   // 69.6% → 70%
    weightage: 50,
    deadline: new Date('2026-09-30'),
    status: 'locked',
    performanceStatus: 'on_track',
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-05-10'),
    approvedBy: 'mgr-001',
    approvedAt: new Date('2026-04-06'),
  },
  {
    id: 'goal-demo-2',
    ownerId: 'emp-001',
    title: 'Reduce Operational Costs by $50k',
    description:
      'Identify and eliminate redundant SaaS subscriptions, renegotiate vendor contracts, ' +
      'and automate manual reporting workflows to cut operational overhead.',
    thrustArea: 'Cost Optimization',
    unitOfMeasurement: 'Amount ($)',
    uomType: 'min',
    targetValue: 50000,
    currentValue: 0,
    weightage: 30,
    deadline: new Date('2026-09-30'),
    status: 'draft',
    performanceStatus: 'not_started',
    createdAt: new Date('2026-05-17'),
    updatedAt: new Date('2026-05-17'),
  },
];

export const MOCK_GOALS_EXTENDED = MOCK_GOALS;

// ─── Approvals ────────────────────────────────────────────────────────────────

export const MOCK_APPROVALS: Approval[] = [];

// ─── Check-ins ────────────────────────────────────────────────────────────────

export const MOCK_CHECKINS: CheckIn[] = [
  {
    id: 'checkin-demo-1',
    goalId: 'goal-demo-1',
    ownerId: 'emp-001',
    period: 'Q1 2026',
    progressValue: 210000,
    notes:
      'Closed 3 enterprise deals in APAC. Pipeline for Q2 looks strong — ' +
      '2 deals at final negotiation stage worth ~$138k combined.',
    submittedAt: new Date('2026-04-07'),
    managerComment:
      'Solid start. Keep the APAC momentum going and loop in pre-sales for the two pending deals.',
    commentedAt: new Date('2026-04-09'),
  },
];

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const MOCK_AUDIT_LOGS: AuditLog[] = [];

// ─── Notifications ────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-demo-1',
    userId: 'emp-001',
    type: 'goal_approved',
    title: 'Goal Approved',
    message: '"Grow Q2 Product Revenue to $500k" has been approved by Sarah Chen.',
    relatedId: 'goal-demo-1',
    read: false,
    createdAt: new Date('2026-04-06'),
  },
  {
    id: 'notif-demo-2',
    userId: 'mgr-001',
    type: 'checkin_requested',
    title: 'Q2 2026 Check-ins Open',
    message: 'The Q2 2026 check-in window is now open. Review your team\'s updates.',
    read: false,
    createdAt: new Date('2026-05-15'),
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
  { quarter: 'Q3 2025', completionRate: 62, avgProgress: 55, goalsSubmitted: 11 },
  { quarter: 'Q4 2025', completionRate: 70, avgProgress: 64, goalsSubmitted: 14 },
  { quarter: 'Q1 2026', completionRate: 78, avgProgress: 71, goalsSubmitted: 16 },
  { quarter: 'Q2 2026', completionRate: 0,  avgProgress: 0,  goalsSubmitted: 0  },
];
