'use client'
import React, { useReducer, useCallback, useContext, useEffect } from 'react';
import { OnboardingContext, OnboardingContextType } from './OnboardingContext';
import { OnboardingReview } from './OnboardingReview';
import { useRouter } from 'next/navigation';

interface OnboardingProviderProps {
  children: React.ReactNode;
  showProgress?: boolean;
}

// Define action types
type OnboardingAction =
  | { type: 'START_ONBOARDING'; payload: { setId: string; config?: OnboardingConfig } }
  | { type: 'EXIT_ONBOARDING' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'REGISTER_STEP'; payload: { setId: string; order: number; path?: string; persistKey?: string; continueOnboarding?: boolean } }
  | { type: 'SET_STEP_COMPLETED'; payload: { setId: string; order: number; completed: boolean } };

// Define state type
type OnboardingState = {
  currentSet: string | null;
  currentStep: number;
  steps: Map<string, { setId: string; order: number; completed: boolean; path?: string; persistKey?: string, continueOnboarding?: boolean }[]>;
  isActive: boolean;
  onboardingConfig: OnboardingConfig;
};

export interface OnboardingConfig {
  position?: 'center' | 'left' | 'right' | 'default';
  showProgressBarInPopover?: boolean;
  showStepPreview?: boolean;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
}

// Initial state
const initialState: OnboardingState = {
  currentSet: null,
  currentStep: 0,
  steps: new Map(),
  isActive: false,
  onboardingConfig: {
    position: 'default',
    showProgressBarInPopover: false,
    showStepPreview: false
  }
};

