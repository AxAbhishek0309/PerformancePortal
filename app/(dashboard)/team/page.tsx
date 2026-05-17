'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { GoalForm } from '@/components/goals/goal-form';
import { calculateProgress, PERFORMANCE_STATUS_CONFIG } from '@/lib/goal-utils';

export default function TeamPage() {
  const router = useRouter();
  const { goals, users } = useStore();
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>();

  const employees = Object.values(users).filter((u) => u.role === 'employee');

  const teamMembers = employees.map((user) => {
    const memberGoals = goals.filter((g) => g.ownerId === user.id);
    const lockedGoals = memberGoals.filter((g) => g.status === 'locked' || g.status === 'approved');
    const completedGoals = memberGoals.filter((g) => g.performanceStatus === 'completed').length;
    const avgProgress = lockedGoals.length
      ? Math.round(lockedGoals.reduce((sum, g) => sum + calculateProgress(g), 0) / lockedGoals.length)
      : 0;
    const totalWeightage = memberGoals.reduce((sum, g) => sum + g.weightage, 0);
    const statusCounts = {
      not_started: memberGoals.filter((g) => g.performanceStatus === 'not_started').length,
      on_track: memberGoals.filter((g) => g.performanceStatus === 'on_track').length,
      completed: memberGoals.filter((g) => g.performanceStatus === 'completed').length,
    };
    return { user, goals: memberGoals, lockedGoals, completedGoals, avgProgress, totalWeightage, statusCounts };
  });

  /** BRD §2.2 — planned vs actual for manager check-ins */
  const comparisonRows = useMemo(() => {
    return employees.flatMap((user) => {
      const memberGoals = goals.filter(
        (g) =>
          g.ownerId === user.id &&
          (g.status === 'locked' || g.status === 'approved')
      );
      return memberGoals.map((g) => ({
        employee: user.name,
        department: user.department ?? '—',
        goal: g.title,
        thrustArea: g.thrustArea,
        planned: g.targetValue,
        actual: g.currentValue,
        unit: g.unitOfMeasurement,
        progress: calculateProgress(g),
        status: g.performanceStatus,
      }));
    });
  }, [goals, employees]);

  const handleCreateGoalForEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setGoalFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground mt-1">{teamMembers.length} team members</p>
        </div>
      </div>

      {/* BRD §2.2 — Planned vs Actual */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Planned vs Actual Achievement</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Compare targets and current achievement for all approved goals (manager check-in view).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 font-semibold">Employee</th>
                <th className="text-left py-3 px-3 font-semibold">Goal</th>
                <th className="text-right py-3 px-3 font-semibold">Planned</th>
                <th className="text-right py-3 px-3 font-semibold">Actual</th>
                <th className="text-right py-3 px-3 font-semibold">Score</th>
                <th className="text-left py-3 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No approved goals to compare yet.
                  </td>
                </tr>
              ) : (
                comparisonRows.map((row, i) => {
                  const cfg = PERFORMANCE_STATUS_CONFIG[row.status];
                  return (
                    <tr key={i} className="border-b border-border hover:bg-muted/40">
                      <td className="py-3 px-3">
                        <p className="font-medium">{row.employee}</p>
                        <p className="text-xs text-muted-foreground">{row.department}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium">{row.goal}</p>
                        <p className="text-xs text-muted-foreground">{row.thrustArea}</p>
                      </td>
                      <td className="py-3 px-3 text-right">{row.planned} {row.unit}</td>
                      <td className="py-3 px-3 text-right font-semibold">{row.actual} {row.unit}</td>
                      <td className="py-3 px-3 text-right">{row.progress}%</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map(({ user, goals: memberGoals, avgProgress, totalWeightage, statusCounts }) => (
          <Card key={user.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-lg font-semibold flex-shrink-0">
                {user.avatar ?? user.name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.department}</p>
              </div>
            </div>

            <div className="space-y-2 py-4 border-y border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Goals</span>
                <span className="font-semibold">{memberGoals.length} / 8</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Weightage</span>
                <span className={`font-semibold ${totalWeightage === 100 ? 'text-green-600' : ''}`}>
                  {totalWeightage}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg Progress</span>
                <span className="font-semibold">{avgProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-1">
                <div
                  className={`h-2 rounded-full ${avgProgress >= 80 ? 'bg-green-500' : avgProgress >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                  style={{ width: `${avgProgress}%` }}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap pt-1">
                {(['not_started', 'on_track', 'completed'] as const).map((s) => {
                  const cfg = PERFORMANCE_STATUS_CONFIG[s];
                  const count = statusCounts[s];
                  if (count === 0) return null;
                  return (
                    <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                      {count} {cfg.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button variant="outline" className="w-full gap-2" onClick={() => router.push('/goals')}>
                <Target className="w-3.5 h-3.5" />
                View Goals ({memberGoals.length})
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => handleCreateGoalForEmployee(user.id)}>
                <Plus className="w-3.5 h-3.5" />
                Create Goal
              </Button>
              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground"
                onClick={() => toast.success(`Feedback request sent to ${user.name}`)}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Send Feedback Request
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <GoalForm
        open={goalFormOpen}
        onClose={() => { setGoalFormOpen(false); setSelectedEmployeeId(undefined); }}
        targetEmployeeId={selectedEmployeeId}
      />
    </div>
  );
}
