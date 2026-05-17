'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center mb-6 ring-1 ring-primary/20">
        <Icon className="w-10 h-10 text-primary/60" />
      </div>
      <h3 className="text-2xl font-semibold text-foreground mb-3">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-center mb-8 max-w-sm font-medium">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
