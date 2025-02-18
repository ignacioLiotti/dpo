export interface Obra {
	id: number;
	nombre: string;
	montoContrato: number;
	ubicacion: string;
	idEmpresa: string;
	idReparticion: string;
	idAvance: string;
	idInspectores: string;
	idProyectista: string;
	responsableProyecto: string;
	idLocalidad: string;
	departamento: string;
	plazo: string;
	fecha_contrato: string;
	fecha_inicio: string;
	fecha_fin: string;
	estado: string;
	Fechalicit: string;
	Edificio: string;
	prioridad: string;
	Proyecto: string;
	inaugurada: string;
	fechaInauguracion: string;
	created_at: string;
	updated_at: string;
	data: string;
}

export interface Presupuesto {
	id: number;
	obra_id: number;
	nombre: string;
	total: number;
	data: Record<string, TableItem[]>;
	created_at: string;
	updated_at: string;
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
	targetSection?: string;
	element_tags?: Array<{
		tags: {
			name: string;
		};
	}>;
}

export interface GroupedData {
	[key: string]: TableItem[];
}

export interface PresupuestoSection {
	nombre: string;
	items: TableItem[];
}

export interface MedicionItem {
	id: string;
	anterior: number;
	presente: number;
	acumulado: number;
}

export interface MedicionSection {
	nombre: string;
	items: MedicionItem[];
}

export interface Medicion {
	id: number;
	obra_id: number;
	presupuesto_id: number;
	periodo: string;
	data: {
		secciones: MedicionSection[];
	};
	created_at: string;
	updated_at: string;
}

export interface MedicionInput {
	id: number;
	obra_id: number;
	periodo: string;
	data: {
		secciones: Array<{
			nombre: string;
			items: Array<{
				id: string;
				anterior: number;
				presente: number;
				acumulado: number;
			}>;
		}>;
	};
	created_at: string;
	updated_at: string;
}

export interface CertificadoProgress {
	month: string;
	value1: number;
	value2: number;
	value3: number;
}

export interface Certificado {
	id: number;
	obra_id: number;
	medicion_id: number;
	periodo: string;
	data: {
		editedData: Record<string, any>;
		presupuestoData: Record<string, TableItem[]>;
		progress: CertificadoProgress[];
	};
	created_at: string;
	updated_at: string;
}
