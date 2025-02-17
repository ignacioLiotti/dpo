import { createClient } from "@/utils/supabase/server";
import type { TableItem, GroupedData, Medicion } from "@/app/presupuesto/types";
import type { Obra } from "@/hooks/useObras";
import type { Presupuesto } from "@/hooks/usePresupuestos";

export type { TableItem, GroupedData, Medicion };

// API Functions
export const fetchSelectedItems = async (ids: string[]) => {
	const response = await fetch(`/api/items/selected?ids=${ids.join(",")}`);
	if (!response.ok) {
		throw new Error("Failed to fetch items");
	}
	return response.json();
};

// Cache Keys
export const queryKeys = {
	items: {
		all: ["items"] as const,
		selected: (ids: string[]) =>
			[...queryKeys.items.all, "selected", ids] as const,
	},
	presupuesto: {
		all: ["presupuestos"] as const,
		byObraId: (obraId: number) =>
			[...queryKeys.presupuesto.all, obraId] as const,
		detail: (id: number) =>
			[...queryKeys.presupuesto.all, "detail", id] as const,
	},
	mediciones: {
		all: ["mediciones"] as const,
		byObraId: (obraId: number) =>
			[...queryKeys.mediciones.all, obraId] as const,
		detail: (id: number) =>
			[...queryKeys.mediciones.all, "detail", id] as const,
	},
	obras: {
		all: ["obras"] as const,
		detail: (id: number) => [...queryKeys.obras.all, id] as const,
	},
};

// Types for cacheable data
type CacheableData = {
	obras?: Obra[];
	presupuestos?: Presupuesto[];
	mediciones?: Medicion[];
	items?: TableItem[];
	selectedItems?: {
		presupuestoData: GroupedData;
		allElements: TableItem[];
		mediciones: Medicion[];
	};
};

// Local Storage Persistence
const CACHE_PREFIX = "app_cache_";
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export const persistQueryData = <T extends keyof CacheableData>(
	queryKey: string[],
	data: CacheableData[T]
) => {
	try {
		localStorage.setItem(
			`${CACHE_PREFIX}${JSON.stringify(queryKey)}`,
			JSON.stringify({
				data,
				timestamp: Date.now(),
			})
		);
	} catch (error) {
		console.error("Error persisting query data:", error);
	}
};

export const getPersistedQueryData = <T extends keyof CacheableData>(
	queryKey: string[]
): CacheableData[T] | undefined => {
	try {
		const cached = localStorage.getItem(
			`${CACHE_PREFIX}${JSON.stringify(queryKey)}`
		);
		if (!cached) return undefined;

		const { data, timestamp } = JSON.parse(cached);
		if (Date.now() - timestamp > CACHE_TTL) {
			localStorage.removeItem(`${CACHE_PREFIX}${JSON.stringify(queryKey)}`);
			return undefined;
		}

		return data as CacheableData[T];
	} catch (error) {
		console.error("Error reading persisted query data:", error);
		return undefined;
	}
};
