import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  FileText,
  Zap,
  ClipboardCheck,
  AlertTriangle,
  Share2,
  LucideIcon,
} from 'lucide-react';

export type UserRole = 'employee' | 'manager' | 'admin';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard',         href: '/',           icon: LayoutDashboard, roles: ['employee', 'manager', 'admin'] },
  { title: 'My Goals',          href: '/my-goals',   icon: Target,          roles: ['employee', 'manager'] },
  { title: 'Team Goals',        href: '/goals',      icon: Target,          roles: ['manager', 'admin'] },
  { title: 'Approvals',         href: '/approvals',  icon: CheckSquare,     roles: ['manager', 'admin'] },
  { title: 'Team',              href: '/team',       icon: Users,           roles: ['manager', 'admin'] },
  { title: 'Analytics',         href: '/analytics',  icon: BarChart3,       roles: ['manager', 'admin'] },
  { title: 'Completion',        href: '/completion', icon: ClipboardCheck,  roles: ['manager', 'admin'] },
  { title: 'Shared Goals',      href: '/shared',     icon: Share2,          roles: ['manager', 'admin'] },
  { title: 'Escalations',       href: '/escalations',icon: AlertTriangle,   roles: ['admin'] },
  { title: 'Cycles',            href: '/cycles',     icon: Zap,             roles: ['admin'] },
  { title: 'Audit Logs',        href: '/audit',      icon: FileText,        roles: ['admin'] },
  { title: 'Settings',          href: '/settings',   icon: Settings,        roles: ['employee', 'manager', 'admin'] },
];

export const getNavItemsByRole = (role: UserRole): NavItem[] =>
  NAV_ITEMS.filter((item) => item.roles.includes(role));

export const THRUST_AREAS = [
  'Revenue Growth',
  'Cost Optimization',
  'Customer Success',
  'Innovation',
  'Operational Excellence',
] as const;

export const GOAL_STATUSES = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-800' },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  returned:  { label: 'Returned',  color: 'bg-orange-100 text-orange-800' },
  approved:  { label: 'Approved',  color: 'bg-green-100 text-green-800' },
  locked:    { label: 'Locked',    color: 'bg-slate-100 text-slate-800' },
} as const;

export const APPROVAL_STATUSES = {
  pending:  { label: 'Pending',  color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  returned: { label: 'Returned', color: 'bg-orange-100 text-orange-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
} as const;

export const UNITS_OF_MEASUREMENT = [
  'Percentage (%)',
  'Count',
  'Amount ($)',
  'Hours',
  'Days',
  'Score',
  'Rating',
  'Custom',
] as const;

// Updated to 2025-2026 timeline
export const QUARTERS = [
  { label: 'Q1 2025', value: 'Q1-2025' },
  { label: 'Q2 2025', value: 'Q2-2025' },
  { label: 'Q3 2025', value: 'Q3-2025' },
  { label: 'Q4 2025', value: 'Q4-2025' },
  { label: 'Q1 2026', value: 'Q1-2026' },
  { label: 'Q2 2026', value: 'Q2-2026' },
] as const;
