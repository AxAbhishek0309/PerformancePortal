# Developer Quick Start Guide

## Getting Started

### Understanding the Project Structure
This is a **modular, component-based** Performance Management Portal. The key principle: **Compose pages from reusable components**.

### Key Documentation
- **ARCHITECTURE.md** - Full architecture and data flow
- **COMPONENT_STRUCTURE.md** - Component library and usage
- **UI_ENHANCEMENTS.md** - Design improvements and refactoring

## Common Tasks

### 1. Adding a Stat Card to a Dashboard

**Use StatCard** instead of creating Card manually:

```tsx
import { StatCard } from '@/components/dashboard/stat-card';
import { CheckCircle2 } from 'lucide-react';

// In your component:
<StatCard
  label="Total Goals"
  value={12}
  icon={CheckCircle2}
  iconBg="bg-blue-100 dark:bg-blue-900"
  iconColor="text-blue-600 dark:text-blue-400"
  trend={{ value: 15, direction: 'up' }}
  description="Active goals"
/>
```

**Props:**
- `label`: The metric name (string)
- `value`: The metric value (string | number)
- `icon`: lucide-react icon component
- `iconBg`: Background color for icon (Tailwind class)
- `iconColor`: Icon color (Tailwind class)
- `trend`: (Optional) Trend data with value and direction
- `description`: (Optional) Sub-text below value

### 2. Creating a Page Title + Action Button

**Use PageHeader** instead of manually building:

```tsx
import { PageHeader } from '@/components/common/page-header';
import { Plus } from 'lucide-react';

<PageHeader
  title="My Goals"
  description="Track your OKRs"
  action={{
    label: 'New Goal',
    icon: Plus,
    onClick: () => { /* handler */ }
  }}
/>
```

**Props:**
- `title`: Page title (required)
- `description`: Optional subtitle
- `action`: Optional action button with label, icon, onClick

### 3. Displaying Goals

**Use GoalCard** for goal displays:

```tsx
import { GoalCard } from '@/components/goals/goal-card';

// Compact view (in lists):
<GoalCard goal={goalData} compact={true} />

// Expanded view (full details):
<GoalCard goal={goalData} />
```

### 4. Creating a Metrics Grid

**Use MetricsGrid** for responsive layouts:

```tsx
import { MetricsGrid } from '@/components/dashboard/metrics-grid';

<MetricsGrid columns={4}>
  <StatCard ... />
  <StatCard ... />
  <StatCard ... />
  <StatCard ... />
</MetricsGrid>
```

**Props:**
- `columns`: 1, 2, 3, or 4 (responsive: 1 on mobile, expands on larger screens)
- `children`: StatCard components

### 5. Grouping Content in Sections

**Use SectionCard** for content sections:

```tsx
import { SectionCard } from '@/components/common/section-card';

<SectionCard
  title="Your Goals"
  description="Active goals aligned with Q2 2024"
  action={{
    label: 'View All',
    icon: Target,
    onClick: () => { /* handler */ }
  }}
>
  {/* Your content here */}
</SectionCard>
```

### 6. Showing Empty States

**Use EmptyState** when no data:

```tsx
import { EmptyState } from '@/components/common/empty-state';
import { Target } from 'lucide-react';

{goals.length === 0 ? (
  <EmptyState
    icon={Target}
    title="No goals yet"
    description="Create your first goal to get started"
    action={{
      label: 'Create Goal',
      icon: Plus,
      onClick: handleCreateGoal
    }}
  />
) : (
  // Content
)}
```

### 7. Calculating Goal Metrics

**Use goal-utils** for calculations:

```tsx
import { calculateMetrics, calculateProgress, isGoalCompleted } from '@/lib/goal-utils';

// Calculate all metrics at once:
const metrics = calculateMetrics(goals);
// Returns: { total, completed, avgProgress, totalWeightage, completionRate }

// Calculate progress for single goal:
const progress = calculateProgress(goal);  // Returns 0-100

// Check if goal met target:
const isComplete = isGoalCompleted(goal);  // Returns boolean
```

### 8. Getting Status Config

**Use getStatusConfig** for status styling:

```tsx
import { getStatusConfig } from '@/lib/goal-utils';

const status = 'approved';
const config = getStatusConfig(status);
// Returns: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' }

<Badge className={`${config.bg} ${config.text}`}>
  {status}
</Badge>
```

### 9. Adding Navigation Item

Edit `lib/constants.ts`:

```typescript
export const NAV_ITEMS: NavItem[] = [
  // ... existing items
  {
    title: 'My New Feature',
    href: '/my-feature',
    icon: MyIcon,
    roles: ['employee', 'manager'],
    badge: '5', // optional
  },
];
```

Then create page at `app/(dashboard)/my-feature/page.tsx`.

### 10. Accessing User Info & Role

```tsx
import { useAuth } from '@/lib/auth-context';

export function MyComponent() {
  const { user, role } = useAuth();
  
  return (
    <div>
      <p>User: {user?.name}</p>
      <p>Role: {role}</p>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Full Dashboard Page

```tsx
'use client';

