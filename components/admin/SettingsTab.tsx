import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Switch } from '../ui/switch';
import { toast } from 'sonner@2.0.3';
import { INITIAL_SETTINGS } from './constants';
import type { AdminSettings } from './types';

export function SettingsTab() {
  const [settings, setSettings] = useState<AdminSettings>(INITIAL_SETTINGS);

  const updateSettings = (key: keyof AdminSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success('Settings updated');
  };

  return (
    <div className="space-y-4">
      <Card className="glass p-6 space-y-6">
        <h3 className="font-semibold">App Settings</h3>

        {/* General Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Free Mode</p>
              <p className="text-sm text-muted-foreground">Allow free users to use the app</p>
            </div>
            <Switch
              checked={settings.freeModeEnabled}
              onCheckedChange={(value) => updateSettings('freeModeEnabled', value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Max Call Duration (minutes)</label>
              <Input
                type="number"
                value={settings.maxTicketDuration}
                onChange={(e) => updateSettings('maxTicketDuration', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Grace Period (seconds)</label>
              <Input
                type="number"
                value={settings.graceSeconds}
                onChange={(e) => updateSettings('graceSeconds', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* TURN Server Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">TURN Server Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Host</label>
              <Input
                value={settings.turnHost}
                onChange={(e) => updateSettings('turnHost', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Port</label>
              <Input
                type="number"
                value={settings.turnPort}
                onChange={(e) => updateSettings('turnPort', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input
                value={settings.turnUsername}
                onChange={(e) => updateSettings('turnUsername', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={settings.turnPassword}
                onChange={(e) => updateSettings('turnPassword', e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}