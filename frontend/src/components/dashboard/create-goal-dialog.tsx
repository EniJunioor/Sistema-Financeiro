'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GoalForm } from '@/components/goals/goal-form';
import { useCreateGoal } from '@/hooks/use-goals';
import type { CreateGoalData } from '@/lib/goals-api';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGoalDialog({ open, onOpenChange }: CreateGoalDialogProps) {
  const createGoal = useCreateGoal();

  const handleSubmit = async (data: CreateGoalData) => {
    await createGoal.mutateAsync(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Nova Meta Financeira</DialogTitle>
          <DialogDescription className="text-sm">
            Defina uma nova meta para alcançar seus objetivos financeiros
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 sm:mt-4">
          <GoalForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createGoal.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
