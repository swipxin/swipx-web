import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Activity, Clock } from 'lucide-react';
import { MOCK_SESSIONS } from './constants';
import { formatDuration } from './utils';

export function SessionsTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              <p className="text-lg font-semibold">
                {MOCK_SESSIONS.filter(s => s.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="glass p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sessions Today</p>
              <p className="text-lg font-semibold">{MOCK_SESSIONS.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="glass p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Duration</p>
              <p className="text-lg font-semibold">
                {formatDuration(Math.floor(MOCK_SESSIONS.reduce((acc, s) => acc + s.duration, 0) / MOCK_SESSIONS.length))}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="glass">
        <div className="p-6">
          <h3 className="font-semibold mb-4">Active Sessions</h3>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_SESSIONS.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-mono text-sm">{session.id}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm">{session.user1}</p>
                    <p className="text-sm text-muted-foreground">↔ {session.user2}</p>
                  </div>
                </TableCell>
                <TableCell>{formatDuration(session.duration)}</TableCell>
                <TableCell>
                  <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                    {session.status}
                  </Badge>
                </TableCell>
                <TableCell>{session.startTime}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}