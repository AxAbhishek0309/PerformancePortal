'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, MoreVertical } from 'lucide-react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  onExport?: () => void;
  footer?: ReactNode;
}

export function ChartCard({ 
  title, 
  description, 
  children,
  onExport,
  footer
}: ChartCardProps) {
  return (
    <Card className="relative p-6 border-border/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 font-medium">{description}</p>
            )}
          </div>
          {onExport && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onExport}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title="Export chart"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Chart */}
        <div className="w-full">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-border/30 pt-4">
            {footer}
          </div>
        )}
      </div>
    </Card>
  );
}
