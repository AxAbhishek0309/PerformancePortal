'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { PageHeader } from '@/components/common/page-header';
import { ChartCard } from '@/components/dashboard/chart-card';
import { useStore } from '@/lib/store';
import { exportToCSV, buildAchievementReport } from '@/lib/export';
import { buildQuarterlyTrends, buildDepartmentMetrics, calculateProgress, PERFORMANCE_STATUS_CONFIG } from '@/lib/goal-utils';

const CHART_COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

export default function AnalyticsPage() {
  const { goals, checkins, users } = useStore();

  // ── Live computed data ──────────────────────────────────────────────────────
  const quarterlyTrends = useMemo(() => buildQuarterlyTrends(goals, checkins), [goals, checkins]);
  const deptMetrics = useMemo(() => buildDepartmentMetrics(goals, users), [goals, users]);

  // Goal distribution by thrust area (live)
  const thrustAreaData = useMemo(() => {
    const map: Record<string, number> = {};
    goals.forEach((g) => { map[g.thrustArea] = (map[g.thrustArea] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [goals]);

  // Goal distribution by UoM type (live)
  const uomTypeData = useMemo(() => {
    const map: Record<string, number> = { min: 0, max: 0, timeline: 0, zero: 0 };
    goals.forEach((g) => { map[g.uomType] = (map[g.uomType] ?? 0) + 1; });
    return [
      { name: 'Min (Higher better)', value: map.min },
      { name: 'Max (Lower better)', value: map.max },
      { name: 'Timeline', value: map.timeline },
      { name: 'Zero = Success', value: map.zero },
    ].filter((d) => d.value > 0);
  }, [goals]);

  // Performance status breakdown (live)
  const statusData = useMemo(() => {
    const map: Record<string, number> = { not_started: 0, on_track: 0, completed: 0 };
    goals.forEach((g) => { map[g.performanceStatus] = (map[g.performanceStatus] ?? 0) + 1; });
    return [
      { name: 'Not Started', value: map.not_started, color: '#9ca3af' },
      { name: 'On Track', value: map.on_track, color: '#3b82f6' },
      { name: 'Completed', value: map.completed, color: '#22c55e' },
    ];
  }, [goals]);

  // Per-employee weighted score (live)
  const employeeScores = useMemo(() => {
    const byOwner: Record<string, typeof goals> = {};
    goals.forEach((g) => { (byOwner[g.ownerId] ??= []).push(g); });
    return Object.entries(byOwner).map(([ownerId, gs]) => {
      const user = Object.values(users).find((u) => u.id === ownerId);
      const score = Math.round(gs.reduce((s, g) => s + (g.weightage / 100) * calculateProgress(g), 0));
      return { name: user?.name ?? ownerId, score, goals: gs.length };
    }).sort((a, b) => b.score - a.score);
  }, [goals, users]);

  // Manager check-in completion (bonus §5.4)
  const managerCheckinData = useMemo(() => {
    const managers = Object.values(users).filter((u) => u.role === 'manager');
    return managers.map((mgr) => {
      const teamIds = Object.values(users).filter((u) => u.managerId === mgr.id).map((u) => u.id);
      const teamGoals = goals.filter((g) => teamIds.includes(g.ownerId) && (g.status === 'locked' || g.status === 'approved'));
      const checkinsDone = checkins.filter((c) => teamIds.includes(c.ownerId)).length;
      const rate = teamGoals.length > 0 ? Math.round((checkinsDone / teamGoals.length) * 100) : 0;
      return { name: mgr.name, checkinRate: rate, teamSize: teamIds.length };
    });
  }, [goals, checkins, users]);

  const handleExport = () => exportToCSV(buildAchievementReport(goals), 'achievement-report');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Live performance metrics computed from active goal data"
        action={{ label: 'Export Report', icon: Download, onClick: handleExport }}
      />

      {/* Quarterly Trends — live */}
      <ChartCard title="Quarterly Trends" description="Live check-in completion and progress by quarter" onExport={handleExport}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={quarterlyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="quarter" stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey="completionRate" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 4 }} name="Completion Rate %" />
            <Line type="monotone" dataKey="avgProgress" stroke="var(--color-chart-2)" strokeWidth={2} dot={{ r: 4 }} name="Avg Progress %" />
            <Line type="monotone" dataKey="goalsSubmitted" stroke="var(--color-chart-3)" strokeWidth={2} dot={{ r: 4 }} name="Goals Submitted" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals by Thrust Area — live */}
        <ChartCard title="Goals by Thrust Area" description="Distribution across strategic areas">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={thrustAreaData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${value}`}>
                {thrustAreaData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Performance Status — live */}
        <ChartCard title="Performance Status" description="Not Started / On Track / Completed breakdown">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Department Performance — live */}
      <ChartCard title="Department Performance" description="Live completion rates computed from active goals">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={deptMetrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="department" stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
            <Legend />
            <Bar dataKey="completionRate" fill="var(--color-chart-1)" name="Completion Rate %" radius={[6, 6, 0, 0]} />
            <Bar dataKey="activeGoals" fill="var(--color-chart-2)" name="Active Goals" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Weighted Scores — live */}
        <ChartCard title="Employee Weighted Scores" description="Overall performance score per employee (live)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={employeeScores} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} width={90} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
              <Bar dataKey="score" fill="var(--color-chart-4)" name="Weighted Score" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* UoM Type Distribution — live */}
        <ChartCard title="UoM Type Distribution" description="Goals by progress formula type">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={uomTypeData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${value}`}>
                {uomTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Manager Effectiveness — Bonus §5.4 */}
      {managerCheckinData.length > 0 && (
        <ChartCard title="Manager Check-in Effectiveness" description="Bonus: Check-in completion rates across L1 managers">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={managerCheckinData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="checkinRate" fill="var(--color-chart-5)" name="Check-in Rate %" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Department detail table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Department Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Department</th>
                <th className="text-right py-3 px-4 font-semibold">Employees</th>
                <th className="text-right py-3 px-4 font-semibold">Goals</th>
                <th className="text-right py-3 px-4 font-semibold">Avg Weightage</th>
                <th className="text-right py-3 px-4 font-semibold">Completion</th>
              </tr>
            </thead>
            <tbody>
              {deptMetrics.map((d) => (
                <tr key={d.department} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{d.department}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{d.employees}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{d.activeGoals}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{d.avgWeightage}%</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full">
                        <div className={`h-2 rounded-full ${d.completionRate >= 80 ? 'bg-green-500' : d.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${d.completionRate}%` }} />
                      </div>
                      <span className="font-semibold">{d.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
