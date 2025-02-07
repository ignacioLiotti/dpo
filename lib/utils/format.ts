export function formatDate(date: string | Date | null | undefined): string {
	if (!date) return "-";
	return new Date(date).toLocaleDateString("es-AR", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function formatCurrency(amount: number | null | undefined): string {
	if (amount === null || amount === undefined) return "-";
	return new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency: "ARS",
	}).format(amount);
}

export function formatNumber(number: number | null | undefined): string {
	if (number === null || number === undefined) return "-";
	return new Intl.NumberFormat("es-AR").format(number);
}

export function formatPercentage(number: number | null | undefined): string {
	if (number === null || number === undefined) return "-";
	return new Intl.NumberFormat("es-AR", {
		style: "percent",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(number / 100);
}
