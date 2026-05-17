'use client';

import { useRouter } from 'next/navigation';
import { Users, CheckCircle2, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { SectionCard } from '@/components/common/section-card';
import { GoalCard } from '@/components/goals/goal-card';
import { ApprovalItem } from '@/components/approvals/approval-item';
import { calculateMetrics } from '@/lib/goal-utils';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';

const TEAM_IDS = ['emp-001', 'emp-002', 'emp-003', 'emp-004', 'emp-005'];

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { goals, approvals, users } = useStore();

  // Derive team from actual managerId relationships in the users store
  const teamIds = Object.values(users)
    .filter((u) => u.managerId === currentUser?.id)
    .map((u) => u.id);

  // Fallback to hardcoded list only if store hasn't loaded yet
  const effectiveTeamIds = teamIds.length > 0 ? teamIds : TEAM_IDS;

  const pendingApprovals = approvals.filter((a) => {
    const submitter = Object.values(users).find((u) => u.id === a.submittedBy);
    return a.status === 'pending' && (
      submitter?.managerId === currentUser?.id || submitter?.role === 'employee'
    );
  });

  const teamGoals = goals.filter((g) => effectiveTeamIds.includes(g.ownerId));
  const teamSize = new Set(teamGoals.map((g) => g.ownerId)).size || effectiveTeamIds.length;
  const metrics = calculateMetrics(teamGoals);
  const approvedGoals = teamGoals.filter((g) => g.status === 'approved' || g.status === 'locked').length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team Dashboard"
        description={`Managing ${teamSize} team member${teamSize !== 1 ? 's' : ''}`}
      />

      <MetricsGrid columns={4}>
        <StatCard label="Team Size" value={teamSize} icon={Users}
          iconBg="bg-blue-100 dark:bg-blue-900" iconColor="text-blue-600 dark:text-blue-400"
          description="Active team members" />
        <StatCard label="Total Goals" value={teamGoals.length} icon={CheckCircle2}
          iconBg="bg-green-100 dark:bg-green-900" iconColor="text-green-600 dark:text-green-400"
          trend={{ value: approvedGoals, direction: 'up' }} />
        <StatCard label="Pending Approvals" value={pendingApprovals.length} icon={AlertCircle}
          iconBg="bg-orange-100 dark:bg-orange-900" iconColor="text-orange-600 dark:text-orange-400"
          description="Awaiting review" />
        <StatCard label="Avg Progress" value={`${metrics.avgProgress}%`} icon={TrendingUp}
          iconBg="bg-purple-100 dark:bg-purple-900" iconColor="text-purple-600 dark:text-purple-400"
          trend={{ value: 12, direction: 'up' }} />
      </MetricsGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SectionCard
          title="Pending Approvals"
          description={`${pendingApprovals.length} awaiting your review`}
          action={{ label: 'View All', icon: ArrowRight, onClick: () => router.push('/approvals') }}
        >
          <div className="space-y-3">
            {pendingApprovals.length > 0 ? (
              pendingApprovals.slice(0, 3).map((approval) => (
                <ApprovalItem key={approval.id} approval={approval} expandable={false} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No pending approvals 🎉</p>
            )}
          </div>
        </SectionCard>

        <div className="lg:col-span-2">
          <SectionCard
            title="Team Goals"
            description="Active goals from your team"
            action={{ label: 'View All', icon: ArrowRight, onClick: () => router.push('/goals') }}
          >
            <div className="grid gap-4">
              {teamGoals.slice(0, 3).map((goal) => (
                <GoalCard key={goal.id} goal={goal} compact />
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
