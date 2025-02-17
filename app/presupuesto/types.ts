export interface TagObject {
	tags: {
		name: string;
	};
}

export interface Measurement {
	monthlyProgress: number;
	cumulativePrevious: number;
	cumulativeCurrent: number;
}

export interface Measurements {
	[itemId: string]: Measurement;
}

export interface Medicion {
	id: number;
	month: string;
	measurements: {
		[key: string]: {
			monthlyProgress: number;
			cumulativePrevious: number;
			cumulativeCurrent: number;
		};
	};
}

export interface TableItem {
	id: string;
	name: string;
	unit: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	price: number;
	category: string;
	parcial: number;
	rubro: number;
	accumulated: number;
	element_tags?: { tags: { name: string } }[];
	originalUnit?: string;
	originalQuantity?: number;
	originalUnitPrice?: number;
	targetSection?: string;
	nombre?: string;
}

export interface GroupedData {
	[key: string]: TableItem[];
}
