import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

/** Coerce persisted ISO strings back to Date (Zustand localStorage persist). */
export function toDate(value: Date | string | number | null | undefined): Date {
  if (value == null) return new Date(NaN);
  if (value instanceof Date) return value;
  const d = new Date(value);
  return d;
}

export function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

/**
 * Format a date consistently on both server and client to avoid hydration mismatches.
 * Uses a fixed locale ('en-GB') and explicit options so the output is always identical.
 * Example output: "20 Jan 2024"
 */
export function formatDate(date: Date | string | number): string {
  const d = toDate(date);
  if (!isValidDate(d)) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** JSON.parse reviver — restores ISO date strings after localStorage hydration */
export function reviveDates(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
    return new Date(value);
  }
  return value;
}
