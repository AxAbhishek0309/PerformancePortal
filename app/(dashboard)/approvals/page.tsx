'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ApprovalItem } from '@/components/approvals/approval-item';
import { EmptyState } from '@/components/common/empty-state';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';

export default function ApprovalsPage() {
  const { approvals, users } = useStore();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'returned' | 'rejected'>('pending');

  const roleApprovals = approvals.filter((a) => {
    if (!currentUser) return false;
    // Look up submitter by their user ID (store keys match user IDs)
    const submitter = Object.values(users).find((u) => u.id === a.submittedBy);
    if (currentUser.role === 'admin') {
      // Admin sees approvals submitted by managers
      return submitter?.role === 'manager';
    }
    if (currentUser.role === 'manager') {
      // Manager sees approvals from their direct reports
      return submitter?.managerId === currentUser.id || submitter?.role === 'employee';
    }
    return false;
  });

  const filtered = roleApprovals.filter((a) => {
    const matchesSearch = (a.goalTitle ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = roleApprovals.filter((a) => a.status === 'pending').length;
  const approvedCount = roleApprovals.filter((a) => a.status === 'approved').length;
  const returnedCount = roleApprovals.filter((a) => a.status === 'returned').length;

  const STATUS_TABS = [
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'approved', label: 'Approved', count: approvedCount },
    { key: 'returned', label: 'Returned', count: returnedCount },
    { key: 'all', label: 'All', count: roleApprovals.length },
  ] as const;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Approval Queue"
        description="Review and approve team member goals"
        action={{ label: `${pendingCount} Pending`, icon: Filter }}
      />

      {/* Search + filter tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(tab.key)}
              className="gap-2"
            >
              {tab.label}
              <span className={`inline-flex items-center justify-center w-5 h-5 text-xs rounded-full ${
                statusFilter === tab.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((approval) => (
            <ApprovalItem key={approval.id} approval={approval} expandable />
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <EmptyState
            icon={Filter}
            title={searchQuery ? 'No approvals found' : 'No approvals in this category'}
            description={searchQuery ? 'Try adjusting your search' : 'Switch tabs to see other approvals'}
          />
        </Card>
      )}

      {/* Stats footer */}
      <Card className="p-4 bg-muted/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-semibold">{roleApprovals.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className="text-lg font-semibold text-yellow-600">{pendingCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Approved</p>
            <p className="text-lg font-semibold text-green-600">{approvedCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Returned</p>
            <p className="text-lg font-semibold text-orange-600">{returnedCount}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
