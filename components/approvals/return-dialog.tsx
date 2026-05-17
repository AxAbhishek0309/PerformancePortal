'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ReturnDialogProps {
  open: boolean;
  mode: 'return' | 'reject';
  onClose: () => void;
  onConfirm: (comment: string) => void;
}

export function ReturnDialog({ open, mode, onClose, onConfirm }: ReturnDialogProps) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!comment.trim()) {
      setError('Please provide a reason.');
      return;
    }
    onConfirm(comment.trim());
    setComment('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setComment('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'return' ? 'Return for Rework' : 'Reject Goal'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="comment">
            {mode === 'return'
              ? 'What needs to be revised?'
              : 'Reason for rejection'}
          </Label>
          <Textarea
            id="comment"
            placeholder={
              mode === 'return'
                ? 'e.g. Please clarify the target metric and adjust weightage...'
                : 'e.g. Goal does not align with department priorities...'
            }
            rows={4}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setError('');
            }}
            className={error ? 'border-destructive' : ''}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant={mode === 'reject' ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {mode === 'return' ? 'Return' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
