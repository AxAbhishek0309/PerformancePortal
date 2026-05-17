'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, X } from 'lucide-react';
import { QUARTERS } from '@/lib/constants';
import { CYCLE_WINDOWS, getActiveWindows, getScheduleStatusMessage } from '@/lib/cycle-schedule';
import { CycleScheduleBanner } from '@/components/common/cycle-schedule-banner';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface Cycle {
  id: string;
  name: string;
  status: 'active' | 'upcoming' | 'closed';
  startDate: Date;
  endDate: Date;
  goals: number;
  completion: number;
}

const INITIAL_CYCLES: Cycle[] = [
  { id: 'cycle-1', name: 'Q1 2024', status: 'active', startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31'), goals: 148, completion: 78 },
  { id: 'cycle-2', name: 'Q2 2024', status: 'upcoming', startDate: new Date('2024-04-01'), endDate: new Date('2024-06-30'), goals: 0, completion: 0 },
];

export default function CyclesPage() {
  const router = useRouter();
  const [cycles, setCycles] = useState<Cycle[]>(INITIAL_CYCLES);
  const [newCycleOpen, setNewCycleOpen] = useState(false);
  const [cycleName, setCycleName] = useState('');
  const [cycleStart, setCycleStart] = useState('');
  const [cycleEnd, setCycleEnd] = useState('');

  const handleCreateCycle = () => {
    if (!cycleName || !cycleStart || !cycleEnd) {
      toast.error('Please fill in all fields');
      return;
    }
    const newCycle: Cycle = {
      id: `cycle-${Date.now()}`,
      name: cycleName,
      status: 'upcoming',
      startDate: new Date(cycleStart),
      endDate: new Date(cycleEnd),
      goals: 0,
      completion: 0,
    };
    setCycles((prev) => [...prev, newCycle]);
    setNewCycleOpen(false);
    setCycleName(''); setCycleStart(''); setCycleEnd('');
    toast.success(`Cycle "${cycleName}" created`);
  };

  const handleQuarterSelect = (quarter: { label: string; value: string }) => {
    const existing = cycles.find((c) => c.name === quarter.label);
    if (existing) {
      toast.info(`${quarter.label} cycle already exists`);
    } else {
      setCycleName(quarter.label);
      setNewCycleOpen(true);
    }
  };

  const brdActive = getActiveWindows();

  return (
    <div className="space-y-6">
      <CycleScheduleBanner />

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">BRD §2.3 — Official Schedule</h2>
        <p className="text-sm text-muted-foreground mb-4">{getScheduleStatusMessage()}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CYCLE_WINDOWS.map((w) => {
            const isActive = brdActive.some((a) => a.phase === w.phase);
            return (
              <div
                key={w.phase}
                className={`p-4 rounded-lg border ${isActive ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border'}`}
              >
                <p className="font-medium text-foreground">{w.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {w.startMonth}/{w.startDay} – {w.endMonth}/{w.endDay} (each year)
                </p>
                {isActive && (
                  <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">OPEN</Badge>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Goal Cycles</h1>
          <p className="text-muted-foreground mt-1">Manage performance review cycles</p>
        </div>
        <Button className="gap-2" onClick={() => setNewCycleOpen(true)}>
          <Plus className="w-4 h-4" />
          New Cycle
        </Button>
      </div>

      <div className="space-y-4">
        {cycles.map((cycle) => (
          <Card key={cycle.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{cycle.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(cycle.startDate)} — {formatDate(cycle.endDate)}
                  </p>
                </div>
              </div>
              <Badge className={
                cycle.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : cycle.status === 'closed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }>
                {cycle.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 border-y border-border">
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">Goals</p>
                <p className="text-2xl font-bold mt-1">{cycle.goals}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">Completion</p>
                <p className="text-2xl font-bold mt-1">{cycle.completion}%</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">Duration</p>
                <p className="text-sm font-medium mt-1">
                  {Math.round((cycle.endDate.getTime() - cycle.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => router.push('/goals')}>Manage Goals</Button>
              <Button variant="ghost" onClick={() => router.push('/analytics')}>View Reports</Button>
              {cycle.status !== 'closed' && (
                <Button
                  variant="ghost"
                  className="text-muted-foreground ml-auto"
                  onClick={() => {
                    setCycles((prev) => prev.map((c) => c.id === cycle.id ? { ...c, status: 'closed' } : c));
                    toast.success(`Cycle "${cycle.name}" closed`);
                  }}
                >
                  <X className="w-4 h-4 mr-1" /> Close Cycle
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Quarter shortcuts */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Create from Quarter</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUARTERS.map((quarter) => {
            const exists = cycles.some((c) => c.name === quarter.label);
            return (
              <Button
                key={quarter.value}
                variant={exists ? 'secondary' : 'outline'}
                className="justify-center"
                onClick={() => handleQuarterSelect(quarter)}
                disabled={exists}
              >
                {quarter.label}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* New Cycle Dialog */}
      <Dialog open={newCycleOpen} onOpenChange={(v) => !v && setNewCycleOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Cycle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cycle Name</Label>
              <Input className="mt-1" placeholder="e.g. Q3 2025" value={cycleName} onChange={(e) => setCycleName(e.target.value)} />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input className="mt-1" type="date" value={cycleStart} onChange={(e) => setCycleStart(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input className="mt-1" type="date" value={cycleEnd} onChange={(e) => setCycleEnd(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCycleOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCycle}>Create Cycle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
