import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useOnboarding } from './OnboardingProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { ProgressBar } from './ProgressBar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { PopoverPortal } from '@radix-ui/react-popover';

interface OnboardingStepProps {
  set: string;
  stepOrder: number;
  tooltipContent: React.ReactNode;
  tooltipTitle?: string;
  tooltipDescription?: string;
  href?: string;
  continueOnboarding?: boolean;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  path?: string;
  persistKey?: string;
  nextStepButton?: boolean;
  prevStepButton?: boolean;
  exitButton?: boolean;
  skippable?: boolean;
  children: React.ReactNode;
  onNext?: () => void;
  onSkip?: () => void;
}

export const OnboardingStep: React.FC<OnboardingStepProps> = ({
  set,
  stepOrder,
  nextStepButton = true,
  prevStepButton = true,
  exitButton = true,
  skippable = true,
  tooltipContent,
  tooltipTitle = "Onboarding",
  tooltipDescription,
  tooltipSide = 'right',
  children,
  href,
  continueOnboarding = false,
  onNext,
  onSkip
}) => {
  const {
    currentSet,
    currentStep,
    isActive,
    nextStep,
    prevStep,
    exitOnboarding,
    skipStep,
    registerStep,
    steps,
    onboardingConfig,
    router
  } = useOnboarding();

  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerStep(set, stepOrder, undefined, undefined, continueOnboarding);
  }, [set, stepOrder, registerStep, continueOnboarding]);

  const isCurrentStep = isActive && currentSet === set &&
    steps.get(currentSet)?.[currentStep]?.order === stepOrder;

  useEffect(() => {
    if (isCurrentStep && elementRef.current) {
      elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isCurrentStep]);

  const totalSteps = steps.get(currentSet || '')?.length || 1;

  const handleNext = () => {
    // if (onNext) { 
    //   onNext();
    // }
    if (href) {
      if (continueOnboarding) {
        localStorage.setItem(`${set}-continue`, 'true');
      }
      router.push(href);
    }
    nextStep();
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    skipStep();
  };

  if (!isCurrentStep) {
    return <div ref={elementRef}>{children}</div>;
  }

  return (
    <AnimatePresence>
      {isCurrentStep && (
        <>
          <div ref={elementRef} className={`z-50 ${onboardingConfig.position === 'top' ? 'fixed top-0 left-0 right-0' : 'relative'}`}>
            <Popover open={true}>

              {tooltipContent && (
                <>


                  <PopoverContent
                    side={tooltipSide}
                    className="w-80 p-0 shadow-lg z-[100] bg-white"
                    sideOffset={15}
                  >
                    <Card className="border-0 shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{tooltipTitle}</CardTitle>
                        {tooltipDescription && (
                          <CardDescription>{tooltipDescription}</CardDescription>
                        )}
                      </CardHeader>

                      <CardContent className="pb-4 space-y-4">
                        <div className="text-sm">{tooltipContent}</div>
                        {onboardingConfig.showProgressBarInPopover && (
                          <ProgressBar
                            currentStep={currentStep + 1}
                            totalSteps={totalSteps}
                            showStepIndicators={true}
                          />
                        )}
                      </CardContent>

                      <CardFooter className="flex flex-wrap gap-2 pt-0">
                        {nextStepButton && (
                          <Button
                            className="flex-1"
                            variant="default"
                            onClick={() => {
                              handleNext();
                            }}
                          >
                            {href ? 'Continuar y navegar' : 'Continuar'}
                          </Button>
                        )}
                        {prevStepButton && (
                          <Button
                            onClick={prevStep}
                            className="flex-1"
                            variant="outline"
                          >
                            Anterior
                          </Button>
                        )}
                        {skippable && (
                          <Button
                            onClick={handleSkip}
                            variant="secondary"
                            className="flex-1"
                          >
                            Omitir
                          </Button>
                        )}
                        {exitButton && (
                          <Button
                            onClick={exitOnboarding}
                            variant="outline"
                            className="flex-1"
                          >
                            Salir
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </PopoverContent>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 pointer-events-auto backdrop-blur-[2px]"
                  />
                </>
              )}
              <PopoverTrigger asChild>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={cn(
                    "relative outline-none",
                    "ring-2 ring-offset-2 ring-offset-white ring-primary bg-white",
                    "rounded-sm z-50"
                  )}
                >
                  {children}
                </motion.div>
              </PopoverTrigger>
            </Popover>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};