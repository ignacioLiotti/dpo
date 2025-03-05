import { useState, useEffect, useRef } from "react";

export type TourStep = {
	targetId: string;
	content: string;
};

export function useTour(steps: TourStep[]) {
	const [currentStep, setCurrentStep] = useState(0);
	const [isActive, setIsActive] = useState(false);

	// Add a ref to track if the component is mounted
	const isMounted = useRef(true);

	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	const start = () => setIsActive(true);
	const stop = () => {
		setIsActive(false);
		setCurrentStep(0);
	};

	const nextStep = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			stop();
		}
	};

	useEffect(() => {
		if (isActive && steps[currentStep]) {
			const targetElement = document.getElementById(
				steps[currentStep].targetId
			);
			if (targetElement) {
				// Use a more gentle scroll with a slight delay
				setTimeout(() => {
					if (isMounted.current) {
						targetElement.scrollIntoView({
							behavior: "smooth",
							block: "center",
						});
					}
				}, 100);
			}
		}
	}, [currentStep, isActive, steps]);

	return {
		currentStep,
		isActive,
		start,
		stop,
		nextStep,
		totalSteps: steps.length,
	};
}
