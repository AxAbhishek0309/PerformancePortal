'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Target, TrendingUp } from 'lucide-react';
import { useStore } from '@/lib/store';
import { exportToCSV, buildAchievementReport } from '@/lib/export';
import { buildDepartmentMetrics, buildQuarterlyTrends, calculateProgress } from '@/lib/goal-utils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { goals, checkins, users } = useStore();

  const totalGoals = goals.length;
  const approvedGoals = goals.filter((g) => g.status === 'locked' || g.status === 'approved').length;
  const totalEmployees = new Set(goals.map((g) => g.ownerId)).size;
  const avgCompletion = goals.length
    ? Math.round(goals.reduce((sum, g) => sum + calculateProgress(g), 0) / goals.length)
    : 0;

  const departmentMetrics = buildDepartmentMetrics(goals, users);
  const quarterlyTrends = buildQuarterlyTrends(goals, checkins);

  const handleExport = () => {
    exportToCSV(buildAchievementReport(goals), 'achievement-report');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Organization-wide performance overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Goals', value: totalGoals, icon: Target, bg: 'bg-blue-100 dark:bg-blue-900', color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Approved / Locked', value: approvedGoals, icon: TrendingUp, bg: 'bg-green-100 dark:bg-green-900', color: 'text-green-600 dark:text-green-400' },
          { label: 'Active Employees', value: totalEmployees, icon: Users, bg: 'bg-purple-100 dark:bg-purple-900', color: 'text-purple-600 dark:text-purple-400' },
          { label: 'Avg Progress Score', value: `${avgCompletion}%`, icon: BarChart3, bg: 'bg-orange-100 dark:bg-orange-900', color: 'text-orange-600 dark:text-orange-400' },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Department Performance</h2>
          <Button variant="outline" size="sm" onClick={handleExport}>Export Report</Button>
        </div>
        <div className="space-y-4">
          {departmentMetrics.map((dept) => (
            <div key={dept.department}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-foreground">{dept.department}</p>
                  <p className="text-xs text-muted-foreground">{dept.employees} employees · {dept.activeGoals} goals</p>
                </div>
                <p className="text-lg font-semibold text-foreground">{dept.completionRate}%</p>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${dept.completionRate >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' : dept.completionRate >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
                  style={{ width: `${dept.completionRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quarterly Trends</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Quarter</th>
                <th className="text-right py-3 px-4 font-semibold">Goals Submitted</th>
                <th className="text-right py-3 px-4 font-semibold">Completion Rate</th>
                <th className="text-right py-3 px-4 font-semibold">Avg Progress</th>
              </tr>
            </thead>
            <tbody>
              {quarterlyTrends.map((trend) => (
                <tr key={trend.quarter} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{trend.quarter}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{trend.goalsSubmitted}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${trend.completionRate}%` }} />
                      </div>
                      <span className="text-muted-foreground">{trend.completionRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{trend.avgProgress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Admin Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button variant="outline" className="w-full" onClick={() => router.push('/cycles')}>Manage Cycles</Button>
          <Button variant="outline" className="w-full" onClick={() => router.push('/audit')}>View Audit Logs</Button>
          <Button variant="outline" className="w-full" onClick={handleExport}>Export Data</Button>
          <Button variant="outline" className="w-full" onClick={() => router.push('/settings')}>Settings</Button>
        </div>
      </Card>
    </div>
  );
}
