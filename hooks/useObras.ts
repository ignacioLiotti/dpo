import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	queryKeys,
	getPersistedQueryData,
	persistQueryData,
} from "@/utils/api-client";

export interface Obra {
	id: number;
	nombre: string;
	ubicacion: string;
	empresa: string;
	fechaInicio: string;
	fechaFin: string;
	estado: string;
}

// Fetch all obras
async function fetchObras() {
	const response = await fetch("/api/obras");
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Fetch single obra
async function fetchObra(id: number) {
	const response = await fetch(`/api/obras?id=${id}`);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Create obra
async function createObra(obra: Omit<Obra, "id">) {
	const response = await fetch("/api/obras", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(obra),
	});
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Update obra
async function updateObra(obra: Obra) {
	const response = await fetch("/api/obras", {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(obra),
	});
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Delete obra
async function deleteObra(id: number) {
	const response = await fetch(`/api/obras?id=${id}`, {
		method: "DELETE",
	});
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

export function useObras() {
	return useQuery<Obra[]>({
		queryKey: queryKeys.obras.all,
		queryFn: fetchObras,
		initialData: () => {
			const data = getPersistedQueryData<"obras">(["obras"]);
			return data;
		},
		gcTime: 1000 * 60 * 30, // 30 minutes
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

export function useObra(id: number) {
	return useQuery<Obra>({
		queryKey: queryKeys.obras.detail(id),
		queryFn: () => fetchObra(id),
		enabled: !!id,
		initialData: () => {
			const obras = getPersistedQueryData<"obras">(["obras"]);
			return obras?.find((obra) => obra.id === id);
		},
	});
}

export function useCreateObra() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createObra,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.obras.all });
		},
	});
}

export function useUpdateObra() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateObra,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.obras.all });
			queryClient.invalidateQueries({
				queryKey: queryKeys.obras.detail(data.id),
			});
		},
	});
}

export function useDeleteObra() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteObra,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.obras.all });
		},
	});
}
