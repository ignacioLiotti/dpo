import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
	fetchSelectedItems,
	queryKeys,
	getPersistedQueryData,
	persistQueryData,
} from "@/utils/api-client";
import type { TableItem, GroupedData, Medicion } from "@/utils/api-client";

interface PresupuestoData {
	presupuestoData: GroupedData;
	allElements: TableItem[];
	mediciones: Medicion[];
}

type QueryKey = ReturnType<typeof queryKeys.items.selected>;

export function useSelectedItems(
	ids: string[],
	options?: Omit<
		UseQueryOptions<PresupuestoData, Error, PresupuestoData, QueryKey>,
		"queryKey" | "queryFn"
	>
) {
	const queryKey = queryKeys.items.selected(ids);

	return useQuery<PresupuestoData, Error, PresupuestoData, QueryKey>({
		queryKey,
		queryFn: () => fetchSelectedItems(ids),
		initialData: () => {
			const persisted = getPersistedQueryData(queryKey.map(String));
			return persisted as PresupuestoData | undefined;
		},
		gcTime: 1000 * 60 * 30, // 30 minutes
		staleTime: 1000 * 60 * 5, // 5 minutes
		enabled: ids.length > 0,
		...options,
	});
}

// Add more custom hooks as needed for other data fetching operations
