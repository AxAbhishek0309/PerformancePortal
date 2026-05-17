'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { MOCK_USERS } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { EscalationTrigger } from '@/lib/types';

const TRIGGER_LABELS: Record<EscalationTrigger, string> = {
  goal_not_submitted: 'Goal not submitted within N days of cycle open',
  goal_not_approved: 'Goal not approved within N days of submission',
  checkin_not_completed: 'Check-in not completed within active window',
};

const TRIGGER_COLORS: Record<EscalationTrigger, string> = {
  goal_not_submitted: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  goal_not_approved: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  checkin_not_completed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

export default function EscalationsPage() {
  const { escalationRules, escalationLogs, updateEscalationRule, resolveEscalation } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDays, setEditDays] = useState(0);

  const activeRules = escalationRules.filter((r) => r.active).length;
  const openLogs = escalationLogs.filter((l) => !l.resolvedAt).length;
  const resolvedLogs = escalationLogs.filter((l) => l.resolvedAt).length;

  const handleToggleRule = (id: string, active: boolean) => {
    updateEscalationRule(id, { active });
    toast.success(`Rule ${active ? 'enabled' : 'disabled'}`);
  };

  const handleSaveDays = (id: string) => {
    updateEscalationRule(id, { thresholdDays: editDays });
    setEditingId(null);
    toast.success('Threshold updated');
  };

  const handleResolve = (id: string) => {
    resolveEscalation(id);
    toast.success('Escalation marked as resolved');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Escalation Module</h1>
        <p className="text-muted-foreground mt-1">Configure rule-based escalations and track open issues</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Rules', value: activeRules, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900' },
          { label: 'Open Escalations', value: openLogs, icon: Clock, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900' },
          { label: 'Resolved', value: resolvedLogs, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Rules */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Escalation Rules</h2>
        <div className="space-y-4">
          {escalationRules.map((rule) => (
            <div key={rule.id} className="flex items-start justify-between p-4 border border-border rounded-lg gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className={TRIGGER_COLORS[rule.trigger]}>{rule.trigger.replace(/_/g, ' ')}</Badge>
                  {rule.active && <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{TRIGGER_LABELS[rule.trigger]}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  {editingId === rule.id ? (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Days:</Label>
                      <Input type="number" min={1} value={editDays} onChange={(e) => setEditDays(Number(e.target.value))} className="h-7 w-20 text-xs" />
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleSaveDays(rule.id)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <button className="text-primary text-xs hover:underline" onClick={() => { setEditingId(rule.id); setEditDays(rule.thresholdDays); }}>
                      Threshold: {rule.thresholdDays} days
                    </button>
                  )}
                  <span className="text-muted-foreground text-xs">Notify: {rule.notifyRoles.join(', ')}</span>
                </div>
              </div>
              <Switch checked={rule.active} onCheckedChange={(v) => handleToggleRule(rule.id, v)} />
            </div>
          ))}
        </div>
      </Card>

      {/* Escalation Log */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Escalation Log</h2>
        {escalationLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No escalations triggered yet.</p>
        ) : (
          <div className="space-y-3">
            {escalationLogs.map((log) => {
              const target = Object.values(MOCK_USERS).find((u) => u.id === log.targetUserId);
              return (
                <div key={log.id} className={`p-4 border rounded-lg ${log.resolvedAt ? 'border-border opacity-60' : 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={TRIGGER_COLORS[log.trigger]}>{log.trigger.replace(/_/g, ' ')}</Badge>
                        {log.resolvedAt ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Resolved</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Open</Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground">{log.message}</p>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Target: {target?.name ?? log.targetUserId}</span>
                        <span>Escalated to: {log.escalatedTo.join(', ')}</span>
                        <span>Triggered: {formatDate(log.createdAt)}</span>
                        {log.resolvedAt && <span>Resolved: {formatDate(log.resolvedAt)}</span>}
                      </div>
                    </div>
                    {!log.resolvedAt && (
                      <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => handleResolve(log.id)}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
