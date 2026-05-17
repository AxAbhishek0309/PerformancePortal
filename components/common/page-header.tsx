'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: LucideIcon;
    onClick?: () => void;
    href?: string;
  };
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  action,
  children,
}: PageHeaderProps) {
  const ActionIcon = action?.icon;

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="flex-1 min-w-0">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="h-1 w-1 rounded-full bg-gradient-to-r from-primary to-accent" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dashboard</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-3 text-base font-medium max-w-2xl">{description}</p>
        )}
      </div>
      {(action || children) && (
        <div className="flex items-center gap-3 flex-wrap">
          {action && (
            <Button
              onClick={action.onClick}
              className="gap-2 whitespace-nowrap shadow-lg hover:shadow-xl transition-shadow"
            >
              {ActionIcon && <ActionIcon className="w-4 h-4" />}
              {action.label}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
