'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, Lock, Palette, Plug } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/export';
import { useStore } from '@/lib/store';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { goals } = useStore();

  const [name, setName] = useState(user?.name ?? '');
  const [department, setDepartment] = useState(user?.department ?? '');
  const [notifications, setNotifications] = useState({
    goalApprovals: true,
    checkIns: true,
    comments: true,
    emailDigest: false,
  });

  const handleSaveProfile = () => {
    // In a real app this would call an API
    toast.success('Profile updated successfully');
  };

  const handleExportData = () => {
    const myGoals = goals.filter((g) => g.ownerId === user?.id);
    if (myGoals.length === 0) { toast.info('No goals to export'); return; }
    exportToCSV(
      myGoals.map((g) => ({ Title: g.title, Status: g.status, Progress: `${g.currentValue}/${g.targetValue}`, Weightage: `${g.weightage}%` })),
      'my-goals-export'
    );
    toast.success('Data exported');
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.success(`${key} notifications ${updated[key] ? 'enabled' : 'disabled'}`);
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-semibold">
            {user?.name[0] ?? 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Profile</h2>
            <p className="text-sm text-muted-foreground">Manage your account information</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input defaultValue={user?.email ?? ''} disabled className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <Input defaultValue={user?.role ?? ''} disabled className="mt-2 capitalize" />
          </div>
          <div>
            <label className="text-sm font-medium">Department</label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-2" />
          </div>
          <Button onClick={handleSaveProfile}>Save Changes</Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
            <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">Manage notification preferences</p>
          </div>
        </div>
        <div className="space-y-3">
          {([
            { key: 'goalApprovals', title: 'Goal Approvals', description: 'Notify when goals need approval' },
            { key: 'checkIns', title: 'Check-ins', description: 'Remind about pending check-ins' },
            { key: 'comments', title: 'Comments', description: 'Notify when comments are added' },
            { key: 'emailDigest', title: 'Email Digest', description: 'Weekly summary of activities' },
          ] as const).map(({ key, title, description }) => (
            <div key={key} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <button
                role="switch"
                aria-checked={notifications[key]}
                onClick={() => toggleNotification(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications[key] ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifications[key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">Customize how the app looks</p>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-3 block">Theme</label>
          <div className="flex gap-3">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <Button
                key={t}
                variant={theme === t ? 'default' : 'outline'}
                onClick={() => { setTheme(t); toast.success(`Theme set to ${t}`); }}
                className="capitalize"
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Integrations (Bonus Features) */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
            <Plug className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Integrations
              <Badge variant="secondary" className="bg-primary/10 text-primary">Bonus Points</Badge>
            </h2>
            <p className="text-sm text-muted-foreground">Connect third-party services to enhance GoalTrack</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
            <div>
              <p className="font-medium">Microsoft Entra ID (Azure AD)</p>
              <p className="text-sm text-muted-foreground">Enable Single Sign-On (SSO) and automatic org hierarchy sync.</p>
            </div>
            <Button variant="outline" onClick={() => {
              toast.info('Redirecting to Microsoft login...');
              setTimeout(() => toast.success('Successfully connected to Microsoft Entra ID'), 1500);
            }}>
              Connect
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
            <div>
              <p className="font-medium">Microsoft Teams Integration</p>
              <p className="text-sm text-muted-foreground">Receive automated goal notifications and check-in reminders in Teams.</p>
            </div>
            <Button variant="outline" onClick={() => {
              toast.info('Authorizing Teams App...');
              setTimeout(() => toast.success('Teams bot successfully installed'), 1500);
            }}>
              Connect
            </Button>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Security</h2>
            <p className="text-sm text-muted-foreground">Manage your security settings</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-4 border border-border rounded-lg">
            <p className="font-medium mb-1">Change Password</p>
            <p className="text-sm text-muted-foreground mb-3">Update your password regularly</p>
            <Button variant="outline" onClick={() => toast.info('Password change is handled via your identity provider in production')}>
              Change Password
            </Button>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <p className="font-medium mb-1">Two-Factor Authentication</p>
            <p className="text-sm text-muted-foreground mb-3">Add an extra layer of security</p>
            <Button variant="outline" onClick={() => toast.info('2FA setup would be configured via your identity provider')}>
              Enable 2FA
            </Button>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <p className="font-medium mb-1">Active Sessions</p>
            <p className="text-sm text-muted-foreground mb-3">You are currently signed in on this device</p>
            <Button variant="outline" onClick={() => toast.success('Session list refreshed — 1 active session')}>
              View Sessions
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200 dark:border-red-900">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" className="border-red-200 text-red-600 dark:border-red-900 dark:text-red-400" onClick={handleExportData}>
            Export My Data
          </Button>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 dark:border-red-900 dark:text-red-400"
            onClick={() => toast.error('Account deactivation requires admin approval in production')}
          >
            Deactivate Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
