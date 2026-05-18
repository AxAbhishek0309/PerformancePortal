'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { QUARTERS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { Goal, CheckIn } from '@/lib/types';
import { PERFORMANCE_STATUS_CONFIG } from '@/lib/goal-utils';
import { isCheckinOpen, getDefaultCheckinQuarter, getScheduleStatusMessage } from '@/lib/cycle-schedule';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const checkinSchema = z.object({
  period: z.string().min(1, 'Select a quarter'),
  progressValue: z.coerce.number().min(0, 'Value cannot be negative'),
  notes: z.string().min(5, 'Please add some notes about your progress'),
  performanceStatus: z.enum(['not_started', 'on_track', 'completed'] as const),
});

type CheckinFormValues = z.infer<typeof checkinSchema>;

interface CheckinFormProps {
  open: boolean;
  onClose: () => void;
  goal: Goal;
}

export function CheckinForm({ open, onClose, goal }: CheckinFormProps) {
  const { user } = useAuth();
  const { addCheckin } = useStore();
  const checkinOpen = isCheckinOpen();
  const defaultQuarter = getDefaultCheckinQuarter() ?? '';

  const form = useForm<z.infer<typeof checkinSchema>>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      period: defaultQuarter,
      progressValue: goal.currentValue,
      notes: '',
      performanceStatus: goal.performanceStatus ?? 'on_track',
    },
  });

  const onSubmit = (values: z.infer<typeof checkinSchema>) => {
    if (!user) return;
    if (!checkinOpen) {
      toast.error('Check-in window is closed', {
        description: getScheduleStatusMessage(),
      });
      return;
    }

    // Achieved value must not exceed target (for Min/Max/Zero UoM types)
    // For timeline goals, currentValue represents % complete so cap at targetValue
    if (values.progressValue > goal.targetValue) {
      toast.error(
        `Achieved value (${values.progressValue}) cannot exceed the target (${goal.targetValue} ${goal.unitOfMeasurement}).`,
        { description: 'Please enter a value less than or equal to the target.' }
      );
      return;
    }

    const checkin: CheckIn = {
      id: `checkin-${Date.now()}`,
      goalId: goal.id,
      ownerId: user.id,
      period: values.period,
      progressValue: values.progressValue,
      notes: values.notes,
      submittedAt: new Date(),
    };
    // Pass performanceStatus atomically with the check-in so both update together
    addCheckin(checkin, user.id, values.performanceStatus);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Check-in</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1 truncate">{goal.title}</p>
        </DialogHeader>

        <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-sm flex gap-6">
          <div>
            <span className="text-muted-foreground">Target: </span>
            <span className="font-semibold">{goal.targetValue} {goal.unitOfMeasurement}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Current: </span>
            <span className="font-semibold">{goal.currentValue} {goal.unitOfMeasurement}</span>
          </div>
        </div>

        {!checkinOpen && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-900 dark:text-yellow-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {getScheduleStatusMessage()}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quarter</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quarter" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {QUARTERS.map((q) => (
                        <SelectItem key={q.value} value={q.label}>
                          {q.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="progressValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual Achievement ({goal.unitOfMeasurement})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={goal.targetValue}
                      step="any"
                      {...field}
                      className={Number(field.value) > goal.targetValue ? 'border-destructive' : ''}
                    />
                  </FormControl>
                  {Number(field.value) > goal.targetValue && (
                    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
                      <AlertCircle className="w-3 h-3" />
                      Cannot exceed target of {goal.targetValue} {goal.unitOfMeasurement}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe what you've accomplished this quarter..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

            {/* BRD §2.2 — performance status */}
            <FormField control={form.control} name="performanceStatus" render={({ field }) => (
              <FormItem>
                <FormLabel>Goal Status</FormLabel>
                <div className="flex gap-2 flex-wrap">
                  {(['not_started', 'on_track', 'completed'] as const).map((s) => {
                    const cfg = PERFORMANCE_STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => field.onChange(s)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${field.value === s ? `${cfg.bg} ${cfg.text} border-current` : 'border-border text-muted-foreground hover:border-primary/50'}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!checkinOpen || Number(form.watch('progressValue')) > goal.targetValue}>Submit Check-in</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
