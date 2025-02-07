import { BaseItem } from "./common";

export interface PresupuestoItem {
	id: string;
	code: string;
	name: string;
	unit: string;
	quantity: number;
	unitPrice: number;
	total: number;
	tag?: string;
}

export interface MedicionItem extends PresupuestoItem {
	anterior: number; // Previous completion percentage
	presente: number; // Current period completion percentage
	acumulado: number; // Total accumulated percentage
	completedAmount: number; // Monetary amount completed
}

export interface GroupedPresupuestoData {
	[key: string]: PresupuestoItem[];
}

export interface GroupedMedicionData {
	[key: string]: MedicionItem[];
}

export interface PresupuestoData {
	id: number;
	obraId: number;
	totalAmount: number;
	isActive: boolean;
	data: GroupedPresupuestoData;
	createdAt: string;
	updatedAt: string;
}

export interface MedicionData {
	id: number;
	presupuestoId: number;
	fecha: string;
	totalCompleted: number;
	completedPercentage: number;
	data: GroupedMedicionData;
	createdAt: string;
	updatedAt: string;
}

export interface PresupuestoSectionProps {
	tag: string;
	tagIndex: number;
	items: PresupuestoItem[];
	previewVersion: "false" | "medicion" | "parcial";
	grandTotal: number;
	sectionRubros: number[];
	sectionIacums: number[];
	updateData: (
		itemId: string | number,
		key: keyof PresupuestoItem,
		value: string
	) => void;
	handleDeleteRow: (itemId: string | number) => void;
	addElementToSection?: (element: PresupuestoItem) => void;
	allElements?: PresupuestoItem[];
	highlightChanges?: boolean;
}

export interface PresupuestoPageProps {
	id: string;
	initialData?: GroupedPresupuestoData;
}
