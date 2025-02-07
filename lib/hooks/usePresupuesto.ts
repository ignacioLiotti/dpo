import { useState, useCallback } from "react";
import {
	PresupuestoItem,
	GroupedPresupuestoData,
} from "@/lib/types/presupuesto";
import {
	calculateGrandTotal,
	calculateSectionRubros,
	calculateSectionIacums,
	calculateItemTotal,
} from "@/lib/utils/calculations";

interface UsePresupuestoProps {
	initialData?: GroupedPresupuestoData;
	presupuestoId?: string | number;
}

export function usePresupuesto({
	initialData = {},
	presupuestoId,
}: UsePresupuestoProps = {}) {
	const [data, setData] = useState<GroupedPresupuestoData>(initialData);
	console.log("data", data);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Calculate totals and percentages
	const grandTotal = calculateGrandTotal(data);
	const sectionRubros = calculateSectionRubros(data, grandTotal);
	const sectionIacums = calculateSectionIacums(data, grandTotal);

	// Fetch presupuesto data
	const fetchData = useCallback(async () => {
		if (!presupuestoId) return;

		try {
			setLoading(true);
			const response = await fetch(`/api/presupuestos/${presupuestoId}`);
			if (!response.ok) throw new Error("Error al cargar el presupuesto.");

			const presupuestoData = await response.json();
			setData(presupuestoData.data);
		} catch (err) {
			console.error("Error fetching data:", err);
			setError("Error al cargar los datos.");
		} finally {
			setLoading(false);
		}
	}, [presupuestoId]);

	// Update item data
	const updateData = useCallback(
		(
			tag: string,
			itemId: string | number,
			key: keyof PresupuestoItem,
			value: string
		) => {
			setData((prev) => {
				const newData = { ...prev };
				const items = newData[tag] || [];
				const itemIndex = items.findIndex(
					(it) => String(it.id) === String(itemId)
				);

				if (itemIndex > -1) {
					const item = items[itemIndex];
					const numValue = Number(value) || 0;

					// Create updated item with new value
					const updatedItem = { ...item, [key]: numValue };

					// Recalculate totalPrice if quantity or unitPrice changes
					if (key === "quantity" || key === "unitPrice") {
						updatedItem.totalPrice = calculateItemTotal(
							updatedItem.quantity,
							updatedItem.unitPrice
						);
					}

					// Update the item in the array
					newData[tag] = [
						...items.slice(0, itemIndex),
						updatedItem,
						...items.slice(itemIndex + 1),
					];

					// Update parcial values for all sections
					Object.keys(newData).forEach((sectionTag) => {
						const sectionTotal = newData[sectionTag].reduce((sum, item) => {
							return sum + calculateItemTotal(item.quantity, item.unitPrice);
						}, 0);

						newData[sectionTag] = newData[sectionTag].map((item) => {
							const itemTotal = calculateItemTotal(
								item.quantity,
								item.unitPrice
							);
							return {
								...item,
								totalPrice: itemTotal,
								parcial: grandTotal > 0 ? (itemTotal * 100) / grandTotal : 0,
								rubro: grandTotal > 0 ? (sectionTotal * 100) / grandTotal : 0,
							};
						});
					});
				}
				return newData;
			});
		},
		[]
	);

	// Add element to section
	const addElementToSection = useCallback(
		(tag: string, element: PresupuestoItem) => {
			setData((prev) => {
				const newData = { ...prev };
				if (!newData[tag]) {
					newData[tag] = [];
				}
				newData[tag] = [...newData[tag], element];
				return newData;
			});
		},
		[]
	);

	// Delete row from section
	const deleteRow = useCallback((tag: string, itemId: string | number) => {
		setData((prev) => {
			const newData = { ...prev };
			newData[tag] =
				newData[tag]?.filter((item) => String(item.id) !== String(itemId)) ||
				[];
			return newData;
		});
	}, []);

	// Save presupuesto
	const savePresupuesto = useCallback(async () => {
		if (!presupuestoId) return;

		try {
			setLoading(true);
			const response = await fetch(`/api/presupuestos/${presupuestoId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ data }),
			});

			if (!response.ok) throw new Error("Error al guardar el presupuesto.");

			const result = await response.json();
			return result;
		} catch (err) {
			console.error("Error saving data:", err);
			setError("Error al guardar los datos.");
			throw err;
		} finally {
			setLoading(false);
		}
	}, [presupuestoId, data]);

	return {
		data,
		loading,
		error,
		grandTotal,
		sectionRubros,
		sectionIacums,
		fetchData,
		updateData,
		addElementToSection,
		deleteRow,
		savePresupuesto,
	};
}
