import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function usePrefetch() {
	const queryClient = useQueryClient();

	const prefetchMediciones = useCallback(
		async (obraId: number) => {
			await queryClient.prefetchQuery({
				queryKey: ["mediciones", obraId],
				queryFn: async () => {
					const response = await fetch(`/api/mediciones?obraId=${obraId}`);
					if (!response.ok) throw new Error("Failed to fetch mediciones");
					return response.json();
				},
			});
		},
		[queryClient]
	);

	const prefetchPresupuesto = useCallback(
		async (obraId: number) => {
			await queryClient.prefetchQuery({
				queryKey: ["presupuestos", obraId],
				queryFn: async () => {
					const response = await fetch(`/api/presupuestos?obraId=${obraId}`);
					if (!response.ok) throw new Error("Failed to fetch presupuestos");
					return response.json();
				},
			});
		},
		[queryClient]
	);

	const prefetchObra = useCallback(
		async (obraId: number) => {
			await queryClient.prefetchQuery({
				queryKey: ["obra", obraId],
				queryFn: async () => {
					const response = await fetch(`/api/obras?id=${obraId}`);
					if (!response.ok) throw new Error("Failed to fetch obra");
					return response.json();
				},
			});
		},
		[queryClient]
	);

	return {
		prefetchMediciones,
		prefetchPresupuesto,
		prefetchObra,
	};
}
