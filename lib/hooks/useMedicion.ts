import { useState, useCallback, useEffect } from "react";
import {
	MedicionItem,
	MedicionData,
	Medicion,
	GroupedMedicionData,
} from "@/lib/types/medicion";
import { calculateMedicionAcumulado } from "@/lib/utils/calculations";

interface UseMedicionProps {
	presupuestoId: string | number;
	initialData: GroupedMedicionData;
}

export function useMedicion({ presupuestoId, initialData }: UseMedicionProps) {
	const [data, setData] = useState<GroupedMedicionData>(initialData);
	const [mediciones, setMediciones] = useState<Medicion[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch mediciones history
	const fetchMediciones = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`/api/presupuestos/${presupuestoId}/mediciones`
			);
			if (!response.ok) throw new Error("Error al cargar las mediciones.");

			const medicionesData = await response.json();
			setMediciones(medicionesData);

			// If we have mediciones, update the current data with the latest values
			if (medicionesData.length > 0) {
				const lastMedicion = medicionesData[0]; // mediciones are ordered by date desc
				setData((prev) => {
					const newData = { ...prev };
					Object.keys(newData).forEach((tag) => {
						newData[tag] = newData[tag].map((item) => {
							const lastMedicionItem = lastMedicion?.data?.items?.find(
								(mi) => String(mi.itemId) === String(item.id)
							);
							return {
								...item,
								anterior: lastMedicionItem?.acumulado || 0,
								presente: 0,
								acumulado: lastMedicionItem?.acumulado || 0,
							};
						});
					});
					return newData;
				});
			}
		} catch (err) {
			console.error("Error fetching mediciones:", err);
			setError("Error al cargar las mediciones.");
		} finally {
			setLoading(false);
		}
	}, [presupuestoId]);

	// Load latest medicion values on mount
	useEffect(() => {
		fetchMediciones();
	}, [fetchMediciones]);

	// Reset to latest medicion values
	const resetToLatestMedicion = useCallback(() => {
		if (!mediciones.length) return;

		const lastMedicion = mediciones[0]; // mediciones are ordered by date desc
		setData((prev) => {
			const newData = { ...prev };
			Object.keys(newData).forEach((tag) => {
				newData[tag] = newData[tag].map((item) => {
					const lastMedicionItem = lastMedicion?.data?.items?.find(
						(mi) => String(mi.itemId) === String(item.id)
					);
					return {
						...item,
						anterior: lastMedicionItem?.acumulado || 0,
						presente: 0,
						acumulado: lastMedicionItem?.acumulado || 0,
					};
				});
			});
			return newData;
		});
	}, [mediciones]);

	// View specific medicion details
	const viewMedicionDetail = useCallback((medicion: Medicion) => {
		setData((prev) => {
			const newData = { ...prev };
			Object.keys(newData).forEach((tag) => {
				newData[tag] = newData[tag].map((item) => {
					const medicionItem = medicion.data.items.find(
						(mi) => String(mi.itemId) === String(item.id)
					);
					return {
						...item,
						anterior: medicionItem?.anterior || 0,
						presente: medicionItem?.presente || 0,
						acumulado: medicionItem?.acumulado || 0,
					};
				});
			});
			return newData;
		});
	}, []);

	// Update medicion data
	const updateData = useCallback(
		(
			tag: string,
			itemId: string | number,
			key: keyof MedicionItem,
			value: string
		) => {
			setData((prev) => {
				const newData = { ...prev };
				const itemIndex = newData[tag].findIndex(
					(item) => String(item.id) === String(itemId)
				);

				if (itemIndex === -1) return prev;

				const item = { ...newData[tag][itemIndex] };
				const numValue = parseFloat(value) || 0;

				if (key === "presente") {
					item.presente = numValue;
					item.acumulado = calculateMedicionAcumulado(item.anterior, numValue);
				}

				newData[tag][itemIndex] = item;
				return newData;
			});
		},
		[]
	);

	// Save new medicion
	const saveMedicion = useCallback(async () => {
		try {
			setLoading(true);
			// Validate that at least one item has a presente value
			const hasChanges = Object.values(data)
				.flat()
				.some((item) => (item.presente || 0) > 0);

			if (!hasChanges) {
				throw new Error(
					'Debe ingresar al menos un valor en la columna "Presente" antes de guardar.'
				);
			}

			// Prepare medicion data
			const medicionData: MedicionData = {
				fecha: new Date().toISOString(),
				items: Object.values(data)
					.flat()
					.map((item) => ({
						itemId: item.id,
						anterior: item.anterior || 0,
						presente: item.presente || 0,
						acumulado: calculateMedicionAcumulado(
							item.anterior || 0,
							item.presente || 0
						),
					})),
			};

			// Save medicion
			const response = await fetch(
				`/api/presupuestos/${presupuestoId}/mediciones`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(medicionData),
				}
			);

			if (!response.ok) throw new Error("Error al guardar la medición.");

			// Refresh mediciones list and reset form
			await fetchMediciones();

			return true;
		} catch (err) {
			console.error("Error saving medicion:", err);
			setError(
				err instanceof Error ? err.message : "Error al guardar la medición."
			);
			throw err;
		} finally {
			setLoading(false);
		}
	}, [presupuestoId, data, fetchMediciones]);

	return {
		data,
		mediciones,
		loading,
		error,
		fetchMediciones,
		resetToLatestMedicion,
		viewMedicionDetail,
		updateData,
		saveMedicion,
	};
}
