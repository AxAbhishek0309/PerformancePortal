'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Edit, Send, MessageSquare, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { GoalForm } from '@/components/goals/goal-form';
import { CheckinForm } from '@/components/goals/checkin-form';
import { formatDate } from '@/lib/utils';
import { isGoalActiveForCheckin, canEditGoal, calculateProgress } from '@/lib/goal-utils';
import { isCheckinOpen, isGoalSettingOpen, getScheduleStatusMessage } from '@/lib/cycle-schedule';
import { CycleScheduleBanner } from '@/components/common/cycle-schedule-banner';
import { AlertCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  returned: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  locked: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function GoalDetailPage({ params }: Props) {
  const { id } = use(params);
  const { user, role } = useAuth();
  const { goals, checkins: allCheckins, submitGoal, addManagerComment, unlockGoal, users } = useStore();
  const checkins = allCheckins.filter((c) => c.goalId === id);

  // Back destination depends on role — employees use /my-goals, others use /goals
  const backHref = role === 'employee' ? '/my-goals' : '/goals';

  const [editOpen, setEditOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const goal = goals.find((g) => g.id === id);

  if (!goal) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-foreground mb-4">Goal not found</h1>
        <Link href={role === 'employee' ? '/my-goals' : '/goals'}>
          <Button>Back to goals</Button>
        </Link>
      </div>
    );
  }

  const progress = calculateProgress(goal);
  const isOwner = user?.id === goal.ownerId;
  const isEditable = user ? canEditGoal(goal, user.id) : false;
  const checkinWindowOpen = isCheckinOpen();
  const goalActiveForCheckin = isGoalActiveForCheckin(goal);
  const canCheckin = isOwner && goalActiveForCheckin && checkinWindowOpen;
  // Goal is active but window is closed — show disabled button with reason
  const checkinWindowClosed = isOwner && goalActiveForCheckin && !checkinWindowOpen;
  const canSubmit = isEditable && isGoalSettingOpen();

  const handleSubmit = () => {
    if (!user) return;
    submitGoal(goal.id, user.id);
  };

  const handleSaveComment = (checkinId: string) => {
    if (!user || !commentText.trim()) return;
    addManagerComment(checkinId, commentText.trim(), user.id);
    setCommentingId(null);
    setCommentText('');
  };

  return (
    <div className="space-y-6">
      <CycleScheduleBanner />

      {isOwner && isGoalActiveForCheckin(goal) && !checkinWindowOpen && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Check-ins are closed. {getScheduleStatusMessage()}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={backHref}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-foreground truncate">{goal.title}</h1>
          <p className="text-muted-foreground mt-1">{goal.description}</p>
        </div>
        <Badge className={STATUS_COLORS[goal.status]}>
          {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">Thrust Area</p>
                <p className="text-sm font-medium mt-2">{goal.thrustArea}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">Weightage</p>
                <p className="text-sm font-medium mt-2">{goal.weightage}%</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">Unit</p>
                <p className="text-sm font-medium mt-2">{goal.unitOfMeasurement}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">Target</p>
                <p className="text-sm font-medium mt-2">{goal.targetValue}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">Current</p>
                <p className="text-sm font-medium mt-2">{goal.currentValue}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">Deadline</p>
                <p className="text-sm font-medium mt-2">{formatDate(goal.deadline)}</p>
              </div>
            </div>
          </Card>

          {/* Progress */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">Progress</h2>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Current Achievement</p>
              <p className="text-2xl font-bold">
                {goal.currentValue} / {goal.targetValue}
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}% Complete</p>
          </Card>

          {/* Check-ins */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Quarterly Check-ins</h2>
              {canCheckin && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setCheckinOpen(true)}>
                  <Send className="w-3.5 h-3.5" />
                  Add Check-in
                </Button>
              )}
              {checkinWindowClosed && (
                <span className="text-xs text-muted-foreground">Window closed</span>
              )}
            </div>

            {checkins.length > 0 ? (
              <div className="space-y-4">
                {checkins.map((checkin) => (
                  <div key={checkin.id} className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <p className="font-medium">{checkin.period}</p>
                      <span className="text-xs text-muted-foreground">{formatDate(checkin.submittedAt)}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">Achievement:</span>
                      <span className="font-semibold">{checkin.progressValue} {goal.unitOfMeasurement}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{checkin.notes}</p>

                    {/* Manager comment */}
                    {checkin.managerComment ? (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Manager Comment:</p>
                        <p className="text-sm">{checkin.managerComment}</p>
                      </div>
                    ) : role === 'manager' ? (
                      commentingId === checkin.id ? (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Add your check-in comment..."
                            rows={3}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveComment(checkin.id)}>Save Comment</Button>
                            <Button size="sm" variant="outline" onClick={() => setCommentingId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-muted-foreground"
                          onClick={() => { setCommentingId(checkin.id); setCommentText(''); }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Add Comment
                        </Button>
                      )
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No check-ins yet.{canCheckin ? ' Submit your first quarterly update.' : ''}
              </p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              {isEditable && (
                <Button className="w-full gap-2" onClick={() => setEditOpen(true)}>
                  <Edit className="w-4 h-4" />
                  Edit Goal
                </Button>
              )}
              {canSubmit && (
                <Button className="w-full gap-2" variant="outline" onClick={handleSubmit}>
                  <Send className="w-4 h-4" />
                  Submit for Approval
                </Button>
              )}
              {canCheckin && (
                <Button className="w-full gap-2" variant="outline" onClick={() => setCheckinOpen(true)}>
                  Add Check-in
                </Button>
              )}
              {checkinWindowClosed && (
                <Button className="w-full gap-2" variant="outline" disabled title="Check-in window is currently closed">
                  Check-in Window Closed
                </Button>
              )}
              {role === 'admin' && goal.status === 'locked' && (
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => {
                    if (!user) return;
                    unlockGoal(goal.id, user.id);
                    toast.success('Goal unlocked for employee editing');
                  }}
                >
                  <Unlock className="w-4 h-4" />
                  Unlock Goal (Admin)
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">Created</p>
                <p className="mt-1">{formatDate(goal.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">Last Updated</p>
                <p className="mt-1">{formatDate(goal.updatedAt)}</p>
              </div>
              {goal.approvedBy && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Approved By</p>
                  <p className="mt-1">
                    {Object.values(users).find((u) => u.id === goal.approvedBy)?.name ?? goal.approvedBy}
                  </p>
                </div>
              )}
              {goal.approvedAt && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Approved On</p>
                  <p className="mt-1">{formatDate(goal.approvedAt)}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {isEditable && (
        <GoalForm open={editOpen} onClose={() => setEditOpen(false)} editGoal={goal} />
      )}
      {goal && (
        <CheckinForm open={checkinOpen} onClose={() => setCheckinOpen(false)} goal={goal} />
      )}
    </div>
  );
}
