import {
	QueryClient,
	defaultShouldDehydrateQuery,
	isServer,
	QueryCache,
} from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

// Create a single instance of the query client for the browser
const browserQueryClient =
	typeof window !== "undefined"
		? new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000,
						retry: false,
					},
					dehydrate: {
						shouldDehydrateQuery: (query) =>
							defaultShouldDehydrateQuery(query) ||
							query.state.status === "pending",
					},
				},
				queryCache: new QueryCache({
					onSuccess: (data, query) => {
						const queryKey = JSON.stringify(query.queryKey);
						if (query.state.dataUpdateCount === 1) {
							toast({
								title: "Fresh Data Fetched",
								description: `New fetch for ${queryKey}`,
							});
						} else {
							toast({
								title: "Using Cached Data",
								description: `Retrieved from cache for ${queryKey}`,
							});
						}
					},
				}),
			})
		: null;

function makeServerQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
				retry: false,
			},
			dehydrate: {
				shouldDehydrateQuery: (query) =>
					defaultShouldDehydrateQuery(query) ||
					query.state.status === "pending",
			},
		},
	});
}

export function getQueryClient() {
	if (isServer) {
		console.log("Server QueryClient");
		return makeServerQueryClient();
	}

	if (!browserQueryClient) {
		throw new Error("Browser QueryClient was not initialized");
	}

	return browserQueryClient;
}
