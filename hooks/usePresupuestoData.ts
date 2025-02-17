import { useQuery } from "@tanstack/react-query";

interface Item {
	id: number;
	codigo: string;
	nombre: string;
	unidad: string;
	categoria: string;
	precios: {
		id: number;
		precio: number;
		fecha: string;
	}[];
}

interface PresupuestoData {
	id?: number;
	obra_id: number;
	nombre: string;
	total: number;
	data: Record<
		string,
		{
			id: string | number;
			name: string;
			unit: string;
			quantity: number;
			unitPrice: number;
			totalPrice: number;
			price: number;
			category: string;
			parcial: number;
			rubro: number;
			accumulated: number;
		}[]
	>;
}

async function fetchPresupuestoData(id?: string) {
	if (!id) return null;
	const response = await fetch(`/api/presupuestos?id=${id}`);
	if (!response.ok) throw new Error("Failed to fetch presupuesto");
	return response.json();
}

async function fetchItems() {
	const response = await fetch("/api/items");
	if (!response.ok) throw new Error("Failed to fetch items");
	const data = await response.json();
	console.log("data", data);
	return data.items;
}

export function usePresupuestoData(presupuestoId?: string) {
	const { data: presupuesto, isLoading: isLoadingPresupuesto } =
		useQuery<PresupuestoData | null>({
			queryKey: ["presupuesto", presupuestoId],
			queryFn: () => fetchPresupuestoData(presupuestoId),
			enabled: !!presupuestoId,
		});

	const { data: items = [], isLoading: isLoadingItems } = useQuery<Item[]>({
		queryKey: ["items"],
		queryFn: fetchItems,
	});

	return {
		presupuesto,
		items,
		isLoading: isLoadingPresupuesto || isLoadingItems,
	};
}
