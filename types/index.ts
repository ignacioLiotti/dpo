export interface Obra {
	"3p": string;
	ainaugurar: string;
	area: string;
	avance: string;
	basico: string;
	clasificacion: string;
	codigoSIG: string;
	departamento: string;
	empresaAdjudicada: string;
	empresaPoliza: string;
	expte: string;
	expte2: string;
	fechaAdjudicacion: string;
	fechaAdjudicacion_1: string;
	fechaContrato: string;
	fechaFin: string;
	fechaInauguracion: string;
	fechaInicio: string;
	fechaLicitacion: string;
	fechaNormaLegal: string;
	id: number;
	idEdificio: string;
	inaugurada: string;
	inspectores: string;
	localidad: string;
	memoriaDesc: string;
	modalidad: string;
	montoContrato: string;
	montoPoliza: string;
	noInaugurado: string;
	nombre: string;
	normaLegalAdjudicacion: string;
	normaLegalLicitacion: string;
	numeroLicitacion: string;
	numeroPoliza: string;
	observaciones: string;
	plazo: string;
	presupuestoOficial: string;
	prioridad: string;
	proyectista: string;
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
	avanceMedicion?: number;
	avanceAcumulado?: number;
	presupuestoTotal?: number;
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
	avanceMedicion?: number;
	avanceAcumulado?: number;
	presupuestoTotal?: number;
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
		totals: boolean;
		editedData: Record<string, any>;
		presupuestoData: Record<string, TableItem[]>;
		progress: CertificadoProgress[];
	};
	created_at: string;
	updated_at: string;
}
