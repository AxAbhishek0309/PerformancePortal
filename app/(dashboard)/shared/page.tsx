'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Share2, Plus, Users } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { THRUST_AREAS, UNITS_OF_MEASUREMENT } from '@/lib/constants';
import { UOM_TYPE_LABELS, inferUomType } from '@/lib/goal-utils';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  thrustArea: z.enum(['Revenue Growth', 'Cost Optimization', 'Customer Success', 'Innovation', 'Operational Excellence']),
  unitOfMeasurement: z.string().min(1),
  uomType: z.enum(['min', 'max', 'timeline', 'zero'] as const),
  targetValue: z.coerce.number().positive(),
  weightage: z.coerce.number().min(10).max(100),
  deadline: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function SharedGoalsPage() {
  const { user } = useAuth();
  const { goals, pushSharedGoal, users } = useStore();
  const [open, setOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // BRD §2.1 — only managers and admins can push shared goals
  if (user?.role === 'employee') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
      </div>
    );
  }

  const sharedGoals = goals.filter((g) => g.isShared);
  const EMPLOYEES = Object.values(users).filter((u) => u.role === 'employee');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', description: '', thrustArea: 'Revenue Growth',
      unitOfMeasurement: '', uomType: 'min', targetValue: 0, weightage: 20,
      deadline: new Date('2025-12-31').toISOString().split('T')[0],
    },
  });

  const toggleEmployee = (id: string) =>
    setSelectedEmployees((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);

  const onSubmit = (values: FormValues) => {
    if (!user) return;
    if (selectedEmployees.length === 0) { toast.error('Select at least one employee'); return; }

    pushSharedGoal(
      {
        title: values.title,
        description: values.description,
        thrustArea: values.thrustArea,
        unitOfMeasurement: values.unitOfMeasurement,
        uomType: values.uomType,
        targetValue: values.targetValue,
        currentValue: 0,
        weightage: values.weightage,
        deadline: new Date(values.deadline),
        status: 'approved',
        performanceStatus: 'not_started',
        ownerId: '',       // overridden per recipient in store
        isShared: true,
        sharedBy: user.id,
      },
      selectedEmployees,
      user.id
    );

    toast.success(`Shared goal pushed to ${selectedEmployees.length} employee(s)`);
    setOpen(false);
    setSelectedEmployees([]);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shared Goals</h1>
          <p className="text-muted-foreground mt-1">Push departmental KPIs to multiple employees at once</p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Push Shared Goal
        </Button>
      </div>

      {sharedGoals.length === 0 ? (
        <Card className="p-12 text-center">
          <Share2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">No shared goals yet. Push a departmental KPI to get started.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sharedGoals.map((goal) => {
          const owner = Object.values(users).find((u) => u.id === goal.ownerId);
            return (
              <Card key={goal.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{goal.title}</h3>
                      <Badge variant="outline" className="text-xs gap-1">
                        <Share2 className="w-3 h-3" /> Shared
                      </Badge>
                      <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {goal.thrustArea}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                  <div className="text-right text-sm ml-4 flex-shrink-0">
                    <p className="text-muted-foreground">Assigned to</p>
                    <p className="font-medium">{owner?.name ?? goal.ownerId}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="font-medium">{goal.targetValue} {goal.unitOfMeasurement}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Weightage</p>
                    <p className="font-medium">{goal.weightage}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-medium">{formatDate(goal.deadline)}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Push Shared Goal Dialog */}
      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" /> Push Shared Goal
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Recipients can only adjust weightage. Title and target are read-only for them.
            </p>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Goal Title</FormLabel>
                  <FormControl><Input placeholder="e.g. Achieve 95% CSAT" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="thrustArea" render={({ field }) => (
                  <FormItem><FormLabel>Thrust Area</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{THRUST_AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unitOfMeasurement" render={({ field }) => (
                  <FormItem><FormLabel>Unit of Measurement</FormLabel>
                    <Select onValueChange={(v) => { field.onChange(v); form.setValue('uomType', inferUomType(v)); }} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select UoM" /></SelectTrigger></FormControl>
                      <SelectContent>{UNITS_OF_MEASUREMENT.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="targetValue" render={({ field }) => (
                  <FormItem><FormLabel>Target Value</FormLabel>
                    <FormControl><Input type="number" min={0} step="any" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="weightage" render={({ field }) => (
                  <FormItem><FormLabel>Default Weightage (%)</FormLabel>
                    <FormControl><Input type="number" min={10} max={100} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="deadline" render={({ field }) => (
                  <FormItem><FormLabel>Deadline</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Employee selector */}
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Assign to Employees
                  {selectedEmployees.length > 0 && (
                    <Badge variant="secondary">{selectedEmployees.length} selected</Badge>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {EMPLOYEES.map((emp) => (
                    <label key={emp.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedEmployees.includes(emp.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <Checkbox
                        checked={selectedEmployees.includes(emp.id)}
                        onCheckedChange={() => toggleEmployee(emp.id)}
                      />
                      <div>
                        <p className="text-sm font-medium">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.department}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Push to {selectedEmployees.length || '...'} Employee{selectedEmployees.length !== 1 ? 's' : ''}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
