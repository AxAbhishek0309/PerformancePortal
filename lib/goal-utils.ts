import { Goal, PerformanceStatus, UomType } from './types';
import { toDate } from './utils';

// ─── BRD §2.2 Progress Score Formulas ────────────────────────────────────────
//
// Exact formulas from the problem statement:
//
//  Min  (Higher is better, e.g. Revenue)  → Achievement ÷ Target × 100
//  Max  (Lower is better, e.g. TAT, Cost) → Target ÷ Achievement × 100
//  Timeline (Date-based completion)       → if complete: 100%
//                                           if before deadline: (elapsed / total) × 100
//                                           if past deadline & incomplete: 0%
//  Zero (Zero = Success, e.g. incidents)  → If 0 → 100%, else 0%
//
// All scores are capped at 100 and floored at 0.

/**
 * Compute a 0–100 progress score for a single goal using the BRD §2.2 formula.
 */
export const calculateProgress = (goal: Goal): number => {
  const { uomType, currentValue, targetValue, deadline, createdAt } = goal;
  let raw = 0;

  switch (uomType) {
    // ── Min: higher achievement is better ─────────────────────────────────
    case 'min':
      raw = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
      break;

    // ── Max: lower achievement is better (e.g. cost, TAT) ─────────────────
    case 'max':
      if (currentValue <= 0) {
        // Nothing achieved yet — if target is also 0 that's perfect, otherwise 0%
        raw = targetValue === 0 ? 100 : 0;
      } else {
        raw = (targetValue / currentValue) * 100;
      }
      break;

    // ── Timeline: date-based completion ────────────────────────────────────
    // BRD: "Completion date vs. Deadline"
    // Interpretation: score reflects how much of the work is done relative to
    // how much time has elapsed. If the employee finishes before the deadline → 100%.
    // If the deadline has passed without completion → 0%.
    case 'timeline': {
      const deadlineDate = toDate(deadline);
      const createdDate  = toDate(createdAt);
      const now          = Date.now();

      // Treat currentValue as % complete (0–100) when targetValue = 100,
      // or as raw progress otherwise — normalise to a 0–100 completion %.
      const completionPct = targetValue > 0
        ? Math.min((currentValue / targetValue) * 100, 100)
        : 0;

      // Already fully complete → 100% regardless of date
      if (completionPct >= 100) { raw = 100; break; }

      // Past deadline and not complete → 0%
      if (now > deadlineDate.getTime()) { raw = 0; break; }

      // Within window: score = completion % (work done so far)
      // This matches "Completion date vs. Deadline" — we reward actual work done,
      // not just time remaining.
      raw = completionPct;
      break;
    }

    // ── Zero: zero = success ───────────────────────────────────────────────
    case 'zero':
      raw = currentValue === 0 ? 100 : 0;
      break;

    default:
      raw = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
  }

  return Math.min(Math.max(Math.round(raw), 0), 100);
};

/**
 * BRD §2.2 — Weighted overall score for an employee across all their goals.
 *
 *   Overall Score = Σ ( goalWeightage% × goalProgressScore% )
 *
 * Returns a 0–100 value representing the employee's composite performance score.
 */
export const calculateWeightedScore = (goals: Goal[]): number => {
  if (goals.length === 0) return 0;
  const score = goals.reduce(
    (sum, g) => sum + (g.weightage / 100) * calculateProgress(g),
    0
  );
  return Math.min(Math.max(Math.round(score), 0), 100);
};

/**
 * Calculate progress score for a check-in entry using the correct BRD formula
 * for the goal's UoM type. Used in quarterly trend calculations.
 */
export const calculateCheckinProgress = (
  progressValue: number,
  goal: Goal
): number => {
  // Temporarily substitute currentValue with the check-in's progressValue
  const synthetic: Goal = { ...goal, currentValue: progressValue };
  return calculateProgress(synthetic);
};

// ─── Performance Status ───────────────────────────────────────────────────────

export const PERFORMANCE_STATUS_CONFIG: Record<
  PerformanceStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  not_started: {
    label: 'Not Started',
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    dot: 'bg-gray-400',
  },
  on_track: {
    label: 'On Track',
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
  },
};

/**
 * A goal is completed only when the employee explicitly marks it as 'completed'.
 * The calculated progress score (BRD §2.2) is for tracking only — it does NOT
 * determine completion status. The employee's performanceStatus is the source of truth.
 */
export const isGoalCompleted = (goal: Goal): boolean =>
  goal.performanceStatus === 'completed';

/** Goals approved and locked are eligible for quarterly check-ins */
export const isGoalActiveForCheckin = (goal: Goal): boolean =>
  goal.status === 'locked' || goal.status === 'approved';

export const canEditGoal = (goal: Goal, userId: string): boolean =>
  goal.ownerId === userId && (goal.status === 'draft' || goal.status === 'returned');

/** Shared goals: recipients may only change weightage */
export const canEditSharedGoalWeightage = (goal: Goal, userId: string): boolean =>
  Boolean(goal.isShared && goal.ownerId === userId && isGoalActiveForCheckin(goal));

