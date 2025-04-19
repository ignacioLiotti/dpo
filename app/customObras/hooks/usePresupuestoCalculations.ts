import { useMemo } from "react";
import type {
	PresupuestoSection,
	PresupuestoItem,
	PresupuestoSectionWithTotals,
	PresupuestoItemWithTotals,
} from "@/types/presupuesto";

export function usePresupuestoCalculations(sections: PresupuestoSection[]) {
	return useMemo(() => {
		// First calculate the grand total across all sections
		const grandTotal = sections.reduce((total, section) => {
			return (
				total +
				section.items.reduce((sectionTotal, item) => {
					return sectionTotal + item.quantity * item.unit_price;
				}, 0)
			);
		}, 0);

		// Then calculate section totals and percentages
		let accumulatedPercentage = 0;
		const sectionsWithTotals: PresupuestoSectionWithTotals[] = sections.map(
			(section) => {
				const items = section.items.map((item): PresupuestoItemWithTotals => {
					const total_price = item.quantity * item.unit_price;
					return {
						...item,
						total_price,
						partial_percentage: (total_price / grandTotal) * 100,
					};
				});

				const sectionTotal = items.reduce(
					(total, item) => total + item.total_price,
					0
				);
				const rubroPercentage = (sectionTotal / grandTotal) * 100;
				accumulatedPercentage += rubroPercentage;

				return {
					...section,
					items,
					total: sectionTotal,
					rubro_percentage: rubroPercentage,
					accumulated_percentage: accumulatedPercentage,
				};
			}
		);

		return {
			grandTotal,
			sectionsWithTotals,
		};
	}, [sections]);
}
