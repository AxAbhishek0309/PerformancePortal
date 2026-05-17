/**
 * Export an array of flat objects to a CSV file download.
 */
export function exportToCSV(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? '');
          // Wrap in quotes if value contains comma, newline, or quote
          return /[,"\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
        })
        .join(',')
    ),
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

import { Goal } from './types';
import { calculateProgress } from './goal-utils';

/**
 * Build an achievement report row per goal (BRD §4 — planned vs actual).
 */
export function buildAchievementReport(goals: Goal[]) {
  return goals.map((g) => ({
    'Goal ID': g.id,
    'Owner ID': g.ownerId,
    'Goal Title': g.title,
    'Thrust Area': g.thrustArea,
    'Unit of Measurement': g.unitOfMeasurement,
    'UoM Formula': g.uomType,
    'Planned Target': g.targetValue,
    'Actual Achievement': g.currentValue,
    'Progress Score (%)': calculateProgress(g),
    'Weightage (%)': g.weightage,
    'Performance Status': g.performanceStatus,
    'Workflow Status': g.status,
    'Deadline': g.deadline.toISOString().split('T')[0],
  }));
}
