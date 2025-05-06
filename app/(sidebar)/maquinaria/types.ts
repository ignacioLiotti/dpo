export interface Machine {
	id: string;
	type: string;
	specs: any;
	status: "Available" | "In Use" | "Maintenance";
	location: string;
	image_url?: string;
	created_at: string;
	updated_at: string;
}

export interface Operator {
	id: string;
	name: string;
	certifications: string[];
	status: "Available" | "Busy" | "Off Duty";
	created_at: string;
	updated_at: string;
}

export interface UsageRecord {
	id: string;
	machine_id: string;
	operator_id: string;
	checked_out: string;
	returned?: string;
	hours_used?: number;
	comments?: string;
	created_at: string;
}
