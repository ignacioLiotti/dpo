import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { useOnboarding } from './OnboardingProvider';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const OnboardingReview: React.FC = () => {
  const { steps, currentSet, currentStep, startOnboarding, exitOnboarding } = useOnboarding();

  const currentSetSteps = steps.get(currentSet || '') || [];
  const totalSteps = currentSetSteps.length;
  const completedSteps = currentSetSteps.filter(step => step.completed).length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      className="fixed bottom-4 right-4 z-50 max-w-sm w-full"
    >
      <Card className="shadow-lg border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Onboarding Progress</CardTitle>
          <CardDescription>
            {progress === 100
              ? "You've completed all steps!"
              : `${progress}% complete (${completedSteps} of ${totalSteps} steps)`}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-4">
          <ul className="space-y-2">
            {currentSetSteps.map((step, index) => (
              <li key={index} className={cn(
                "flex items-center p-2 rounded-md transition-colors",
                index === currentStep ? "bg-muted" : "",
                step.completed ? "text-primary" : "text-muted-foreground"
              )}>
                {step.completed
                  ? <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                  : <Circle className={cn(
                    "h-5 w-5 mr-2",
                    index === currentStep ? "text-primary" : "text-muted-foreground"
                  )} />
                }
                <span className={cn(
                  "text-sm",
                  index === currentStep ? "font-medium" : ""
                )}>
                  Step {index + 1}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="flex gap-2 pt-0">
          <Button
            onClick={() => startOnboarding(currentSet || '')}
            className="flex-1"
            variant="default"
          >
            {progress === 100 ? 'Review Tour' : 'Continue'}
          </Button>
          <Button
            onClick={exitOnboarding}
            variant="outline"
            className="flex-1"
          >
            Close
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

