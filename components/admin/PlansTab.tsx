import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, UserX, UserCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { INITIAL_PLANS } from './constants';
import type { AdminPlan } from './types';

export function PlansTab() {
  const [plans, setPlans] = useState<AdminPlan[]>(INITIAL_PLANS);
  const [newPlan, setNewPlan] = useState({ name: '', minutes: 0, amount: 0 });

  const handleAddPlan = () => {
    if (!newPlan.name || newPlan.minutes <= 0 || newPlan.amount < 0) {
      toast.error('Please fill all plan details correctly');
      return;
    }

    const plan: AdminPlan = {
      id: Date.now().toString(),
      ...newPlan,
      active: true
    };

    setPlans([...plans, plan]);
    setNewPlan({ name: '', minutes: 0, amount: 0 });
    toast.success('Plan added successfully');
  };

  const togglePlanStatus = (id: string) => {
    setPlans(plans.map(plan => 
      plan.id === id ? { ...plan, active: !plan.active } : plan
    ));
    toast.success('Plan status updated');
  };

  const deletePlan = (id: string) => {
    setPlans(plans.filter(plan => plan.id !== id));
    toast.success('Plan deleted');
  };

  return (
    <div className="space-y-4">
      <Card className="glass p-6">
        <h3 className="font-semibold mb-4">Add New Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Plan name"
            value={newPlan.name}
            onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Minutes"
            value={newPlan.minutes || ''}
            onChange={(e) => setNewPlan({ ...newPlan, minutes: parseInt(e.target.value) || 0 })}
          />
          <Input
            type="number"
            placeholder="Amount (₹)"
            value={newPlan.amount || ''}
            onChange={(e) => setNewPlan({ ...newPlan, amount: parseInt(e.target.value) || 0 })}
          />
          <Button onClick={handleAddPlan}>
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </Card>

      <Card className="glass">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>{plan.minutes} min</TableCell>
                <TableCell>₹{plan.amount}</TableCell>
                <TableCell>
                  <Badge variant={plan.active ? 'default' : 'secondary'}>
                    {plan.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePlanStatus(plan.id)}
                    >
                      {plan.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePlan(plan.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}