'use client';

import { ReactNode } from 'react';

interface MetricsGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export function MetricsGrid({
  children,
  columns = 4,
}: MetricsGridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${colsClass[columns]} gap-4`}>
      {children}
    </div>
  );
}
