import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import React, { createContext } from 'react';

type Step = {
  setId: string;
  order: number;
  completed: boolean;
  path?: string;
  persistKey?: string;
};

type OnboardingConfig = {
  position: string;
  showProgressBarInPopover?: boolean;
  showStepPreview?: boolean;
};

export type OnboardingContextType = {
  currentSet: string | null;
  currentStep: number;
  steps: Map<string, Step[]>;
  isActive: boolean;
  onboardingConfig: OnboardingConfig;
  router: AppRouterInstance;
  nextStep: () => void;
  prevStep: () => void;
  startOnboarding: (setId: string, config?: OnboardingConfig) => void;
  exitOnboarding: () => void;
  skipStep: () => void;
  registerStep: (setId: string, order: number, path?: string, persistKey?: string, continueOnboarding?: boolean) => void;
  getStepState: (persistKey: string) => { currentSet: string | null; currentStep: number; isActive: boolean } | null;
  setStepState: (persistKey: string, state: { currentSet: string | null; currentStep: number; isActive: boolean }) => void;
};

export const OnboardingContext = createContext<OnboardingContextType | null>(null);