const cache = new Map();

export async function getCachedData(queryKey: string, fetcher: () => Promise<any>) {
	if (cache.has(queryKey)) {
		return cache.get(queryKey);
	}

	const data = await fetcher();
	cache.set(queryKey, data);
	return data;
}
