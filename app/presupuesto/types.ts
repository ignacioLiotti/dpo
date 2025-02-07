// Base item interface with common properties
export interface BaseItem {
	id: string | number;
	name: string;
	category: string;
}

// Presupuesto-specific item interface
export interface PresupuestoItem extends BaseItem {
	unit: string;
	price: number;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	accumulated?: string | number;
	parcial?: number;
	rubro?: string | number;
	element_tags?: Array<{ tags: { name: string } }>;
	originalUnit?: string;
}

// Medicion-specific item interface
export interface MedicionItem extends BaseItem {
	anterior: number;
	presente: number;
	acumulado: number;
}

// Grouped data interfaces
export interface GroupedPresupuestoData {
	[tag: string]: PresupuestoItem[];
}

export interface GroupedMedicionData {
	[tag: string]: MedicionItem[];
}

// Medicion data interfaces
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
