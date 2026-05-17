'use client';

import { Goal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { TrendingUp, Target, Zap } from 'lucide-react';
import { calculateProgress, getStatusConfig } from '@/lib/goal-utils';

interface GoalCardProps {
  goal: Goal;
  compact?: boolean;
}

export function GoalCard({ goal, compact = false }: GoalCardProps) {
  const progress = calculateProgress(goal);
  const statusConfig = getStatusConfig(goal.status);

  if (compact) {
    return (
      <Link href={`/goals/${goal.id}`}>
        <div className="relative p-4 border border-border/60 rounded-lg hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 cursor-pointer group overflow-hidden">
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Content */}
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {goal.title}
              </h3>
              <Badge variant="secondary" className={`${statusConfig.bg} ${statusConfig.text} text-xs`}>
                {goal.status}
              </Badge>
            </div>
            <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2.5 text-xs text-muted-foreground">
              <span className="font-medium">{progress}%</span>
              <span className="text-muted-foreground/70">{goal.currentValue} / {goal.targetValue}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
      <div className="border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
              {goal.title}
            </h3>
            <Badge variant="secondary" className={`${statusConfig.bg} ${statusConfig.text}`}>
              {goal.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{goal.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Thrust Area</p>
          <p className="text-sm font-medium text-foreground">{goal.thrustArea}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Unit</p>
          <p className="text-sm font-medium text-foreground">{goal.unitOfMeasurement}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Weightage</p>
          <p className="text-sm font-medium text-foreground">{goal.weightage}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Progress</p>
          <div className="flex items-center gap-1">
            <p className="text-sm font-bold text-foreground">{progress}%</p>
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-foreground">Progress</p>
          <p className="text-xs text-muted-foreground">
            {goal.currentValue} / {goal.targetValue} {goal.unitOfMeasurement}
          </p>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/goals/${goal.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
        <Link href={`/goals/${goal.id}`}>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Quick view">
            <Zap className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
