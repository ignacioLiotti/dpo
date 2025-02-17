import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	queryKeys,
	getPersistedQueryData,
	persistQueryData,
} from "@/utils/api-client";

export interface PresupuestoItem {
	id: number;
	itemId: number;
	cantidad: number;
	precioUnitario: number;
	precioTotal: number;
	item: {
		id: number;
		nombre: string;
		unidad: string;
		categoria: string;
	};
}

export interface PresupuestoSeccion {
	id: number;
	nombre: string;
	items: PresupuestoItem[];
}

export interface Presupuesto {
	id: number;
	obraId: number;
	nombre: string;
	total: number;
	secciones: PresupuestoSeccion[];
}

// Fetch all presupuestos for an obra
async function fetchPresupuestos(obraId: number) {
	const response = await fetch(`/api/presupuestos?obraId=${obraId}`);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Fetch single presupuesto
async function fetchPresupuesto(id: number) {
	const response = await fetch(`/api/presupuestos?id=${id}`);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Create presupuesto
async function createPresupuesto(data: {
	obraId: number;
	nombre: string;
	secciones: Omit<PresupuestoSeccion, "id">[];
}) {
	const response = await fetch("/api/presupuestos", {
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

// Update presupuesto
async function updatePresupuesto(data: {
	id: number;
	nombre: string;
	secciones: Omit<PresupuestoSeccion, "id">[];
}) {
	const response = await fetch("/api/presupuestos", {
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

// Delete presupuesto
async function deletePresupuesto(id: number) {
	const response = await fetch(`/api/presupuestos?id=${id}`, {
		method: "DELETE",
	});
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

export function usePresupuestos(obraId: number) {
	return useQuery<Presupuesto[]>({
		queryKey: queryKeys.presupuesto.byObraId(obraId),
		queryFn: () => fetchPresupuestos(obraId),
		enabled: !!obraId,
		initialData: () => {
			const data = getPersistedQueryData<"presupuestos">([
				"presupuestos",
				obraId.toString(),
			]);
			return data;
		},
		gcTime: 1000 * 60 * 30, // 30 minutes
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

export function usePresupuesto(id: number) {
	return useQuery<Presupuesto>({
		queryKey: queryKeys.presupuesto.detail(id),
		queryFn: () => fetchPresupuesto(id),
		enabled: !!id,
		initialData: () => {
			const presupuestos = getPersistedQueryData<"presupuestos">([
				"presupuestos",
			]);
			if (presupuestos) {
				return presupuestos.find((p) => p.id === id);
			}
			return undefined;
		},
	});
}

export function useCreatePresupuesto() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createPresupuesto,
		onSuccess: (data: Presupuesto) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.presupuesto.byObraId(data.obraId),
			});
		},
	});
}

export function useUpdatePresupuesto() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updatePresupuesto,
		onSuccess: (data: Presupuesto) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.presupuesto.byObraId(data.obraId),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.presupuesto.detail(data.id),
			});
		},
	});
}

export function useDeletePresupuesto() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deletePresupuesto,
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.presupuesto.all });
		},
	});
}
