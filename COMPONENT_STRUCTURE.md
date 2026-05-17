# Component Architecture & Modularity Guide

## Overview
This document outlines the clear modular structure of the Performance Management Portal, ensuring scalability, maintainability, and reusability.

## Directory Structure

```
components/
├── layout/
│   ├── sidebar.tsx          # Main navigation sidebar (responsive, collapsible)
│   └── header.tsx           # Top header with breadcrumbs, search, notifications
├── common/
│   ├── page-header.tsx      # Reusable page title + action section
│   ├── section-card.tsx     # Card wrapper for content sections
│   ├── empty-state.tsx      # Empty state UI component
│   └── error-boundary.tsx   # Error handling component
├── dashboard/
│   ├── stat-card.tsx        # KPI/metric card with icon and trend
│   └── metrics-grid.tsx     # Grid container for metrics (1-4 columns)
├── goals/
│   └── goal-card.tsx        # Goal display card (compact & expanded)
├── approvals/
│   └── approval-item.tsx    # Approval queue item with expand/collapse
└── ui/
    └── [shadcn components]  # Pre-built shadcn/ui components
```

## Component Descriptions

### Layout Components
- **Sidebar** - Role-aware navigation with collapse functionality
- **Header** - Breadcrumbs, search, notifications, user menu

### Common Components (Reusable across pages)
- **PageHeader** - Page title + description + action button
- **SectionCard** - Card container with title and optional action
- **EmptyState** - Display when no data exists with icon + CTA
- **ErrorBoundary** - Catch and display errors gracefully

### Dashboard Components (Metrics & widgets)
- **StatCard** - Metric display with icon, trend indicator
- **MetricsGrid** - Responsive grid (1/2/3/4 columns)

### Goal Components
- **GoalCard** - Displays goal with progress bar and metadata
  - Compact mode: Minimal card for lists
  - Expanded mode: Full details with actions

### Approval Components
- **ApprovalItem** - Expandable approval for review with actions

## Utility Modules

### `lib/goal-utils.ts`
Centralized goal-related calculations and helpers:
- `calculateProgress()` - Get goal progress percentage
- `isGoalCompleted()` - Check if goal met target
- `getStatusConfig()` - Get status badge styling
- `filterGoals()` - Filter by status, area, owner
- `calculateMetrics()` - Aggregate stats for goals

### `lib/auth-context.tsx`
Authentication state management:
- User info (name, email, role, avatar)
- Role-based access control
- Login/logout handlers

### `lib/constants.ts`
Configuration and constants:
- Navigation items
- Goal statuses and colors
- Approval statuses
- Thrust areas
- Units of measurement

### `lib/mock-data.ts`
Sample data for development:
- Goals with various statuses
- Approvals queue
- Team members
- Notifications
- Audit logs

## Component Usage Examples

### Using StatCard
```tsx
<StatCard
  label="Total Goals"
  value={12}
  icon={CheckCircle2}
  iconBg="bg-blue-100 dark:bg-blue-900"
  iconColor="text-blue-600 dark:text-blue-400"
  trend={{ value: 15, direction: 'up' }}
/>
```

### Using PageHeader
```tsx
<PageHeader
  title="Dashboard"
  description="Track your goals"
  action={{
    label: 'New Goal',
    icon: Plus,
    onClick: () => { /* action */ }
  }}
/>
```

### Using GoalCard
```tsx
// Compact view
<GoalCard goal={goalData} compact={true} />

// Expanded view
<GoalCard goal={goalData} />
```

### Using SectionCard
```tsx
<SectionCard
  title="Your Goals"
  description="Active goals"
  action={{ label: 'View All', icon: Target }}
>
  {/* Content */}
</SectionCard>
```

## Design Tokens
Colors are centralized in `app/globals.css` using CSS custom properties:
- **Primary**: Purple/Indigo (#52B2FF equivalent)
- **Secondary**: Light Blue (#92D2FF equivalent)
- **Accent**: Warm Orange/Yellow
- **Destructive**: Red for warnings
- **Semantic**: Foreground, background, muted, border

## Best Practices

1. **Use PageHeader** for all page titles
2. **Use SectionCard** to group related content
3. **Use MetricsGrid** for stat layouts
4. **Extract calculations** to `lib/goal-utils.ts`
5. **Keep components focused** - one responsibility
6. **Use TypeScript** for all components
7. **Prop drilling**: Pass max 2-3 levels, use Context otherwise
8. **Naming**: Use descriptive names (e.g., `GoalCard` not `Card`)

## Status Colors
- **Draft**: Gray
- **Submitted**: Blue
- **Returned**: Orange
- **Approved**: Green
- **Locked**: Slate
- **Pending (Approval)**: Yellow
- **Rejected**: Red

## Responsive Breakpoints
- Mobile: < 768px (Tailwind `md:`)
- Tablet: 768px - 1024px (Tailwind `lg:`)
- Desktop: > 1024px

## Icons Used
All icons from `lucide-react`:
- Navigation: LayoutDashboard, Target, CheckSquare, Users, BarChart3, Settings
- Actions: Plus, ChevronRight, ChevronDown, Check, X, ArrowRight
- Status: CheckCircle2, AlertCircle, TrendingUp
- General: Bell, Search, Menu, LogOut, Filter

## Performance Considerations
- Components are split to enable code-splitting
- PageHeader and SectionCard are lightweight wrappers
- Goal cards memoized to prevent unnecessary re-renders
- Lazy load heavy components (Analytics, Charts)

## Accessibility
- Semantic HTML elements
- ARIA labels on interactive components
- Color not sole indicator (icons + badges)
- Keyboard navigation support via Radix UI components
- Screen reader friendly with proper headings

## Future Enhancements
- Add loading skeletons for async data
- Create FormCard component for inputs
- Add TableCard for advanced sorting/filtering
- Create AlertCard for notifications
- Add ProgressTracker component for workflows
