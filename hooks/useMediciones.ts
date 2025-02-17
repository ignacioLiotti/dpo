import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	queryKeys,
	getPersistedQueryData,
	persistQueryData,
} from "@/utils/api-client";

export interface MedicionItem {
	id: number;
	itemId: number;
	avanceMensual: number;
	acumuladoAnterior: number;
	acumuladoActual: number;
	item: {
		id: number;
		nombre: string;
		unidad: string;
		categoria: string;
	};
}

export interface Medicion {
	periodo: string;
	id: number;
	month: string;
	measurements: {
		[key: string]: {
			monthlyProgress: number;
			cumulativePrevious: number;
			cumulativeCurrent: number;
		};
	};
}

interface MedicionResponse {
	id: number;
	periodo: string;
	data: {
		secciones: Array<{
			nombre: string;
			items: Array<{
				id: string;
				anterior: number;
				presente: number;
				acumulado: number;
			}>;
		}>;
	};
}

const transformMedicionResponse = (data: MedicionResponse[]): Medicion[] => {
	// @ts-ignore
	return data.map((medicion) => ({
		id: medicion.id,
		month: medicion.periodo,
		measurements: medicion.data.secciones.reduce(
			(acc, seccion) => {
				seccion.items.forEach((item) => {
					acc[item.id] = {
						monthlyProgress: item.presente,
						cumulativePrevious: item.anterior,
						cumulativeCurrent: item.acumulado,
					};
				});
				return acc;
			},
			{} as Medicion["measurements"]
		),
	}));
};

const fetchMediciones = async (obraId: number) => {
	const response = await fetch(`/api/mediciones?obraId=${obraId}`);
	if (!response.ok) {
		throw new Error("Failed to fetch mediciones");
	}
	const data = await response.json();
	return transformMedicionResponse(data);
};

// Fetch single medicion
async function fetchMedicion(id: number) {
	const response = await fetch(`/api/mediciones?id=${id}`);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Create medicion
async function createMedicion(data: {
	obraId: number;
	periodo: string;
	items: Omit<MedicionItem, "id" | "item">[];
}) {
	const response = await fetch("/api/mediciones", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Update medicion
async function updateMedicion(data: {
	id: number;
	items: Omit<MedicionItem, "id" | "item">[];
}) {
	const response = await fetch("/api/mediciones", {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Delete medicion
async function deleteMedicion(id: number) {
	const response = await fetch(`/api/mediciones?id=${id}`, {
		method: "DELETE",
	});
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

export function useMediciones(obraId: number) {
	return useQuery({
		queryKey: ["mediciones", obraId],
		queryFn: () => fetchMediciones(obraId),
		enabled: !!obraId,
		staleTime: 1000 * 60 * 0, // 5 minutes
	});
}

export function useMedicion(id: number) {
	return useQuery<Medicion>({
		queryKey: queryKeys.mediciones.detail(id),
		queryFn: () => fetchMedicion(id),
		enabled: !!id,
		initialData: undefined,
	});
}

export function useCreateMedicion() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createMedicion,
		onSuccess: (data: Medicion) => {
			queryClient.invalidateQueries({
				// @ts-ignore
				queryKey: queryKeys.mediciones.byObraId(data.obraId),
			});
		},
	});
}

export function useUpdateMedicion() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateMedicion,
		onSuccess: (data: Medicion) => {
			queryClient.invalidateQueries({
				// @ts-ignore
				queryKey: queryKeys.mediciones.byObraId(data.obraId),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.mediciones.detail(data.id),
			});
		},
	});
}

export function useDeleteMedicion() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteMedicion,
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.mediciones.all });
		},
	});
}

interface SaveMedicionParams {
	obraId: number;
	periodo: string;
	data: {
		secciones: Array<{
			nombre: string;
			items: Array<{
				id: string;
				anterior: number;
				presente: number;
				acumulado: number;
			}>;
		}>;
	};
}

export function useSaveMedicion() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: SaveMedicionParams) => {
			const response = await fetch("/api/mediciones", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(params),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error al guardar la medición");
			}

			return response.json();
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["mediciones", variables.obraId],
			});
		},
	});
}
