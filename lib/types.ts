// User and Authentication Types
export type UserRole = 'employee' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  managerId?: string;
}

// Goal Types
export type GoalStatus = 'draft' | 'submitted' | 'returned' | 'approved' | 'locked';
export type ThrustArea =
  | 'Revenue Growth'
  | 'Cost Optimization'
  | 'Customer Success'
  | 'Innovation'
  | 'Operational Excellence';

/**
 * BRD §2.2 — UoM formula type
 * min  = higher is better  → score = achievement / target
 * max  = lower is better   → score = target / achievement
 * timeline = date-based    → score based on completion vs deadline
 * zero = zero = success    → score = 100% if 0, else 0%
 */
export type UomType = 'min' | 'max' | 'timeline' | 'zero';

/**
 * BRD §2.2 — per-goal performance status (separate from workflow status)
 */
export type PerformanceStatus = 'not_started' | 'on_track' | 'completed';

export interface Goal {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  thrustArea: ThrustArea;
  unitOfMeasurement: string;
  /** Which BRD formula to use for progress scoring */
  uomType: UomType;
  targetValue: number;
  currentValue: number;
  weightage: number;
  deadline: Date;
  status: GoalStatus;
  /** Employee-set performance status */
  performanceStatus: PerformanceStatus;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  /** Shared goals — pushed by admin/manager */
  isShared?: boolean;
  sharedBy?: string;
  parentGoalId?: string;
}

// Approval Types
export type ApprovalStatus = 'pending' | 'approved' | 'returned' | 'rejected';

export interface Approval {
  id: string;
  goalId: string;
  goalTitle: string;
  goalDescription: string;
  submittedBy: string;
  submittedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  status: ApprovalStatus;
  comments: string;
  history: ApprovalHistoryEntry[];
}

export interface ApprovalHistoryEntry {
  timestamp: Date;
  action: 'submitted' | 'approved' | 'returned' | 'rejected';
  actor: string;
  comment?: string;
}

// Check-in Types
export interface CheckIn {
  id: string;
  goalId: string;
  ownerId: string;
  period: string; // e.g., "Q1 2024"
  progressValue: number;
  notes: string;
  submittedAt: Date;
  managerComment?: string;
  commentedAt?: Date;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: 'goal' | 'approval' | 'checkin' | 'user';
  resourceId: string;
  changes?: Record<string, { before: any; after: any }>;
  timestamp: Date;
  /** BRD §4 — changes to goals after they were locked */
  afterLock?: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type:
    | 'approval_needed'
    | 'goal_approved'
    | 'goal_returned'
    | 'checkin_requested'
    | 'comment_added';
  title: string;
  message: string;
  relatedId?: string;
  read: boolean;
  createdAt: Date;
}

// Escalation Types (Bonus §5.3)
export type EscalationTrigger =
  | 'goal_not_submitted'
  | 'goal_not_approved'
  | 'checkin_not_completed';

export interface EscalationRule {
  id: string;
  trigger: EscalationTrigger;
  thresholdDays: number;
  notifyRoles: UserRole[];
  active: boolean;
}

export interface EscalationLog {
  id: string;
  ruleId: string;
  trigger: EscalationTrigger;
  targetUserId: string;
  escalatedTo: string[];
  message: string;
  resolvedAt?: Date;
  createdAt: Date;
}

// Dashboard Summary Types
export interface GoalSummary {
  total: number;
  completed: number;
  inProgress: number;
  atRisk: number;
  notStarted: number;
}

export interface DepartmentMetrics {
  department: string;
  completionRate: number;
  avgWeightage: number;
  activeGoals: number;
  employees: number;
}

export interface QuarterlyTrend {
  quarter: string;
  completionRate: number;
  avgProgress: number;
  goalsSubmitted: number;
}
