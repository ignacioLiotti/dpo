import { BaseItem } from "./common";

export interface MedicionItem extends BaseItem {
	anterior: number;
	presente: number;
	acumulado: number;
}

export interface MedicionData {
	fecha: string;
	items: {
		itemId: string | number;
		anterior: number;
		presente: number;
		acumulado: number;
	}[];
}

export interface Medicion {
	id: number;
	presupuestoId: number;
	data: MedicionData;
	createdAt: string;
	updatedAt: string;
}

export interface MedicionSectionProps {
	presupuestoId: string | number;
	initialData: GroupedMedicionData;
	onSave?: (data: MedicionData) => void;
	highlightChanges?: boolean;
}

export interface GroupedMedicionData {
	[tag: string]: MedicionItem[];
}

export interface MedicionHistoryProps {
	presupuestoId: string | number;
	onMedicionSelect: (medicion: Medicion) => void;
}