// Reducer function
function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'START_ONBOARDING':
      return {
        ...state,
        currentSet: action.payload.setId,
        currentStep: 0,
        isActive: true,
        onboardingConfig: action.payload.config || state.onboardingConfig
      };

    case 'EXIT_ONBOARDING':
      return {
        ...state,
        isActive: false,
        currentSet: null,
        currentStep: 0
      };

    case 'NEXT_STEP': {
      if (!state.currentSet) return state;

      const currentSetSteps = state.steps.get(state.currentSet) || [];
      const nextStepIndex = state.currentStep + 1;

      if (nextStepIndex >= currentSetSteps.length) {
        return {
          ...state,
          isActive: false,
          currentSet: null,
          currentStep: 0
        };
      }

      // Create a new Map to avoid mutation
      const newSteps = new Map(state.steps);
      const setSteps = [...(newSteps.get(state.currentSet) || [])];

      if (setSteps[state.currentStep]) {
        setSteps[state.currentStep] = { ...setSteps[state.currentStep], completed: true };
      }

      newSteps.set(state.currentSet, setSteps);

      return {
        ...state,
        currentStep: nextStepIndex,
        steps: newSteps
      };
    }

    case 'PREV_STEP': {
      if (!state.currentSet) return state;

      const previousStepIndex = Math.max(0, state.currentStep - 1);

      if (previousStepIndex === state.currentStep) {
        return state;
      }

      // Create a new Map to avoid mutation
      const newSteps = new Map(state.steps);
      const setSteps = [...(newSteps.get(state.currentSet) || [])];

      if (setSteps[state.currentStep]) {
        setSteps[state.currentStep] = { ...setSteps[state.currentStep], completed: false };
      }

      newSteps.set(state.currentSet, setSteps);

      return {
        ...state,
        currentStep: previousStepIndex,
        steps: newSteps
      };
    }

    case 'REGISTER_STEP': {
      const { setId, order, path, persistKey, continueOnboarding } = action.payload;

      // Create a new Map to avoid mutation
      const newSteps = new Map(state.steps);
      const setSteps = newSteps.get(setId) || [];

      if (!setSteps.some(step => step.order === order)) {
        const updatedSteps = [...setSteps, {
          setId,
          order,
          completed: false,
          path,
          persistKey,
          continueOnboarding
        }].sort((a, b) => a.order - b.order);

        newSteps.set(setId, updatedSteps);
      }

      return {
        ...state,
        steps: newSteps
      };
    }

    case 'SET_STEP_COMPLETED': {
      const { setId, order, completed } = action.payload;

      // Create a new Map to avoid mutation
      const newSteps = new Map(state.steps);
      const setSteps = [...(newSteps.get(setId) || [])];

      const stepIndex = setSteps.findIndex(step => step.order === order);

      if (stepIndex !== -1) {
        setSteps[stepIndex] = { ...setSteps[stepIndex], completed };
        newSteps.set(setId, setSteps);
      }

      return {
        ...state,
        steps: newSteps
      };
    }

    default:
      return state;
  }
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
  showProgress
}) => {

  const router = useRouter();
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const { currentSet, currentStep, steps, isActive, onboardingConfig } = state;

  const STORAGE_PREFIX = 'onboarding';

  // Storage utilities
  const getStepState = useCallback((persistKey: string) => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(persistKey);
    return saved ? JSON.parse(saved) : null;
  }, []);

  const setStepState = useCallback((persistKey: string, state: { currentSet: string | null; currentStep: number; isActive: boolean }) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(persistKey, JSON.stringify(state));
  }, []);

  // Action creators
  const registerStep = useCallback((setId: string, order: number, path?: string, persistKey?: string, continueOnboarding?: boolean) => {
    dispatch({
      type: 'REGISTER_STEP',
      payload: { setId, order, path, persistKey, continueOnboarding }
    });
  }, []);

  const nextStep = useCallback(() => {
    if (!currentSet) return;

    const currentSetSteps = steps.get(currentSet) || [];
    const currentStepData = currentSetSteps[currentStep];

    setTimeout(() => {

      // Store continuation state if needed
      if (currentStepData?.continueOnboarding && typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_PREFIX}:${currentSet}:lastStep`, JSON.stringify({
          stepOrder: currentStep,
          continuationRequested: true,
          path: currentStepData.path
        }));
      }

      // Save state for current step if it has a persistKey
      if (currentStepData?.persistKey) {
        setStepState(currentStepData.persistKey, {
          currentSet,
          currentStep: currentStep + 1,
          isActive: true
        });
      }

      dispatch({ type: 'NEXT_STEP' });
    }, 100);
  }, [currentSet, currentStep, steps, setStepState]);

  const prevStep = useCallback(() => {
    if (!currentSet) return;

    const currentSetSteps = steps.get(currentSet) || [];
    if (currentStep > 0) {
      const previousStepData = currentSetSteps[currentStep - 1];

      // Save state for previous step if it has a persistKey
      if (previousStepData?.persistKey) {
        setStepState(previousStepData.persistKey, {
          currentSet,
          currentStep: currentStep - 1,
          isActive: true
        });
      }

      dispatch({ type: 'PREV_STEP' });
    }
  }, [currentSet, currentStep, steps, setStepState]);

  const startOnboarding = useCallback((setId: string, config: OnboardingConfig = {
    position: 'default',
    showProgressBarInPopover: false,
    showStepPreview: false
  }) => {
    dispatch({
      type: 'START_ONBOARDING',
      payload: { setId, config }
    });

    // Save initial state for first step if it has a persistKey
    const setSteps = steps.get(setId) || [];
    const firstStep = setSteps[0];
    if (firstStep?.persistKey) {
      setStepState(firstStep.persistKey, {
        currentSet: setId,
        currentStep: 0,
        isActive: true
      });
    }
  }, [steps, setStepState]);

  const exitOnboarding = useCallback(() => {
    const currentSetSteps = currentSet ? steps.get(currentSet) : [];
    const currentStepData = currentSetSteps?.[currentStep];

    // Clear state for current step if it has a persistKey
    if (currentStepData?.persistKey) {
      setStepState(currentStepData.persistKey, {
        currentSet: null,
        currentStep: 0,
        isActive: false
      });
    }

    // Clear continuation state
    if (currentSet && typeof window !== 'undefined') {
      localStorage.removeItem(`${STORAGE_PREFIX}:${currentSet}:lastStep`);
    }

    dispatch({ type: 'EXIT_ONBOARDING' });
  }, [currentSet, currentStep, steps, setStepState]);

  // Effect to handle continuation of onboarding
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentPath = window.location.pathname;

    steps.forEach((stepArray, setId) => {
      const lastStepData = localStorage.getItem(`${STORAGE_PREFIX}:${setId}:lastStep`);

      if (lastStepData) {
        try {
          const { stepOrder, continuationRequested, path: lastStepPath } = JSON.parse(lastStepData);
          if (continuationRequested) {
            const nextStep = stepArray.find(step => step.order === stepOrder + 1);
            // If there's a next step and it matches the current path or has no specific path
            if (nextStep && (!nextStep.path || nextStep.path === currentPath)) {
              // Start onboarding and continue
              startOnboarding(setId, { position: 'default', showProgressBarInPopover: false });
              dispatch({
                type: 'START_ONBOARDING',
                payload: {
                  setId,
                  config: { position: 'default', showProgressBarInPopover: false }
                }
              });
              // Remove continuation state to avoid repeated execution
              localStorage.removeItem(`${STORAGE_PREFIX}:${setId}:lastStep`);
            } else if (!nextStep && lastStepPath === currentPath) {
              // Handle edge case: No next step but the last saved step matches the path
              startOnboarding(setId, { position: 'default', showProgressBarInPopover: false });
              // Remove continuation state to avoid repeated execution
              localStorage.removeItem(`${STORAGE_PREFIX}:${setId}:lastStep`);
            }
          }
        } catch (error) {
          console.error('Error parsing onboarding continuation data:', error);
          localStorage.removeItem(`${STORAGE_PREFIX}:${setId}:lastStep`);
        }
      }
    });
  }, [steps, startOnboarding]);

  const value: OnboardingContextType = {
    currentSet,
    currentStep,
    steps,
    isActive,
    // @ts-ignore
    onboardingConfig,
    router,
    nextStep,
    prevStep,
    // @ts-ignore
    startOnboarding,
    exitOnboarding,
    skipStep: nextStep,
    registerStep,
    getStepState,
    setStepState,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {/* {isActive && onboardingConfig.showStepPreview && <OnboardingReview />} */}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within a OnboardingProvider');
  }
  return context;
};

export const useInOnboarding = () => {
  const { isActive } = useOnboarding();
  return isActive;
};

export const useNextStep = () => {
  const { nextStep } = useOnboarding();
  return nextStep;
};

export const usePrevStep = () => {
  const { prevStep } = useOnboarding();
  return prevStep;
}