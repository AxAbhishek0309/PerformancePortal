'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { GoalForm } from '@/components/goals/goal-form';
import { calculateProgress } from '@/lib/goal-utils';
import { toast } from 'sonner';
import { Unlock } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  returned: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  locked: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
};

const STATUS_FILTERS = ['all', 'draft', 'submitted', 'approved', 'returned', 'locked'] as const;

export default function GoalsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { goals, unlockGoal } = useStore();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>('all');
  const [goalFormOpen, setGoalFormOpen] = useState(false);

  const filtered = goals.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase()) ||
      g.thrustArea.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Goals</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} goals</p>
        </div>
        <Button className="gap-2" onClick={() => setGoalFormOpen(true)}>
          <Plus className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      {/* Search + status filter */}
      <Card className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, description, or thrust area..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize"
            >
              {s === 'all' ? `All (${goals.length})` : `${s} (${goals.filter((g) => g.status === s).length})`}
            </Button>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Goal</th>
                <th className="text-left py-3 px-4 font-semibold">Owner</th>
                <th className="text-left py-3 px-4 font-semibold">Area</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-right py-3 px-4 font-semibold">Progress</th>
                <th className="text-right py-3 px-4 font-semibold">Weight</th>
                <th className="text-right py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No goals match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((goal) => {
                  const progress = calculateProgress(goal);
                  return (
                    <tr key={goal.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-medium text-foreground">{goal.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{goal.description}</p>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground text-xs">{goal.ownerId}</td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">{goal.thrustArea}</td>
                      <td className="py-4 px-4">
                        <Badge className={STATUS_COLORS[goal.status]}>
                          {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                          </div>
                          <span className="text-muted-foreground text-xs w-8">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-muted-foreground">{goal.weightage}%</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isAdmin && goal.status === 'locked' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-orange-600"
                              onClick={() => {
                                if (!user) return;
                                unlockGoal(goal.id, user.id);
                                toast.success(`"${goal.title}" unlocked for editing`);
                              }}
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              Unlock
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/goals/${goal.id}`)}>
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <GoalForm open={goalFormOpen} onClose={() => setGoalFormOpen(false)} />
    </div>
  );
}
