# Project Architecture & Modularity Guide

## Project Overview
A comprehensive Performance Management & Goal Tracking Portal built with Next.js, featuring role-based dashboards, approval workflows, analytics, and enterprise-grade design.

## Architecture Overview

### Layer Structure
```
┌─────────────────────────────────────────────────────────┐
│ Pages (app/(dashboard)/*.tsx)                           │
│ User-facing routes with page-specific logic            │
├─────────────────────────────────────────────────────────┤
│ Composed Components (PageHeader, StatCard, etc.)        │
│ High-level reusable components for common patterns      │
├─────────────────────────────────────────────────────────┤
│ Base Components (Button, Card, Input, etc.)             │
│ shadcn/ui foundational components                       │
├─────────────────────────────────────────────────────────┤
│ Utilities & Hooks (goal-utils, auth-context)            │
│ Shared logic, calculations, and state management        │
├─────────────────────────────────────────────────────────┤
│ Types & Constants (types.ts, constants.ts)              │
│ TypeScript interfaces and application config            │
└─────────────────────────────────────────────────────────┘
```

## File Structure

### Core Application
```
app/
├── layout.tsx                      # Root layout with metadata
├── globals.css                     # Design tokens and theme
└── (dashboard)/                    # Main app routes
    ├── layout.tsx                  # Dashboard layout
    ├── page.tsx                    # Dashboard redirect
    ├── employee/page.tsx           # Employee dashboard
    ├── manager/page.tsx            # Manager dashboard
    ├── admin/page.tsx              # Admin dashboard
    ├── approvals/page.tsx          # Approval queue
    ├── goals/
    │   ├── page.tsx                # Goals listing
    │   └── [id]/page.tsx           # Goal details
    ├── my-goals/page.tsx           # Personal goals
    ├── team/page.tsx               # Team management
    ├── analytics/page.tsx          # Analytics dashboard
    ├── audit/page.tsx              # Audit logs
    ├── cycles/page.tsx             # Goal cycles
    └── settings/page.tsx           # User settings
```

### Components
```
components/
├── layout/
│   ├── sidebar.tsx                 # Role-aware navigation
│   └── header.tsx                  # Top header bar
├── common/
│   ├── page-header.tsx             # Page title + action
│   ├── section-card.tsx            # Content section wrapper
│   ├── empty-state.tsx             # Empty state UI
│   └── error-boundary.tsx          # Error handling
├── dashboard/
│   ├── stat-card.tsx               # Metric card
│   └── metrics-grid.tsx            # Metric grid layout
├── goals/
│   └── goal-card.tsx               # Goal display card
├── approvals/
│   └── approval-item.tsx           # Approval list item
└── ui/                             # shadcn/ui components
```

### Libraries & Utilities
```
lib/
├── types.ts                        # TypeScript interfaces
├── constants.ts                    # Application constants
├── auth-context.tsx                # Auth state management
├── mock-data.ts                    # Development data
├── goal-utils.ts                   # Goal calculations
└── utils.ts                        # Tailwind cn utility
```

### Documentation
```
├── COMPONENT_STRUCTURE.md          # Component guide
├── UI_ENHANCEMENTS.md              # UI improvements
├── ARCHITECTURE.md                 # This file
└── README.md                       # Project README
```

## Component Architecture

### Component Types

#### 1. Layout Components
- **Sidebar**: Collapsible navigation with role awareness
- **Header**: Breadcrumbs, search, notifications
- **Responsibility**: App-wide navigation and state

#### 2. Page Components
- **Employee/Manager/Admin Dashboard**: Dashboard entry points
- **Approvals, Goals, Team, etc.**: Feature pages
- **Responsibility**: Page logic and data assembly

#### 3. Composed Components
High-level, reusable components built from base components:

