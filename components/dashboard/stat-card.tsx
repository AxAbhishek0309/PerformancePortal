'use client';

import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  description?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconBg = 'bg-blue-100 dark:bg-blue-900',
  iconColor = 'text-blue-600 dark:text-blue-400',
  trend,
  description,
}: StatCardProps) {
  return (
    <Card className="relative p-6 flex flex-col gap-4 border border-border/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group overflow-hidden">
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Content */}
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
          <div className="flex items-baseline gap-3 mt-3">
            <p className="text-4xl font-bold text-foreground">{value}</p>
            {trend && (
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${trend.direction === 'up' ? 'bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-red-500/15 text-red-700 dark:text-red-400'}`}>
                {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-2 font-medium">{description}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}
