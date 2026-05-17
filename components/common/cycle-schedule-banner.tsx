'use client';

import { Calendar, Lock, Unlock } from 'lucide-react';
import { getActiveWindows, getScheduleStatusMessage } from '@/lib/cycle-schedule';

export function CycleScheduleBanner() {
  const active = getActiveWindows();
  const message = getScheduleStatusMessage();

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
        active.length > 0
          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100'
          : 'bg-muted/50 border-border text-muted-foreground'
      }`}
    >
      {active.length > 0 ? (
        <Unlock className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
      ) : (
        <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
      )}
      <div className="min-w-0">
        <p className="font-medium flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          Performance cycle
        </p>
        <p className="mt-0.5 text-xs opacity-90">{message}</p>
      </div>
    </div>
  );
}
