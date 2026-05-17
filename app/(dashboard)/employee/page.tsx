'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, TrendingUp, CheckCircle2, Target, Zap } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { SectionCard } from '@/components/common/section-card';
import { GoalCard } from '@/components/goals/goal-card';
import { EmptyState } from '@/components/common/empty-state';
import { GoalForm } from '@/components/goals/goal-form';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { calculateProgress, calculateWeightedScore, isGoalCompleted } from '@/lib/goal-utils';

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const { goals } = useStore();
  const router = useRouter();
  const [goalFormOpen, setGoalFormOpen] = useState(false);

  const myGoals = goals.filter((g) => g.ownerId === user?.id);
  const completedGoals = myGoals.filter(isGoalCompleted);
  // Use BRD-correct calculateProgress for each goal type
  const avgProgress = myGoals.length
    ? Math.round(myGoals.reduce((sum, g) => sum + calculateProgress(g), 0) / myGoals.length)
    : 0;
  const totalWeightage = myGoals.reduce((sum, g) => sum + g.weightage, 0);
  const completionRate = myGoals.length ? Math.round((completedGoals.length / myGoals.length) * 100) : 0;
  // Weighted overall score (BRD §2.2)
  const weightedScore = calculateWeightedScore(myGoals);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Goals Dashboard"
        description="Track and manage your OKRs"
        action={{ label: 'New Goal', icon: Plus, onClick: () => setGoalFormOpen(true) }}
      />

      <MetricsGrid columns={4}>
        <StatCard label="Total Goals" value={myGoals.length} icon={CheckCircle2}
          iconBg="bg-blue-100 dark:bg-blue-900" iconColor="text-blue-600 dark:text-blue-400"
          description={`${completionRate}% completion rate`} />
        <StatCard label="Completed" value={completedGoals.length} icon={CheckCircle2}
          iconBg="bg-green-100 dark:bg-green-900" iconColor="text-green-600 dark:text-green-400"
          trend={{ value: completionRate, direction: 'up' }} />
        <StatCard label="Avg Progress" value={`${avgProgress}%`} icon={TrendingUp}
          iconBg="bg-purple-100 dark:bg-purple-900" iconColor="text-purple-600 dark:text-purple-400"
          trend={{ value: avgProgress > 50 ? 5 : -3, direction: avgProgress > 50 ? 'up' : 'down' }} />
        <StatCard label="Weighted Score" value={`${weightedScore}%`} icon={Zap}
          iconBg="bg-orange-100 dark:bg-orange-900" iconColor="text-orange-600 dark:text-orange-400"
          description={`${totalWeightage}% total weightage`} />
      </MetricsGrid>

      <SectionCard
        title="Your Goals"
        description="Active goals aligned with your objectives"
        action={{ label: 'View All', icon: Target, onClick: () => router.push('/my-goals') }}
      >
        {myGoals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Create your first goal to get started"
            action={{ label: 'Create Goal', icon: Plus, onClick: () => setGoalFormOpen(true) }}
          />
        ) : (
          <div className="grid gap-4">
            {myGoals.slice(0, 3).map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </SectionCard>

      <GoalForm open={goalFormOpen} onClose={() => setGoalFormOpen(false)} />
    </div>
  );
}