// ─── UoM type helpers ─────────────────────────────────────────────────────────

export const UOM_TYPE_LABELS: Record<UomType, string> = {
  min: 'Min — Higher is better (e.g. Revenue, Sales)',
  max: 'Max — Lower is better (e.g. TAT, Cost)',
  timeline: 'Timeline — Date-based completion',
  zero: 'Zero — Zero = Success (e.g. Incidents)',
};

/** Infer a sensible default UomType from the unit string */
export const inferUomType = (unit: string): UomType => {
  const u = unit.toLowerCase();
  if (u.includes('timeline') || u.includes('date') || u.includes('days')) return 'timeline';
  if (u.includes('zero') || u.includes('incident') || u.includes('defect')) return 'zero';
  if (u.includes('cost') || u.includes('tat') || u.includes('hours') || u.includes('time'))
    return 'max';
  return 'min';
};

// ─── Workflow status helpers ──────────────────────────────────────────────────

export const getStatusConfig = (status: Goal['status']) => {
  const configs = {
    draft:     { bg: 'bg-gray-100 dark:bg-gray-800',   text: 'text-gray-800 dark:text-gray-200' },
    submitted: { bg: 'bg-blue-100 dark:bg-blue-900',   text: 'text-blue-800 dark:text-blue-200' },
    returned:  { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-200' },
    approved:  { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' },
    locked:    { bg: 'bg-slate-100 dark:bg-slate-900', text: 'text-slate-800 dark:text-slate-200' },
  };
  return configs[status];
};

// ─── Filtering & Aggregation ──────────────────────────────────────────────────

export const filterGoals = (
  goals: Goal[],
  options: { status?: Goal['status']; thrustArea?: string; ownerId?: string }
): Goal[] =>
  goals.filter((g) => {
    if (options.status    && g.status    !== options.status)    return false;
    if (options.thrustArea && g.thrustArea !== options.thrustArea) return false;
    if (options.ownerId   && g.ownerId   !== options.ownerId)   return false;
    return true;
  });

export const calculateMetrics = (goals: Goal[]) => {
  const total          = goals.length;
  const completed      = goals.filter(isGoalCompleted).length;
  const notStarted     = goals.filter((g) => g.performanceStatus === 'not_started').length;
  const onTrack        = goals.filter((g) => g.performanceStatus === 'on_track').length;
  const avgProgress    = total > 0
    ? Math.round(goals.reduce((sum, g) => sum + calculateProgress(g), 0) / total)
    : 0;
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const weightedScore  = calculateWeightedScore(goals);

  return { total, completed, notStarted, onTrack, avgProgress, totalWeightage, completionRate, weightedScore };
};

/**
 * Build live quarterly trend data from actual goals + check-ins.
 * Uses BRD-correct per-goal formula via calculateCheckinProgress.
 */
export const buildQuarterlyTrends = (
  goals: Goal[],
  checkins: import('./types').CheckIn[]
) => {
  const quarters = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026'];
  return quarters.map((q) => {
    const qCheckins = checkins.filter((c) => c.period === q);
    const qGoals    = goals.filter((g) => g.status === 'approved' || g.status === 'locked');

    const completedInQ = qCheckins.filter((c) => {
      const g = goals.find((g) => g.id === c.goalId);
      return g && calculateCheckinProgress(c.progressValue, g) >= 100;
    }).length;

    const completionRate = qCheckins.length > 0
      ? Math.round((completedInQ / qCheckins.length) * 100)
      : 0;

    const avgProgress = qCheckins.length > 0
      ? Math.round(
          qCheckins.reduce((sum, c) => {
            const g = goals.find((g) => g.id === c.goalId);
            return sum + (g ? calculateCheckinProgress(c.progressValue, g) : 0);
          }, 0) / qCheckins.length
        )
      : 0;

    return {
      quarter: q,
      completionRate,
      avgProgress,
      goalsSubmitted: qGoals.length,
    };
  });
};

/**
 * Build live department metrics from actual goals.
 */
export const buildDepartmentMetrics = (
  goals: Goal[],
  users: Record<string, import('./types').User>
) => {
  const deptMap: Record<string, { employees: Set<string>; goals: Goal[] }> = {};

  goals.forEach((g) => {
    const user = Object.values(users).find((u) => u.id === g.ownerId);
    const dept = user?.department ?? 'Unknown';
    if (!deptMap[dept]) deptMap[dept] = { employees: new Set(), goals: [] };
    deptMap[dept].employees.add(g.ownerId);
    deptMap[dept].goals.push(g);
  });

  return Object.entries(deptMap).map(([department, { employees, goals: dGoals }]) => {
    const completed      = dGoals.filter(isGoalCompleted).length;
    const completionRate = dGoals.length > 0 ? Math.round((completed / dGoals.length) * 100) : 0;
    const avgWeightage   = dGoals.length > 0
      ? Math.round(dGoals.reduce((s, g) => s + g.weightage, 0) / dGoals.length)
      : 0;
    return {
      department,
      completionRate,
      avgWeightage,
      activeGoals: dGoals.length,
      employees: employees.size,
    };
  });
};