import { PageHeader } from '@/components/common/page-header';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { StatCard } from '@/components/dashboard/stat-card';
import { SectionCard } from '@/components/common/section-card';
import { GoalCard } from '@/components/goals/goal-card';
import { Plus, Target } from 'lucide-react';

export default function DashboardPage() {
  // Get your data here
  const goals = getGoals();
  const metrics = calculateMetrics(goals);

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Overview"
        action={{ label: 'New Goal', icon: Plus }}
      />

      {/* Metrics */}
      <MetricsGrid columns={4}>
        <StatCard label="Total" value={metrics.total} icon={Target} />
        {/* More cards */}
      </MetricsGrid>

      {/* Content Sections */}
      <SectionCard title="Goals" description="Active goals">
        <div className="grid gap-4">
          {goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
```

### Pattern 2: Using Utilities

```tsx
import { calculateMetrics, filterGoals } from '@/lib/goal-utils';

// Filter goals
const myGoals = filterGoals(allGoals, { ownerId: 'emp-001' });

// Get metrics
const stats = calculateMetrics(myGoals);
// Use: stats.total, stats.avgProgress, stats.completionRate, etc.
```

### Pattern 3: Conditional Rendering

```tsx
{data.length === 0 ? (
  <EmptyState
    icon={MyIcon}
    title="No data"
    action={{ label: 'Create', icon: Plus }}
  />
) : (
  <div className="grid gap-4">
    {data.map(item => (
      <Card key={item.id}>{/* content */}</Card>
    ))}
  </div>
)}
```

## File Location Reference

| What | Where |
|------|-------|
| Page components | `app/(dashboard)/[feature]/page.tsx` |
| Reusable components | `components/[category]/` |
| Navigation items | `lib/constants.ts` |
| Type definitions | `lib/types.ts` |
| Utility functions | `lib/goal-utils.ts` |
| Authentication | `lib/auth-context.tsx` |
| Mock data | `lib/mock-data.ts` |
| Design tokens | `app/globals.css` |

## Component Checklist

When creating a new component, ensure:

- [ ] Has TypeScript interface for props
- [ ] Named with PascalCase
- [ ] Located in appropriate subdirectory
- [ ] Has clear, focused responsibility
- [ ] Reusable (not page-specific)
- [ ] Documented with JSDoc comments
- [ ] Uses Tailwind classes (no inline styles)
- [ ] Accessible (semantic HTML, ARIA if needed)
- [ ] Works in light and dark modes

## Page Creation Checklist

When creating a new page:

- [ ] Created at `app/(dashboard)/[feature]/page.tsx`
- [ ] Uses `PageHeader` for title
- [ ] Uses existing components (StatCard, GoalCard, etc.)
- [ ] Added to NAV_ITEMS in `constants.ts`
- [ ] Handles role-based access
- [ ] Handles empty states
- [ ] Has proper spacing (use `space-y-8`)
- [ ] Responsive (mobile-first)

## Debugging Tips

### Check Component Props
```tsx
// Create test page to verify component
<StatCard
  label="Test"
  value={99}
  icon={Target}
/>
```

### Use Console Logging
```tsx
console.log('[v0] Data:', data);
console.log('[v0] Metrics:', metrics);
```

### Verify Colors
Check `app/globals.css` for available colors:
- Primary, Secondary, Accent
- Foreground, Background, Muted
- Destructive

### Check Responsive Breakpoints
- Mobile: `<768px`
- Tablet: `768px-1024px` (use `md:`)
- Desktop: `>1024px` (use `lg:`)

## Performance Tips

1. **Use compact GoalCard** in lists
2. **Extract calculations** to utilities
3. **Lazy load heavy sections** (charts, analytics)
4. **Memoize components** if re-render frequently
5. **Use next/image** for images (future)

## Accessibility Tips

1. **Use semantic HTML** (header, nav, main, section)
2. **Provide icon + text** combinations
3. **Use proper heading hierarchy** (h1, h2, h3)
4. **Include alt text** for images
5. **Test with keyboard** navigation
6. **Use color + other indicators** for status

## Testing Guidelines

### Test Utility Functions
```tsx
import { calculateProgress } from '@/lib/goal-utils';

describe('calculateProgress', () => {
  it('returns 50 for 50% progress', () => {
    const goal = { currentValue: 50, targetValue: 100 };
    expect(calculateProgress(goal)).toBe(50);
  });
});
```

### Test Components
```tsx
import { render } from '@testing-library/react';
import { StatCard } from '@/components/dashboard/stat-card';

it('displays the correct label', () => {
  const { getByText } = render(
    <StatCard label="Test" value={5} icon={Target} />
  );
  expect(getByText('Test')).toBeInTheDocument();
});
```

## Need Help?

1. **Check COMPONENT_STRUCTURE.md** - Full component documentation
2. **Check ARCHITECTURE.md** - System design and data flow
3. **Look at existing code** - Best learning resource
4. **Check constants.ts** - Navigation and status configs
5. **Review mock-data.ts** - Data structure reference

## Quick Command Reference

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Format code
pnpm format

# View components
npm run components:list
```

---

**Happy coding!** Follow the patterns in this guide and existing code to maintain consistency and quality.
