'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
}

export function SectionCard({
  title,
  description,
  children,
  action,
}: SectionCardProps) {
  const ActionIcon = action?.icon;

  return (
    <Card className="relative p-6 border border-border/60 hover:border-primary/30 transition-all duration-300 overflow-hidden group">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1.5 font-medium">{description}</p>
            )}
          </div>
          {action && (
            <Button
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              className="gap-2 hover:bg-primary/10 transition-all duration-200"
            >
              {ActionIcon && <ActionIcon className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />}
              <span className="text-xs">{action.label}</span>
            </Button>
          )}
        </div>
        {children}
      </div>
    </Card>
  );
}
