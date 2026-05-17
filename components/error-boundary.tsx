'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
  error?: Error & { digest?: string };
  reset?: () => void;
}

export function ErrorBoundary({ error, reset }: Props) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="max-w-md w-full text-center px-4 py-12">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong!</h1>
        <p className="text-muted-foreground mb-6">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="space-y-2">
          <Button onClick={() => reset?.()} className="w-full">
            Try again
          </Button>
          <Button variant="outline" className="w-full">
            Go back home
          </Button>
        </div>
      </div>
    </div>
  );
}
