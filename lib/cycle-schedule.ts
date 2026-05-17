/**
 * BRD §2.3 — Performance cycle windows (calendar year).
 * Goal setting opens 1 May; quarterly check-ins open in Jul, Oct, Jan, Mar–Apr.
 *
 * Set NEXT_PUBLIC_RELAX_CYCLE=true in .env.local to open all windows (demo only).
 */

const RELAX =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_RELAX_CYCLE === 'true';

export type CyclePhase =
  | 'goal_setting'
  | 'q1_checkin'
  | 'q2_checkin'
  | 'q3_checkin'
  | 'q4_annual'
  | 'closed';

export interface CycleWindow {
  phase: CyclePhase;
  label: string;
  /** Inclusive start (local date) */
  startMonth: number; // 1–12
  startDay: number;
  /** Inclusive end */
  endMonth: number;
  endDay: number;
}

/** Windows repeat every calendar year */
export const CYCLE_WINDOWS: CycleWindow[] = [
  {
    phase: 'goal_setting',
    label: 'Goal Setting',
    startMonth: 5,
    startDay: 1,
    endMonth: 6,
    endDay: 30,
  },
  {
    phase: 'q1_checkin',
    label: 'Q1 Check-in',
    startMonth: 7,
    startDay: 1,
    endMonth: 7,
    endDay: 31,
  },
  {
    phase: 'q2_checkin',
    label: 'Q2 Check-in',
    startMonth: 10,
    startDay: 1,
    endMonth: 10,
    endDay: 31,
  },
  {
    phase: 'q3_checkin',
    label: 'Q3 Check-in',
    startMonth: 1,
    startDay: 1,
    endMonth: 1,
    endDay: 31,
  },
  {
    phase: 'q4_annual',
    label: 'Q4 / Annual',
    startMonth: 3,
    startDay: 1,
    endMonth: 4,
    endDay: 30,
  },
];

function windowBounds(year: number, w: CycleWindow) {
  return {
    start: new Date(year, w.startMonth - 1, w.startDay, 0, 0, 0, 0),
    end: new Date(year, w.endMonth - 1, w.endDay, 23, 59, 59, 999),
  };
}

function isDateInWindow(date: Date, year: number, w: CycleWindow): boolean {
  const { start, end } = windowBounds(year, w);
  return date >= start && date <= end;
}

export function getActiveWindows(date: Date = new Date()): CycleWindow[] {
  if (RELAX) return CYCLE_WINDOWS;
  const year = date.getFullYear();
  return CYCLE_WINDOWS.filter((w) => isDateInWindow(date, year, w));
}

export function getCurrentPhase(date: Date = new Date()): CyclePhase | null {
  const active = getActiveWindows(date);
  return active.length > 0 ? active[0].phase : null;
}

export function isGoalSettingOpen(date: Date = new Date()): boolean {
  return getActiveWindows(date).some((w) => w.phase === 'goal_setting');
}

export function isCheckinOpen(date: Date = new Date()): boolean {
  return getActiveWindows(date).some((w) =>
    ['q1_checkin', 'q2_checkin', 'q3_checkin', 'q4_annual'].includes(w.phase)
  );
}

export function getOpenCheckinPhases(date: Date = new Date()): CyclePhase[] {
  return getActiveWindows(date)
    .map((w) => w.phase)
    .filter((p): p is 'q1_checkin' | 'q2_checkin' | 'q3_checkin' | 'q4_annual' =>
      p === 'q1_checkin' || p === 'q2_checkin' || p === 'q3_checkin' || p === 'q4_annual'
    );
}

/** Map open check-in phase → quarter label for the check-in form */
export function getDefaultCheckinQuarter(date: Date = new Date()): string | null {
  const year = date.getFullYear();
  const phases = getOpenCheckinPhases(date);
  if (phases.includes('q1_checkin')) return `Q1 ${year}`;
  if (phases.includes('q2_checkin')) return `Q2 ${year}`;
  if (phases.includes('q3_checkin')) return `Q3 ${year}`;
  if (phases.includes('q4_annual')) return `Q4 ${year}`;
  return null;
}

export function getScheduleStatusMessage(date: Date = new Date()): string {
  const active = getActiveWindows(date);
  if (active.length === 0) {
    return 'No active performance window. Goal setting opens 1 May; check-ins open in Jul, Oct, Jan, and Mar–Apr.';
  }
  return `Active: ${active.map((w) => w.label).join(', ')}`;
}
