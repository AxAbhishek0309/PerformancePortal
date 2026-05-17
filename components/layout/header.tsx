'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, ChevronRight, Menu, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import { useStore, selectUnreadNotifications } from '@/lib/store';
import { cn, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/lib/types';

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isCollapsed, setIsCollapsed, setIsMobileOpen } = useSidebar();
  const router = useRouter();

  // Live store notifications (filtered to current user)
  const allNotifications = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAllRead = useStore((s) => s.markAllNotificationsRead);
  const addNotification = useStore((s) => s.addNotification);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const userNotifications = allNotifications
    .filter((n) => n.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  // ── Supabase Realtime — subscribe to new notifications for this user ────────
  useEffect(() => {
    if (!user) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const isConfigured = supabaseUrl && supabaseUrl !== 'https://your-project.supabase.co';
    if (!isConfigured) return;

    // Clean up any previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          const incoming: Notification = {
            id: r.id as string,
            userId: r.user_id as string,
            type: r.type as Notification['type'],
            title: r.title as string,
            message: r.message as string,
            relatedId: r.related_id as string | undefined,
            read: Boolean(r.read),
            createdAt: new Date(r.created_at as string),
          };
          // Only add if not already in store (avoid duplicates from optimistic updates)
          const existing = useStore.getState().notifications.find((n) => n.id === incoming.id);
          if (!existing) addNotification(incoming);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get breadcrumb from pathname
  const getBreadcrumb = () => {
    const segments = pathname
      .split('/')
      .filter((s) => s && s !== 'dashboard')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '));
    return segments;
  };

  const breadcrumbs = getBreadcrumb();

  return (
    <header className={cn(
      'fixed top-0 right-0 h-16 bg-background border-b border-border/50 z-30 backdrop-blur-sm bg-background/80 transition-all duration-300',
      isCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-64'
    )} style={{
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)'
    }}>
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Sidebar toggle + Breadcrumbs */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 flex-shrink-0"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          {/* Desktop expand (only when collapsed) */}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8 flex-shrink-0"
              onClick={() => setIsCollapsed(false)}
              title="Expand sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <span className="text-sm text-muted-foreground hidden md:inline font-medium">Dashboard</span>
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors cursor-pointer">
                {crumb}
              </span>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Search goals, people..."
              className="pl-9 h-9 text-sm bg-muted/40 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200 hover:bg-muted/60"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-muted/60 transition-all duration-200"
              >
                <Bell className="w-5 h-5 text-foreground/70 hover:text-foreground transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-foreground gap-1"
                    onClick={() => user && markAllRead(user.id)}
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              {userNotifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                userNotifications.slice(0, 5).map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className={cn(
                      'flex flex-col gap-1 cursor-pointer py-2 items-start',
                      !notif.read && 'bg-primary/5'
                    )}
                    onClick={() => !notif.read && markRead(notif.id)}
                  >
                    <div className="flex items-start justify-between w-full gap-2">
                      <p className={cn('text-sm', !notif.read ? 'font-semibold' : 'font-medium')}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="mt-0.5 flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground/60">
                      {formatDate(notif.createdAt)}
                    </p>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-sm text-center justify-center text-primary"
                onClick={() => router.push('/settings')}
              >
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg hover:bg-muted/60 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-sm font-semibold shadow-md hover:shadow-lg transition-shadow">
                    {user.avatar || user.name[0].toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>Preferences</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
