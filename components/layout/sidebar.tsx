'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, Zap, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNavItemsByRole } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  if (!role) return null;

  const navItems = getNavItemsByRole(role);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="relative flex items-center justify-between px-4 py-4 border-b border-sidebar-border/30">
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar-primary/8 to-transparent pointer-events-none" />
        <Link href="/" className="relative flex items-center gap-3 font-semibold text-lg group" onClick={() => setIsMobileOpen(false)}>
          <div className="w-8 h-8 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-lg flex items-center justify-center text-sidebar-primary-foreground font-bold shadow-lg flex-shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <span className="bg-gradient-to-r from-sidebar-foreground to-sidebar-foreground/70 bg-clip-text text-transparent">
              GoalTrack
            </span>
          )}
        </Link>

        {/* Desktop collapse toggle in header */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="relative hidden lg:flex p-1.5 hover:bg-sidebar-primary/20 rounded-lg transition-colors duration-200 text-sidebar-foreground/50 hover:text-sidebar-foreground"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="relative lg:hidden p-1.5 hover:bg-sidebar-primary/20 rounded-lg transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <div className="px-3 pt-3">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full flex items-center justify-center p-2 hover:bg-sidebar-primary/20 rounded-lg transition-colors duration-200 text-sidebar-foreground/50 hover:text-sidebar-foreground"
            title="Expand sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg relative group transition-all duration-200',
                active
                  ? 'bg-gradient-to-r from-sidebar-primary/20 to-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/30 shadow-sm'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-primary/10'
              )}
              onClick={() => setIsMobileOpen(false)}
              title={isCollapsed ? item.title : undefined}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-sidebar-primary to-sidebar-primary/50 rounded-r-lg" />
              )}
              <Icon className={cn('w-5 h-5 flex-shrink-0 transition-all duration-200', active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100')} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                  {item.badge && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-sidebar-primary/80 text-sidebar-primary-foreground shadow-md">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {isCollapsed && item.badge && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold rounded-full bg-sidebar-primary text-sidebar-primary-foreground shadow-md">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      {user && !isCollapsed && (
        <div className="relative border-t border-sidebar-border/30 p-4 space-y-3 bg-gradient-to-t from-sidebar-primary/5 to-transparent">
          <div className="px-3 py-3 rounded-lg border border-sidebar-primary/20 bg-gradient-to-br from-sidebar-primary/10 to-sidebar-accent/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-accent flex items-center justify-center text-sidebar-primary-foreground text-sm font-semibold shadow-lg flex-shrink-0">
              {user.avatar || user.name[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{user.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start border-sidebar-border/30 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-primary/10"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      )}

      {/* Collapsed user avatar */}
      {user && isCollapsed && (
        <div className="border-t border-sidebar-border/30 p-3 flex flex-col items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-accent flex items-center justify-center text-sidebar-primary-foreground text-sm font-semibold shadow-lg" title={user.name}>
            {user.avatar || user.name[0].toUpperCase()}
          </div>
          <button onClick={logout} className="p-1.5 hover:bg-sidebar-primary/20 rounded-lg transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border/50 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
        style={{ boxShadow: '2px 0 24px rgba(0,0,0,0.08)' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside
            className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border/50 z-40 flex flex-col lg:hidden"
            style={{ boxShadow: '2px 0 24px rgba(0,0,0,0.15)' }}
          >
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Desktop spacer */}
      <div className={cn('hidden lg:block flex-shrink-0 transition-all duration-300', isCollapsed ? 'w-16' : 'w-64')} />
    </>
  );
}
