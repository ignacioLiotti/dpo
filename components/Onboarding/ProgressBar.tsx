import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
  showStepIndicators?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  className,
  showStepIndicators = false
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn("w-full space-y-2", className)}>
      {showStepIndicators && (
        <div className="flex items-center justify-between">
          <div className="flex-1 flex gap-1  w-1/3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full flex-1 transition-colors",
                  i < currentStep ? "bg-primary" : "bg-muted-foreground/50",
                )}
              />
            ))}
          </div>
          <div className="ml-4 text-sm font-medium text-muted-foreground flex justify-end w-1/2">
            {currentStep} of {totalSteps}
          </div>
        </div>
      )}

      {/* {!showStepIndicators && (
        <Progress value={progress} className="h-2">
          <motion.div
            className="bg-primary h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          />
        </Progress>
      )} */}
    </div>
  );
};

