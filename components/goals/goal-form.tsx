'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { THRUST_AREAS, UNITS_OF_MEASUREMENT } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { Goal } from '@/lib/types';
import { UOM_TYPE_LABELS, inferUomType } from '@/lib/goal-utils';
import { toDate } from '@/lib/utils';
import { toast } from 'sonner';
import { isGoalSettingOpen, getScheduleStatusMessage } from '@/lib/cycle-schedule';
import { canEditSharedGoalWeightage } from '@/lib/goal-utils';

// ─── Schema ───────────────────────────────────────────────────────────────────

const goalSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  thrustArea: z.enum([
    'Revenue Growth', 'Cost Optimization', 'Customer Success',
    'Innovation', 'Operational Excellence',
  ]),
  unitOfMeasurement: z.string().min(1, 'Select a unit of measurement'),
  uomType: z.enum(['min', 'max', 'timeline', 'zero'] as const),
  targetValue: z.coerce.number().positive('Target must be a positive number'),
  currentValue: z.coerce.number().min(0, 'Current value cannot be negative'),
  weightage: z.coerce.number().min(10, 'Minimum weightage per goal is 10% (BRD §2.1)').max(100, 'Maximum weightage is 100%'),
  deadline: z.string().min(1, 'Deadline is required'),
});