| Component | Purpose | Usage |
|-----------|---------|-------|
| **StatCard** | Display metrics with icons and trends | Dashboards, analytics |
| **GoalCard** | Display goal with progress (compact/expanded) | Goals, dashboards |
| **PageHeader** | Page title + description + action | All pages |
| **SectionCard** | Group related content with title | Dashboard sections |
| **EmptyState** | Placeholder when no data | Lists, empty views |
| **MetricsGrid** | Responsive grid for metrics | Dashboards |
| **ApprovalItem** | Expandable approval item | Approvals page |

#### 4. Base Components
- shadcn/ui components: Button, Card, Badge, Input, Dropdown, etc.
- **Responsibility**: UI primitives

### Composition Pattern
```
Page
├── PageHeader
│   ├── Button
│   └── Optional Icon
├── MetricsGrid (responsive columns)
│   └── StatCard (repeats)
│       ├── Icon
│       ├── Metric value
│       └── Optional trend
└── SectionCard
    ├── Title
    ├── Optional action button
    └── Content (GoalCards, tables, etc.)
```

## Data Flow

### Authentication Flow
```
App Loads
  ↓
AuthContext Provider wraps app
  ↓
Check localStorage/session for user
  ↓
Set user state with role
  ↓
Components access auth via useAuth()
  ↓
Role-specific navigation & features
```

### Goal Data Flow
```
Mock Data (lib/mock-data.ts)
  ↓
Goal fetched/filtered in page
  ↓
calculateMetrics() from goal-utils.ts
  ↓
Data passed to StatCard/GoalCard/etc.
  ↓
Components display with progress bars & badges
```

### Component Prop Flow
```
Page (assembles data)
  ↓
Passes data to PageHeader
Passes data to StatCards
Passes data to GoalCards
  ↓
Components render UI
  ↓
User interaction triggers callbacks
```

## State Management

### Global State
- **AuthContext**: User, role, login/logout
- **Sidebar**: Collapse state (localStorage possible)

### Local State
- **ApprovalItem**: Expanded state
- **Header**: Notifications dropdown open
- **Dashboard pages**: No complex state (mock data)

### Future State
- Redux/Zustand when needed
- Mutation handling for API calls
- Form state management

## Design System

### Color Tokens
All colors defined in `app/globals.css` as CSS custom properties:
- Primary, Secondary, Accent
- Foreground, Background, Card, Muted
- Status colors: Destructive, Success, Warning
- Semantic colors maintained across light/dark

### Typography
- **Font**: Geist (sans), Geist Mono (monospace)
- **Scale**: Base 16px with Tailwind ratios
- **Weights**: 400, 500, 600, 700 used appropriately

### Spacing
- **Scale**: 4px increments (Tailwind standard)
- **Consistency**: Using Tailwind spacing utilities
- **Gaps**: Prefer gap classes over margin combinations

### Border & Shadow
- **Border radius**: 0.5rem (8px) for cards
- **Border color**: --border token
- **Shadows**: Tailwind defaults, enhanced on hover

## Modularity Principles

### Single Responsibility
Each component does one thing well:
- StatCard: Display a metric
- GoalCard: Display a goal
- PageHeader: Display page title + action

### Reusability
Components work across multiple pages:
- StatCard used in 3+ dashboards
- PageHeader used in all pages
- GoalCard used in 5+ locations

### Composition Over Inheritance
Build complex UIs by combining simple components:
```tsx
<PageHeader title="Goals" />
<MetricsGrid columns={4}>
  <StatCard ... />
</MetricsGrid>
<SectionCard title="My Goals">
  {GOALS.map(goal => <GoalCard key={goal.id} goal={goal} />)}
</SectionCard>
```

### Clear Props Interface
All components have typed props:
```tsx
interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; direction: 'up' | 'down' };
  // ... other props
}
```

## Code Organization Principles

### Colocation
- Related functionality stays together
- Components with their types
- Utilities with their tests (future)

### Naming Conventions
- Components: PascalCase (GoalCard, StatCard)
- Utilities: camelCase (calculateProgress)
- Types: PascalCase (Goal, Approval)
- Constants: UPPER_CASE (NAV_ITEMS)

