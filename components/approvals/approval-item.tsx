'use client';

import { useState } from 'react';
import { Approval } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, X, ChevronRight, Pencil } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { ReturnDialog } from './return-dialog';
import { formatDate } from '@/lib/utils';

interface ApprovalItemProps {
  approval: Approval;
  expandable?: boolean;
}

const STATUS_CONFIG = {
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200' },
  approved: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' },
  returned: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-200' },
  rejected: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200' },
} as const;

export function ApprovalItem({ approval, expandable = true }: ApprovalItemProps) {
  const { user } = useAuth();
  const { approveGoal, returnGoal, rejectGoal, editApprovalGoal, goals } = useStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnMode, setReturnMode] = useState<'return' | 'reject'>('return');

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const goal = goals.find((g) => g.id === approval.goalId);
  const [editTarget, setEditTarget] = useState(goal?.targetValue ?? 0);
  const [editWeightage, setEditWeightage] = useState(goal?.weightage ?? 0);

  const statusConfig = STATUS_CONFIG[approval.status as keyof typeof STATUS_CONFIG];

  const handleApprove = () => {
    if (!user) return;
    approveGoal(approval.id, user.id);
  };

  const handleReturn = (comment: string) => {
    if (!user) return;
    returnGoal(approval.id, user.id, comment);
  };

  const handleReject = (comment: string) => {
    if (!user) return;
    rejectGoal(approval.id, user.id, comment);
  };

  const handleSaveEdit = () => {
    if (!user) return;
    editApprovalGoal(approval.id, { targetValue: editTarget, weightage: editWeightage }, user.id);
    setIsEditing(false);
  };

  return (
    <>
      <div className="relative border border-border/60 rounded-lg overflow-hidden hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none" />

        {/* Header row */}
        <div
          className={`relative p-6 flex items-center justify-between ${expandable ? 'cursor-pointer' : ''} transition-colors duration-200`}
          onClick={() => expandable && setIsExpanded(!isExpanded)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {approval.goalTitle}
              </h3>
              <Badge variant="secondary" className={`${statusConfig.bg} ${statusConfig.text} text-xs`}>
                {approval.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground/80 line-clamp-1">{approval.submittedBy}</p>
          </div>
          {expandable && (
            <ChevronRight
              className={`w-5 h-5 text-muted-foreground/50 group-hover:text-primary/60 transition-all ml-4 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            />
          )}
        </div>

        {/* Expanded detail */}
        {(isExpanded || !expandable) && (
          <div className="relative border-t border-border/30 px-6 py-6 bg-gradient-to-b from-primary/3 to-transparent space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Submitted By</p>
                <p className="text-sm font-medium text-foreground">{approval.submittedBy}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Submitted Date</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(approval.submittedAt)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Goal Description</p>
              <p className="text-sm text-foreground bg-background/50 p-3 rounded border border-border">
                {approval.goalDescription}
              </p>
            </div>

            {/* Inline edit — manager can adjust target & weightage before approving */}
            {approval.status === 'pending' && (
              <div className="border border-border/50 rounded-lg p-4 bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Goal Metrics
                  </p>
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" className="h-7 text-xs" onClick={handleSaveEdit}>
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Target Value</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editTarget}
                        onChange={(e) => setEditTarget(Number(e.target.value))}
                        className="h-8 mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{goal?.targetValue ?? '—'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Weightage (%)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        min={10}
                        max={100}
                        value={editWeightage}
                        onChange={(e) => setEditWeightage(Number(e.target.value))}
                        className="h-8 mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{goal?.weightage ?? '—'}%</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {approval.comments && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Comments</p>
                <p className="text-sm text-foreground bg-background/50 p-3 rounded border border-border">
                  {approval.comments}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              {approval.status === 'pending' && (
                <>
                  <Button variant="default" size="sm" className="gap-2" onClick={handleApprove}>
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setReturnMode('return'); setReturnDialogOpen(true); }}
                  >
                    Return for Rework
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => { setReturnMode('reject'); setReturnDialogOpen(true); }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}
              {approval.status === 'approved' && (
                <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Approved
                </Badge>
              )}
              {approval.status === 'returned' && (
                <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                  Returned for Rework
                </Badge>
              )}
              {approval.status === 'rejected' && (
                <Badge className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                  Rejected
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      <ReturnDialog
        open={returnDialogOpen}
        mode={returnMode}
        onClose={() => setReturnDialogOpen(false)}
        onConfirm={returnMode === 'return' ? handleReturn : handleReject}
      />
    </>
  );
}
