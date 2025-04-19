export interface Obra {
	id: string;
	created_at: string;
	user_id: string;
	nombre: string;
	localidad?: string;
}

export interface Presupuesto {
	id: string;
	created_at: string;
	obra_id: string;
	user_id: string;
	name: string;
}

export interface PresupuestoSection {
	id: string;
	created_at: string;
	presupuesto_id: string;
	user_id: string;
	name: string;
	order_index: number;
	items: PresupuestoItem[];
}

export interface PresupuestoItem {
	id: string;
	created_at: string;
	section_id: string;
	user_id: string;
	order_index: number;
	name: string;
	unit?: string;
	quantity: number;
	unit_price: number;
}

// Calculated fields that we'll compute client-side
export interface PresupuestoItemWithTotals extends PresupuestoItem {
	total_price: number;
	partial_percentage: number;
}

export interface PresupuestoSectionWithTotals extends PresupuestoSection {
	items: PresupuestoItemWithTotals[];
	total: number;
	rubro_percentage: number;
	accumulated_percentage: number;
}
