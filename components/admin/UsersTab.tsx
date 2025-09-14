import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Eye, Crown, Coins } from 'lucide-react';
import { MOCK_USERS } from './constants';
import { getStatusBadge, formatDate } from './utils';

export function UsersTab() {
  return (
    <div className="space-y-4">
      <Card className="glass">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">User Management</h3>
            <div className="flex gap-2">
              <Badge variant="outline">Total: {MOCK_USERS.length}</Badge>
              <Badge variant="outline">Premium: {MOCK_USERS.filter(u => u.isPremium).length}</Badge>
            </div>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_USERS.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>{user.country}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadge(user.status)}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.isPremium ? (
                    <Badge className="bg-gradient-to-r from-primary to-accent">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Free</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-accent" />
                    <span>{user.tokens}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(user.joinedDate)}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}