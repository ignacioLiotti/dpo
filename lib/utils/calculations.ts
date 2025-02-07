import { PresupuestoItem } from "@/lib/types/presupuesto";
import { GroupedData } from "@/lib/types/common";

export function calculateItemTotal(
	quantity: number = 0,
	unitPrice: number = 0
): number {
	return quantity * unitPrice;
}

export function calculateGrandTotal(
	data: GroupedData<PresupuestoItem>
): number {
	return Object.values(data).reduce((total, items) => {
		return (
			total +
			items.reduce((sectionTotal, item) => {
				return sectionTotal + calculateItemTotal(item.quantity, item.unitPrice);
			}, 0)
		);
	}, 0);
}

export function calculateSectionRubros(
	data: GroupedData<PresupuestoItem>,
	grandTotal: number
): number[] {
	return Object.entries(data).map(([_, items]) => {
		const sectionTotal = items.reduce((sum, item) => {
			return sum + calculateItemTotal(item.quantity, item.unitPrice);
		}, 0);

		return grandTotal > 0 ? (sectionTotal * 100) / grandTotal : 0;
	});
}

export function calculateSectionIacums(
	data: GroupedData<PresupuestoItem>,
	grandTotal: number
): number[] {
	let runningTotal = 0;
	return Object.entries(data).map(([_, items]) => {
		const sectionTotal = items.reduce((sum, item) => {
			return sum + calculateItemTotal(item.quantity, item.unitPrice);
		}, 0);

		runningTotal += sectionTotal;
		return grandTotal > 0 ? (runningTotal * 100) / grandTotal : 0;
	});
}

export function calculateParcialPercentage(
	itemTotal: number,
	grandTotal: number
): number {
	return grandTotal > 0 ? (itemTotal * 100) / grandTotal : 0;
}

export function calculateMedicionAcumulado(
	anterior: number = 0,
	presente: number = 0
): number {
	return anterior + presente;
}
