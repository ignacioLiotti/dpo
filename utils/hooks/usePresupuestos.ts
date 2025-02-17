import {
	useQuery,
	useMutation,
	useQueryClient,
	QueryClient,
} from "@tanstack/react-query";

interface Section {
	nombre: string;
	items: Array<{
		id: number;
		nombre: string;
		unidad: string;
		cantidad: number;
		precioUnitario: number;
		total: number;
	}>;
}

export interface Presupuesto {
	id: number;
	obra_id: number;
	nombre: string;
	total: number;
	data: {
		secciones: Section[];
	};
}

const queryClient = new QueryClient();

// Fetch a single presupuesto
export async function usePresupuesto(id: string | number) {
	const { data, isLoading, error } = await queryClient.fetchQuery({
		queryKey: ["presupuesto", id],
		queryFn: async () => {
			// Use absolute URL or window.location.origin for base URL
			const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
			const response = await fetch(`${baseUrl}/api/presupuestos/${id}`);
			if (!response.ok) {
				throw new Error("Failed to fetch presupuesto");
			}
			const result = await response.json();
			// Handle case where no presupuesto is found
			if (Array.isArray(result) && result.length === 0) {
				throw new Error("Presupuesto not found");
			}
			// If result is an array with one item, return the first item
			if (Array.isArray(result)) {
				return result[0] as Presupuesto;
			}
			return result as Presupuesto;
		},
	});

	console.log(data, isLoading, error);
	return {
		data: data,
		isLoading: isLoading,
		error: error,
	};
}

// Fetch all presupuestos
export async function usePresupuestos() {
	const { data, isLoading, error } = await queryClient.fetchQuery({
		queryKey: ["presupuestos"],
		queryFn: async () => {
			const response = await fetch("/api/presupuestos");
			if (!response.ok) {
				throw new Error("Failed to fetch presupuestos");
			}
			return response.json() as Promise<Presupuesto[]>;
		},
	});
	return {
		data: data,
		isLoading: isLoading,
		error: error,
	};
}

// Create a new presupuesto
export async function useCreatePresupuesto() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (newPresupuesto: Omit<Presupuesto, "id">) => {
			const response = await fetch("/api/presupuestos", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newPresupuesto),
			});
			if (!response.ok) {
				throw new Error("Failed to create presupuesto");
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["presupuestos"] });
		},
	});
}

// Update a presupuesto
export function useUpdatePresupuesto() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (updatedPresupuesto: Presupuesto) => {
			const response = await fetch("/api/presupuestos", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updatedPresupuesto),
			});
			if (!response.ok) {
				throw new Error("Failed to update presupuesto");
			}
			return response.json();
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["presupuestos"] });
			queryClient.invalidateQueries({
				queryKey: ["presupuesto", variables.id],
			});
		},
	});
}

// Delete a presupuesto
export function useDeletePresupuesto() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			const response = await fetch(`/api/presupuestos?id=${id}`, {
				method: "DELETE",
			});
			if (!response.ok) {
				throw new Error("Failed to delete presupuesto");
			}
			return response.json();
		},
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: ["presupuestos"] });
			queryClient.invalidateQueries({ queryKey: ["presupuesto", id] });
		},
	});
}
