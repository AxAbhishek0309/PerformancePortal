'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SidebarProvider } from '@/lib/sidebar-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useEscalationRunner } from '@/hooks/use-escalation-runner';
import { useSupabaseSync } from '@/hooks/use-supabase-sync';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  useEscalationRunner();
  useSupabaseSync();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Grid background — covers the entire content area */}
          <div
            className={cn(
              'pointer-events-none absolute inset-0 z-0',
              '[background-size:20px_20px]',
              '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
              'dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]'
            )}
          />
          {/* Radial fade so grid fades out toward the edges */}
          <div className="pointer-events-none absolute inset-0 z-0 bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)]" />

          <Header />

          <main className="relative z-10 flex-1 overflow-y-auto pt-20 pb-6 px-4 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
