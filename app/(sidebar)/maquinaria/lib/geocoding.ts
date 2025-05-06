interface GeocodingResult {
	lat: string;
	lon: string;
	display_name: string;
	importance: number;
}

// Cache geocoding results to avoid repeated API calls
const geocodingCache = new Map<string, [number, number]>();

export async function geocodeLocation(
	location: string
): Promise<[number, number] | null> {
	// Check cache first
	const cachedResult = geocodingCache.get(location);
	if (cachedResult) {
		return cachedResult;
	}

	try {
		// Use Nominatim API with a 1 second delay to respect rate limits
		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`,
			{
				headers: {
					"User-Agent": "DPO-MachineryTracker/1.0",
				},
			}
		);

		if (!response.ok) {
			console.error("Geocoding failed:", response.statusText);
			return null;
		}

		const results = (await response.json()) as GeocodingResult[];

		if (results.length === 0) {
			console.warn(`No geocoding results found for location: ${location}`);
			return null;
		}

		// Sort by importance and get the most relevant result
		const bestResult = results.sort((a, b) => b.importance - a.importance)[0];
		const coordinates: [number, number] = [
			parseFloat(bestResult.lat),
			parseFloat(bestResult.lon),
		];

		// Cache the result
		geocodingCache.set(location, coordinates);

		return coordinates;
	} catch (error) {
		console.error("Geocoding error:", error);
		return null;
	}
}

// Function to get bounds for a set of coordinates
export function getBoundsForCoordinates(
	coordinates: [number, number][]
): [[number, number], [number, number]] {
	if (coordinates.length === 0) {
		// Default to world bounds if no coordinates
		return [
			[-90, -180],
			[90, 180],
		];
	}

	const lats = coordinates.map((coord) => coord[0]);
	const lons = coordinates.map((coord) => coord[1]);

	const minLat = Math.min(...lats);
	const maxLat = Math.max(...lats);
	const minLon = Math.min(...lons);
	const maxLon = Math.max(...lons);

	// Add some padding to the bounds
	const latPadding = (maxLat - minLat) * 0.1;
	const lonPadding = (maxLon - minLon) * 0.1;

	return [
		[minLat - latPadding, minLon - lonPadding],
		[maxLat + latPadding, maxLon + lonPadding],
	];
}
