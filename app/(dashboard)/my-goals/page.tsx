'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, Pencil, Trash2, AlertCircle, ClipboardList } from 'lucide-react';
import { Goal } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { GoalForm } from '@/components/goals/goal-form';
import { CheckinForm } from '@/components/goals/checkin-form';
import { CycleScheduleBanner } from '@/components/common/cycle-schedule-banner';
import { isGoalSettingOpen, isCheckinOpen } from '@/lib/cycle-schedule';
import {
  calculateProgress,
  canEditGoal,
  canEditSharedGoalWeightage,
  isGoalActiveForCheckin,
} from '@/lib/goal-utils';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  returned: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  locked: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
};

export default function MyGoalsPage() {
  const { user } = useAuth();
  const { goals, submitGoal, deleteGoal } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | undefined>();

  const myGoals = goals.filter((g) => g.ownerId === user?.id);
  const totalWeightage = myGoals.reduce((sum, g) => sum + g.weightage, 0);
  const atWeightageCapacity = totalWeightage >= 100;
  const draftGoals = myGoals.filter((g) => g.status === 'draft');
  const goalSettingOpen = isGoalSettingOpen();

  const handleEdit = (goal: Goal) => {
    setEditGoal(goal);
    setFormOpen(true);
  };

  const handleCreate = () => {
    if (user?.role !== 'admin' && !goalSettingOpen) {
      toast.error('Goal setting window is closed');
      return;
    }
    setEditGoal(undefined);
    setFormOpen(true);
  };

  const handleSubmitSheet = () => {
    if (!user) return;
    if (!goalSettingOpen) {
      toast.error('Goal setting window is closed');
      return;
    }
    if (totalWeightage !== 100) return;
    draftGoals.forEach((g) => submitGoal(g.id, user.id));
  };

  const handleDelete = (goalId: string) => {
    if (!user) return;
    deleteGoal(goalId, user.id);
  };

  return (
    <div className="space-y-6">
      <CycleScheduleBanner />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Goals</h1>
          <p className="text-muted-foreground mt-1">
            {myGoals.length}/8 goals &nbsp;·&nbsp;
            <span className={totalWeightage === 100 ? 'text-green-600 font-medium' : totalWeightage > 100 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              {totalWeightage}% total weightage
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {draftGoals.length > 0 && (
            <Button
              className="gap-2"
              onClick={handleSubmitSheet}
              disabled={totalWeightage !== 100 || !goalSettingOpen}
            >
              <Send className="w-4 h-4" />
              Submit Goal Sheet
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={handleCreate}
            disabled={myGoals.length >= 8 || (user?.role !== 'admin' && (!goalSettingOpen || atWeightageCapacity))}
            title={atWeightageCapacity ? 'Free up weightage before adding a new goal' : undefined}>
            <Plus className="w-4 h-4" />
            Add Goal
          </Button>
        </div>
      </div>

      {/* Weightage warning */}
      {myGoals.length > 0 && draftGoals.length > 0 && totalWeightage !== 100 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {totalWeightage < 100
            ? `Total weightage is ${totalWeightage}%. You need exactly 100% before you can submit your goal sheet. Add ${100 - totalWeightage}% more.`
            : `Total weightage is ${totalWeightage}%. You must reduce by ${totalWeightage - 100}% to exactly 100% before submitting.`}
        </div>
      )}

      {/* Goals */}
      {myGoals.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No goals yet. Create your first goal to get started.</p>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Create First Goal
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {myGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              userId={user?.id ?? ''}
              onEdit={() => handleEdit(goal)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </div>
      )}

      <GoalForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditGoal(undefined); }}
        editGoal={editGoal}
      />
    </div>
  );
}

function GoalCard({
  goal,
  userId,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  userId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [checkinOpen, setCheckinOpen] = useState(false);
  const progress = calculateProgress(goal);
  const isEditable = canEditGoal(goal, userId);
  const sharedWeightageOnly = canEditSharedGoalWeightage(goal, userId);

  // Check-in requires: own the goal + goal is locked/approved + check-in window is open
  const isOwner = goal.ownerId === userId;
  const goalActive = isGoalActiveForCheckin(goal);
  const windowOpen = isCheckinOpen();
  const canCheckin = isOwner && goalActive && windowOpen;

  // Show a disabled check-in button with a reason when the goal is active but window is closed
  const showCheckinDisabled = isOwner && goalActive && !windowOpen;

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold text-foreground">{goal.title}</h3>
            <Badge className={STATUS_COLORS[goal.status]}>
              {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
            </Badge>
            {goal.isShared && (
              <Badge variant="outline" className="text-xs">Shared</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{goal.description}</p>
        </div>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <Link href={`/goals/${goal.id}`}>
            <Button variant="outline" size="sm">View</Button>
          </Link>
          {canCheckin && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setCheckinOpen(true)}>
              <ClipboardList className="w-3.5 h-3.5" />
              Check-in
            </Button>
          )}
          {showCheckinDisabled && (
            <Button variant="outline" size="sm" className="gap-1 opacity-50 cursor-not-allowed" disabled title="Check-in window is currently closed">
              <ClipboardList className="w-3.5 h-3.5" />
              Check-in
            </Button>
          )}
          {isOwner && !goalActive && (
            <span className="text-xs text-muted-foreground px-2">
              {goal.status === 'draft' || goal.status === 'submitted'
                ? 'Awaiting approval'
                : goal.status === 'returned'
                  ? 'Returned — edit & resubmit'
                  : null}
            </span>
          )}
          {(isEditable || sharedWeightageOnly) && (
            <>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              {isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-y border-border">
        <div>
          <p className="text-xs uppercase text-muted-foreground font-semibold">Area</p>
          <p className="text-sm font-medium text-foreground mt-1">{goal.thrustArea}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground font-semibold">Target</p>
          <p className="text-sm font-medium text-foreground mt-1">
            {goal.targetValue} {goal.unitOfMeasurement}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground font-semibold">Weightage</p>
          <p className="text-sm font-medium text-foreground mt-1">{goal.weightage}%</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground font-semibold">Deadline</p>
          <p className="text-sm font-medium text-foreground mt-1">{formatDate(goal.deadline)}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Progress</p>
          <p className="text-sm font-semibold text-foreground">
            {goal.currentValue} / {goal.targetValue} ({Math.round(progress)}%)
          </p>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        </div>

      <CheckinForm open={checkinOpen} onClose={() => setCheckinOpen(false)} goal={goal} />
    </Card>
  );
}