### Import Organization
```tsx
// 1. React imports
import { useState } from 'react';

// 2. Next.js imports
import Link from 'next/link';

// 3. External packages
import { Plus } from 'lucide-react';

// 4. Internal components
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/page-header';

// 5. Utilities & types
import { calculateMetrics } from '@/lib/goal-utils';
import { Goal } from '@/lib/types';
```

## Scalability Strategy

### Adding New Features
1. **Create utility functions** in `lib/goal-utils.ts` (if needed)
2. **Build specific components** in appropriate subdirectory
3. **Compose page** using PageHeader, MetricsGrid, SectionCard
4. **Add route** in `app/(dashboard)/feature/page.tsx`
5. **Update navigation** in `lib/constants.ts`

### Adding New Roles
1. **Create dashboard** at `app/(dashboard)/[role]/page.tsx`
2. **Update constants** with role-specific nav items
3. **Add filters** in goal-utils for role-specific data
4. **Update AuthContext** with new role

### Database Integration
1. **Replace mock data** in pages with API calls
2. **Add data fetching** hooks (React Query/SWR)
3. **Update types** if needed
4. **Add error handling** and loading states
5. **Cache strategically** using Next.js data cache

## Performance Considerations

### Code Splitting
- Each route is separate chunk
- Components lazy-loaded as needed
- Analytics/charts loaded dynamically (future)

### Re-render Optimization
- StatCard: Pure presentation, no hooks
- GoalCard: Memoizable if passed heavy objects
- Sidebar: Local state, doesn't trigger parent re-renders

### Asset Optimization
- Icons: SVG from lucide-react (lightweight)
- Images: Optimized with next/image (future)
- Fonts: System fonts + Geist (minimal)

## Security Considerations

### Current (Mock)
- No real auth, mock user in context
- No sensitive data

### Future Implementation
- Secure token storage (httpOnly cookies)
- CSRF protection
- Input validation & sanitization
- Rate limiting
- Audit logging (exists in UI)

## Testing Strategy

### Unit Tests (Recommended)
- Utility functions: `calculateProgress`, `filterGoals`
- Component props: Various prop combinations

### Integration Tests
- Page rendering with different roles
- Navigation between sections
- Form submissions

### E2E Tests
- User flows: Login → Create goal → Approve
- Search and filter functionality

## Accessibility

### Current Implementation
- Semantic HTML (header, nav, main)
- Icon + text combinations (not icon alone)
- Proper heading hierarchy
- Color + other indicators for status

### Planned Improvements
- ARIA labels on interactive elements
- Keyboard navigation testing
- Screen reader optimization
- Focus management in modals

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Mock data replaced with real API
- [ ] Authentication implemented
- [ ] Error boundaries added
- [ ] Analytics tracking added
- [ ] Error logging configured
- [ ] Performance optimized
- [ ] Accessibility verified
- [ ] Security audit passed
- [ ] Documentation updated

## Quick Reference

### Key Directories
- `app/(dashboard)` - Pages
- `components/common` - Reusable utilities
- `components/dashboard` - Dashboard components
- `lib` - Logic and types

### Key Files
- `lib/types.ts` - All TypeScript interfaces
- `lib/constants.ts` - Nav items and status config
- `lib/goal-utils.ts` - Goal calculations
- `app/globals.css` - Theme and tokens

### Add New StatCard
```tsx
<StatCard
  label="Metric Name"
  value={metricValue}
  icon={IconName}
  trend={{ value: 10, direction: 'up' }}
/>
```

### Add New Page
1. Create file: `app/(dashboard)/feature/page.tsx`
2. Use PageHeader, MetricsGrid, SectionCard
3. Add to NAV_ITEMS in constants.ts
4. Set roles who can see it

This architecture provides a solid foundation for rapid development while maintaining code quality and consistency.
