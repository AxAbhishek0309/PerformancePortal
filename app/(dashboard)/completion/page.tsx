'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Search, Download } from 'lucide-react';
import { useStore } from '@/lib/store';
import { QUARTERS } from '@/lib/constants';
import { exportToCSV } from '@/lib/export';

export default function CompletionDashboardPage() {
  const { goals, checkins, users } = useStore();
  const [selectedQuarter, setSelectedQuarter] = useState<string>(QUARTERS[0].label);
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const approvedGoals = goals.filter((g) => g.status === 'locked' || g.status === 'approved');
    const ownerIds = Array.from(new Set(approvedGoals.map((g) => g.ownerId)));

    return ownerIds
      .map((ownerId) => {
        const user = Object.values(users).find((u) => u.id === ownerId);
        const ownerGoals = approvedGoals.filter((g) => g.ownerId === ownerId);

        // For each goal, find the latest check-in for the selected quarter
        const goalStatuses = ownerGoals.map((g) => {
          const latestCheckin = checkins
            .filter((c) => c.goalId === g.id && c.period === selectedQuarter)
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];

          // Use the goal's current performanceStatus (set by employee during check-in)
          // A check-in was submitted if one exists for this quarter
          return {
            goalId: g.id,
            hasCheckin: !!latestCheckin,
            // The actual status is on the goal itself — updated when employee submits check-in
            performanceStatus: g.performanceStatus,
          };
        });

        const total = ownerGoals.length;
        const checkedIn = goalStatuses.filter((s) => s.hasCheckin).length;
        const completedCount = goalStatuses.filter((s) => s.performanceStatus === 'completed').length;
        const onTrackCount = goalStatuses.filter((s) => s.performanceStatus === 'on_track').length;
        const notStartedCount = goalStatuses.filter((s) => s.performanceStatus === 'not_started').length;

        // Check-in completion rate = how many goals have a check-in this quarter
        const rate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

        return {
          id: ownerId,
          name: user?.name ?? ownerId,
          department: user?.department ?? '—',
          total,
          checkedIn,
          completedCount,
          onTrackCount,
          notStartedCount,
          rate,
          // All goals checked in = check-in complete (regardless of status)
          done: checkedIn === total && total > 0,
        };
      })
      .filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.rate - a.rate);
  }, [goals, checkins, users, selectedQuarter, search]);

  const doneCount = rows.filter((r) => r.done).length;
  const pendingCount = rows.length - doneCount;

  const handleExport = () => {
    exportToCSV(
      rows.map((r) => ({
        Employee: r.name,
        Department: r.department,
        Quarter: selectedQuarter,
        'Goals Total': r.total,
        'Check-ins Done': r.checkedIn,
        'Completion Rate': `${r.rate}%`,
        Completed: r.completedCount,
        'On Track': r.onTrackCount,
        'Not Started': r.notStartedCount,
        'Check-in Status': r.done ? 'All Checked In' : 'Pending',
      })),
      `checkin-completion-${selectedQuarter.replace(' ', '-')}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Check-in Completion</h1>
          <p className="text-muted-foreground mt-1">
            Real-time view of quarterly check-in completion per employee
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{doneCount}</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Overall Rate</p>
            <p className="text-2xl font-bold text-blue-600">
              {rows.length > 0 ? Math.round((doneCount / rows.length) * 100) : 0}%
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {QUARTERS.map((q) => (
            <Button
              key={q.value}
              size="sm"
              variant={selectedQuarter === q.label ? 'default' : 'outline'}
              onClick={() => setSelectedQuarter(q.label)}
            >
              {q.label}
            </Button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or department..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Employee</th>
                <th className="text-left py-3 px-4 font-semibold">Department</th>
                <th className="text-right py-3 px-4 font-semibold">Goals</th>
                <th className="text-right py-3 px-4 font-semibold">Checked In</th>
                <th className="text-left py-3 px-4 font-semibold">Goal Status Breakdown</th>
                <th className="text-right py-3 px-4 font-semibold">Check-in Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No data for {selectedQuarter}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-4 font-medium">{row.name}</td>
                    <td className="py-4 px-4 text-muted-foreground">{row.department}</td>
                    <td className="py-4 px-4 text-right text-muted-foreground">{row.total}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full">
                          <div
                            className={`h-2 rounded-full ${row.rate === 100 ? 'bg-green-500' : row.rate > 0 ? 'bg-blue-500' : 'bg-muted-foreground/30'}`}
                            style={{ width: `${row.rate}%` }}
                          />
                        </div>
                        <span className="text-xs w-12 text-right">{row.checkedIn}/{row.total}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {row.completedCount > 0 && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                            {row.completedCount} Completed
                          </Badge>
                        )}
                        {row.onTrackCount > 0 && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                            {row.onTrackCount} On Track
                          </Badge>
                        )}
                        {row.notStartedCount > 0 && (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 text-xs">
                            {row.notStartedCount} Not Started
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {row.done ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">All Checked In</Badge>
                      ) : row.checkedIn > 0 ? (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">In Progress</Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Pending</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
