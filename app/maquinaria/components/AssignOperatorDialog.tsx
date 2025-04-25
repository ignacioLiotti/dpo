'use client';
import React from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { Operator } from '../actions';
import { assignMachineAction } from '../actions';

interface AssignOperatorDialogProps {
  machineId: string;
  operators: Operator[];
}

export function AssignOperatorDialog({ machineId, operators }: AssignOperatorDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">+ Assign Operator</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Operator</DialogTitle>
        </DialogHeader>
        <form action={assignMachineAction} className="space-y-4">
          <input type="hidden" name="machine_id" value={machineId} />
          <div className="space-y-1">
            <Label htmlFor="operator_id">Operator</Label>
            <Select name="operator_id">
              <SelectTrigger>
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {operators.map(op => (
                  <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Assign</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 