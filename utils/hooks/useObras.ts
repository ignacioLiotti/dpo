import { QueryClient } from "@tanstack/react-query";

interface Obra {
	"3p": string;
	ainaugurar: string;
	area: string;
	avance: string;
	basico: string;
	clasificacion: string;
	codigoSIG: string;
	departamento: string;
	empresaAdjudicada: string;
	empresaPoliza: string;
	expte: string;
	expte2: string;
	fechaAdjudicacion: string;
	fechaAdjudicacion_1: string;
	fechaContrato: string;
	fechaFin: string;
	fechaInauguracion: string;
	fechaInicio: string;
	fechaLicitacion: string;
	fechaNormaLegal: string;
	id: number;
	idEdificio: string;
	inaugurada: string;
	inspectores: string;
	localidad: string;
	memoriaDesc: string;
	modalidad: string;
	montoContrato: string;
	montoPoliza: string;
	noInaugurado: string;
	nombre: string;
	normaLegalAdjudicacion: string;
	normaLegalLicitacion: string;
	numeroLicitacion: string;
	numeroPoliza: string;
	observaciones: string;
	plazo: string;
	presupuestoOficial: string;
	prioridad: string;
	proyectista: string;
}

const queryClient = new QueryClient();

// Fetch a single obra
export async function getObra(id: string | number) {
	return queryClient.fetchQuery({
		queryKey: ["obra", id],
		queryFn: async () => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_APP_URL}/api/obras/${id}`
			);
			if (!response.ok) {
				throw new Error("Failed to fetch obra");
			}
			return response.json() as Promise<Obra>;
		},
	});
}

// Fetch all obras
export async function useObras() {
	return queryClient.fetchQuery({
		queryKey: ["obras"],
		queryFn: async () => {
			const response = await fetch("/api/obras");
			if (!response.ok) {
				throw new Error("Failed to fetch obras");
			}
			return response.json() as Promise<Obra[]>;
		},
	});
}

// Create a new obra
export async function useCreateObra(newObra: Omit<Obra, "id" | "created_at">) {
	const { data, isLoading, error } = await queryClient.fetchQuery({
		queryKey: ["createObra"],
		queryFn: async () => {
			const response = await fetch("/api/obras", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newObra),
			});
			if (!response.ok) {
				throw new Error("Failed to create obra");
			}
			return response.json();
		},
	});
	await queryClient.invalidateQueries({ queryKey: ["obras"] });
	return {
		data: data,
		isLoading: isLoading,
		error: error,
	};
}

// Update an obra
export async function useUpdateObra(updatedObra: Obra) {
	const { data, isLoading, error } = await queryClient.fetchQuery({
		queryKey: ["updateObra", updatedObra.id],
		queryFn: async () => {
			const response = await fetch("/api/obras", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updatedObra),
			});
			if (!response.ok) {
				throw new Error("Failed to update obra");
			}
			return response.json();
		},
	});
	await queryClient.invalidateQueries({ queryKey: ["obras"] });
	await queryClient.invalidateQueries({ queryKey: ["obra", updatedObra.id] });
	return {
		data: data,
		isLoading: isLoading,
		error: error,
	};
}

// Delete an obra
export async function useDeleteObra(id: number) {
	const { data, isLoading, error } = await queryClient.fetchQuery({
		queryKey: ["deleteObra", id],
		queryFn: async () => {
			const response = await fetch(`/api/obras?id=${id}`, {
				method: "DELETE",
			});
			if (!response.ok) {
				throw new Error("Failed to delete obra");
			}
			return response.json();
		},
	});
	await queryClient.invalidateQueries({ queryKey: ["obras"] });
	await queryClient.invalidateQueries({ queryKey: ["obra", id] });
	return {
		data: data,
		isLoading: isLoading,
		error: error,
	};
}
