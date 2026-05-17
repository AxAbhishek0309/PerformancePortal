'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Search } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { exportToCSV } from '@/lib/export';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  update: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approve: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  reject: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  return: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  submit: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  unlock: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function AuditLogsPage() {
  const { auditLogs } = useStore();
  const [search, setSearch] = useState('');
  const [afterLockOnly, setAfterLockOnly] = useState(true);

  const filtered = auditLogs
    .filter((log) => !afterLockOnly || log.afterLock === true)
    .filter(
      (log) =>
        log.userId.toLowerCase().includes(search.toLowerCase()) ||
        log.resourceId.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => toDateSafe(b.timestamp) - toDateSafe(a.timestamp));

  const handleExport = () => {
    const rows = filtered.map((log) => ({
      Timestamp: formatDate(log.timestamp),
      User: log.userId,
      Action: log.action,
      AfterLock: log.afterLock ? 'yes' : 'no',
      ResourceType: log.resourceType,
      ResourceId: log.resourceId,
      Changes: log.changes
        ? Object.entries(log.changes)
            .map(([k, v]) => `${k}: ${v.before} → ${v.after}`)
            .join('; ')
        : '',
    }));
    exportToCSV(rows, 'audit-log');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            {filtered.length} entries
            {afterLockOnly ? ' — post-lock changes only (BRD §4)' : ' — all actions'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={afterLockOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAfterLockOnly(true)}
          >
            Post-lock only
          </Button>
          <Button
            variant={!afterLockOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAfterLockOnly(false)}
          >
            All events
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, resource, or action..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.map((log, idx) => (
          <Card key={log.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary mt-1" />
                {idx < filtered.length - 1 && <div className="w-0.5 h-10 bg-border mt-1" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <Badge className={ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-800'}>
                    {log.action.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="capitalize">{log.resourceType}</Badge>
                  {log.afterLock && (
                    <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      POST-LOCK
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground font-semibold">User</p>
                    <p className="font-medium mt-1">{log.userId}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground font-semibold">Resource</p>
                    <p className="font-medium mt-1 truncate">{log.resourceId}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase text-muted-foreground font-semibold">Changes</p>
                    {log.changes ? (
                      <div className="mt-1 text-xs space-y-0.5">
                        {Object.entries(log.changes).map(([key, { before, after }]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="line-through text-muted-foreground">{String(before)}</span>
                            <span className="text-green-600 font-medium">→ {String(after)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-1 text-xs">—</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No audit logs match your filters.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function toDateSafe(d: Date | string): number {
  return new Date(d).getTime();
}
