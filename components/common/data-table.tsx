'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface DataTableProps {
  children: ReactNode;
  compact?: boolean;
}

export function DataTable({ children, compact = false }: DataTableProps) {
  return (
    <Card className="relative border-border/60 overflow-hidden hover:border-primary/30 transition-all duration-300">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
      
      {/* Table wrapper */}
      <div className={`relative overflow-x-auto ${compact ? 'p-4' : 'p-0'}`}>
        <table className="w-full text-sm">
          {children}
        </table>
      </div>
    </Card>
  );
}

interface DataTableHeaderProps {
  children: ReactNode;
}

export function DataTableHeader({ children }: DataTableHeaderProps) {
  return (
    <thead>
      <tr className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent hover:bg-muted/40 transition-colors">
        {children}
      </tr>
    </thead>
  );
}

interface DataTableBodyProps {
  children: ReactNode;
}

export function DataTableBody({ children }: DataTableBodyProps) {
  return (
    <tbody className="divide-y divide-border/40">
      {children}
    </tbody>
  );
}

interface DataTableRowProps {
  children: ReactNode;
  hover?: boolean;
}

export function DataTableRow({ children, hover = true }: DataTableRowProps) {
  return (
    <tr className={`${hover ? 'hover:bg-primary/3 transition-colors duration-150' : ''}`}>
      {children}
    </tr>
  );
}

interface DataTableCellProps {
  children: ReactNode;
  header?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function DataTableCell({ 
  children, 
  header = false, 
  align = 'left',
  className = ''
}: DataTableCellProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  if (header) {
    return (
      <th className={`px-6 py-4 ${alignClass} font-semibold text-xs uppercase tracking-wide text-muted-foreground ${className}`}>
        {children}
      </th>
    );
  }

  return (
    <td className={`px-6 py-4 ${alignClass} text-foreground ${className}`}>
      {children}
    </td>
  );
}
