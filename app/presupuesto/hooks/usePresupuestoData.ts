import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { TableItem } from "../types";

export interface Presupuesto {
	id: number;
	obra_id: number;
	nombre: string;
	total: number;
	data: Record<string, TableItem[]>;
	created_at: string;
	updated_at: string;
}

export async function fetchPresupuesto(id: string): Promise<Presupuesto> {
	const supabase = createClient();
	const { data: rawData, error } = await supabase
		.from("presupuestos")
		.select("*")
		.eq("id", id)
		.single();

	if (error) {
		throw error;
	}

	if (!rawData) {
		throw new Error("Presupuesto no encontrado");
	}

	// Transform old format to new format if necessary
	if ("secciones" in rawData.data) {
		const oldData = rawData.data as {
			secciones: Array<{
				nombre: string;
				items: Array<{
					id: number;
					nombre: string;
					unidad: string;
					cantidad: number;
					precioUnitario: number;
					total: number;
				}>;
			}>;
		};

		const transformedData: Record<string, TableItem[]> = {};
		oldData.secciones.forEach((seccion) => {
			transformedData[seccion.nombre] = seccion.items.map((item) => ({
				id: String(item.id),
				name: item.nombre,
				unit: item.unidad,
				quantity: item.cantidad,
				unitPrice: item.precioUnitario,
				totalPrice: item.total,
				price: item.precioUnitario,
				category: seccion.nombre,
				parcial: (item.total * 100) / rawData.total,
				rubro:
					(seccion.items.reduce((acc, i) => acc + i.total, 0) * 100) /
					rawData.total,
				accumulated: 0,
				element_tags: [],
				originalUnit: item.unidad,
				originalQuantity: item.cantidad,
				originalUnitPrice: item.precioUnitario,
				targetSection: seccion.nombre,
				nombre: item.nombre,
			}));
		});

		return {
			...rawData,
			data: transformedData,
		};
	}

	return rawData;
}

export function usePresupuestoData(id: string, initialData?: Presupuesto) {
	return useQuery({
		queryKey: ["presupuesto", id],
		queryFn: () => fetchPresupuesto(id),
		initialData,
	});
}