type GoalFormValues = z.infer<typeof goalSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  editGoal?: Goal;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GoalForm({ open, onClose, editGoal }: GoalFormProps) {
  const { user } = useAuth();
  const { goals, addGoal, updateGoal } = useStore();
  const [submitError, setSubmitError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Owner is always the logged-in user — per BRD, employees create their own goals only
  const ownerId = editGoal?.ownerId ?? user?.id ?? '';

  // Goals owned by this owner (for weightage validation)
  const ownerGoals = goals.filter((g) => g.ownerId === ownerId && g.id !== editGoal?.id);
  const usedWeightage = ownerGoals.reduce((sum, g) => sum + g.weightage, 0);
  const remainingWeightage = 100 - usedWeightage;

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: buildDefaults(editGoal, remainingWeightage),
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(editGoal, remainingWeightage));
      setSubmitError('');
      setAiSuggestions([]);
    }
  }, [open, editGoal]);

  const totalAfter = usedWeightage + (Number(form.watch('weightage')) || 0);
  const isOverWeight = totalAfter > 100;

  // ── AI Suggest via Groq ────────────────────────────────────────────────────
  const handleAISuggest = async () => {
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: user?.role,
          department: user?.department,
          thrustArea: form.getValues('thrustArea'),
          existingGoals: goals.filter((g) => g.ownerId === ownerId).map((g) => g.title),
        }),
      });
      const data = await res.json();
      setAiSuggestions(data.suggestions ?? []);
      if (data.source === 'groq') toast.success('Suggestions powered by Groq AI');
    } catch {
      toast.error('Could not fetch AI suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const sharedWeightageOnly =
    editGoal && user ? canEditSharedGoalWeightage(editGoal, user.id) : false;

  const onSubmit = (values: GoalFormValues) => {
    if (!user) return;
    setSubmitError('');

    // Employees and managers creating their own goals are gated by the cycle window
    // Admin can always create (exception handling per BRD §3)
    if (!editGoal && user.role !== 'admin' && !isGoalSettingOpen()) {
      setSubmitError(getScheduleStatusMessage());
      return;
    }

    if (sharedWeightageOnly && editGoal) {
      updateGoal(editGoal.id, { weightage: values.weightage }, user.id);
      toast.success('Weightage updated');
      onClose();
      return;
    }

    if (!editGoal && ownerGoals.length >= 8) {
      setSubmitError('Maximum of 8 goals reached for this employee.');
      return;
    }
    if (totalAfter > 100) {
      setSubmitError(`Total weightage would be ${totalAfter}%. Only ${remainingWeightage}% remaining.`);
      return;
    }

    if (editGoal) {
      updateGoal(editGoal.id, {
        title: values.title, description: values.description,
        thrustArea: values.thrustArea, unitOfMeasurement: values.unitOfMeasurement,
        uomType: values.uomType, targetValue: values.targetValue,
        currentValue: values.currentValue, weightage: values.weightage,
        deadline: new Date(values.deadline),
      }, user.id);
      toast.success('Goal updated');
    } else {
      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        ownerId,
        title: values.title, description: values.description,
        thrustArea: values.thrustArea, unitOfMeasurement: values.unitOfMeasurement,
        uomType: values.uomType, targetValue: values.targetValue,
        currentValue: values.currentValue, weightage: values.weightage,
        deadline: new Date(values.deadline),
        status: 'draft', performanceStatus: 'not_started',
        createdAt: new Date(), updatedAt: new Date(),
      };
      addGoal(newGoal, user.id);
      toast.success('Goal created');
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sharedWeightageOnly
              ? 'Adjust Weightage (Shared Goal)'
              : editGoal
                ? 'Edit Goal'
                : 'Create New Goal'}
          </DialogTitle>
        </DialogHeader>

        {/* Weightage tracker */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm">
          <div className="flex-1"><span className="text-muted-foreground">Used: </span><span className="font-semibold">{usedWeightage}%</span></div>
          <div className="flex-1">
            <span className="text-muted-foreground">Remaining: </span>
            <span className={`font-semibold ${remainingWeightage < 10 ? 'text-destructive' : 'text-green-600'}`}>{remainingWeightage}%</span>
          </div>
          <div className="flex-1">
            <span className="text-muted-foreground">Goals: </span>
            <span className={`font-semibold ${ownerGoals.length >= 8 ? 'text-destructive' : ''}`}>{ownerGoals.length}/8</span>
          </div>
          <Badge variant={totalAfter === 100 ? 'default' : isOverWeight ? 'destructive' : 'secondary'}>
            Total: {totalAfter}%
          </Badge>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* No capacity warning */}
        {!editGoal && remainingWeightage <= 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            All 100% weightage is already allocated. Edit an existing goal to free up capacity before adding a new one.
          </div>
        )}

        {sharedWeightageOnly && (
              <p className="text-sm text-muted-foreground rounded-lg border border-border/50 p-3 bg-muted/30">
                This is a shared goal. You may only change weightage; title and target are read-only.
              </p>
            )}

            {/* Title + AI Suggest */}
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Goal Title</FormLabel>
                  <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-primary" onClick={handleAISuggest} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI Suggest
                  </Button>
                </div>
                <FormControl>
                  <Input placeholder="e.g. Achieve 95% CSAT Score" {...field} disabled={editGoal?.isShared || sharedWeightageOnly} />
                </FormControl>
                {aiSuggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">Click to use a suggestion:</p>
                    {aiSuggestions.map((s, i) => (
                      <button key={i} type="button"
                        onClick={() => { form.setValue('title', s); setAiSuggestions([]); }}
                        className="w-full text-left text-xs px-3 py-2 rounded-md border border-primary/30 bg-primary/5 hover:bg-primary/10 text-foreground transition-colors">
                        ✦ {s}
                      </button>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )} />

            {/* Description */}
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Describe what success looks like..." rows={3} {...field} disabled={editGoal?.isShared || sharedWeightageOnly} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Thrust Area + UoM */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="thrustArea" render={({ field }) => (
                <FormItem>
                  <FormLabel>Thrust Area</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={editGoal?.isShared || sharedWeightageOnly}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select thrust area" /></SelectTrigger></FormControl>
                    <SelectContent>{THRUST_AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unitOfMeasurement" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit of Measurement</FormLabel>
                  <Select onValueChange={(v) => { field.onChange(v); form.setValue('uomType', inferUomType(v)); }} value={field.value} disabled={editGoal?.isShared || sharedWeightageOnly}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select UoM" /></SelectTrigger></FormControl>
                    <SelectContent>{UNITS_OF_MEASUREMENT.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* UoM Type */}
            <FormField control={form.control} name="uomType" render={({ field }) => (
              <FormItem>
                <FormLabel>Progress Formula</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={editGoal?.isShared || sharedWeightageOnly}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {(Object.entries(UOM_TYPE_LABELS) as [string, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {field.value === 'min' && 'Score = Achievement ÷ Target (higher is better)'}
                  {field.value === 'max' && 'Score = Target ÷ Achievement (lower is better, e.g. cost, TAT)'}
                  {field.value === 'timeline' && 'Score based on completion date vs deadline'}
                  {field.value === 'zero' && 'Score = 100% if value is 0, else 0% (e.g. incidents)'}
                </p>
                <FormMessage />
              </FormItem>
            )} />

            {/* Target + Current + Weightage */}
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="targetValue" render={({ field }) => (
                <FormItem><FormLabel>Target Value</FormLabel>
                  <FormControl><Input type="number" min={0} step="any" {...field} disabled={editGoal?.isShared || sharedWeightageOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="currentValue" render={({ field }) => (
                <FormItem><FormLabel>Current Value</FormLabel>
                  <FormControl><Input type="number" min={0} step="any" {...field} disabled={editGoal?.isShared || sharedWeightageOnly} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="weightage" render={({ field }) => (
                <FormItem><FormLabel>Weightage (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={10} max={100} step={1} {...field} className={isOverWeight ? 'border-destructive' : ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Deadline */}
            <FormField control={form.control} name="deadline" render={({ field }) => (
              <FormItem><FormLabel>Deadline</FormLabel>
                <FormControl><Input type="date" {...field} disabled={editGoal?.isShared || sharedWeightageOnly} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {submitError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{submitError}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isOverWeight || (!editGoal && remainingWeightage <= 0)}>
                {editGoal ? 'Save Changes' : 'Create Goal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function buildDefaults(editGoal: Goal | undefined, remainingWeightage: number): GoalFormValues {
  // editGoal.deadline may be a string (after JSON hydration) — always coerce via toDate
  const deadlineStr = editGoal?.deadline
    ? (() => { try { return toDate(editGoal.deadline).toISOString().split('T')[0]; } catch { return ''; } })()
    : '';
  return {
    title: editGoal?.title ?? '',
    description: editGoal?.description ?? '',
    thrustArea: editGoal?.thrustArea ?? 'Operational Excellence',
    unitOfMeasurement: editGoal?.unitOfMeasurement ?? '',
    uomType: editGoal?.uomType ?? 'min',
    targetValue: editGoal?.targetValue ?? 0,
    currentValue: editGoal?.currentValue ?? 0,
    weightage: editGoal?.weightage ?? (remainingWeightage >= 10 ? Math.min(remainingWeightage, 40) : 0),
    deadline: deadlineStr,
  };
}
