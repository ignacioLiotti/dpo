import { useState, useEffect } from "react";

/**
 * Custom hook for responsive design that returns whether the current viewport
 * matches the specified media query string.
 *
 * @param query A media query string like "(min-width: 1024px)"
 * @returns boolean indicating if the media query matches
 *
 * Example usage:
 * const isDesktop = useMediaQuery("(min-width: 1024px)");
 */
export function useMediaQuery(query: string): boolean {
	// Default to false for SSR
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		// Create media query list and set initial value
		const media = window.matchMedia(query);

		// Update the state whenever the match status changes
		const updateMatches = () => {
			setMatches(media.matches);
		};

		// Set the initial value
		updateMatches();

		// Listen for changes
		media.addEventListener("change", updateMatches);

		// Cleanup function to remove event listener
		return () => {
			media.removeEventListener("change", updateMatches);
		};
	}, [query]); // Re-run effect if query changes

	return matches;
}
