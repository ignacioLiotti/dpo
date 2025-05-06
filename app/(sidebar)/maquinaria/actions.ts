"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Machine, Operator } from "./types";
import { Database } from "@/lib/database.types";

// Machine Type
export type Machine = {
	id: string;
	type: string;
	specs: string;
	status: string;
	location: string;
	image_url: string | null;
	created_at: string;
};

// Operator Type
export type Operator = {
	id: string;
	name: string;
	certifications: string[];
	status: string;
	created_at: string;
};

// UsageRecord Type
export type UsageRecord = {
	id: string;
	machine_id: string;
	operator_id: string;
	checked_out: string;
	returned: string | null;
	hours_used: number | null;
	comments: string | null;
	created_at: string;
};

// Assignment Type
export type Assignment = {
	id: string;
	machine_id: string;
	operator_id: string;
	assigned_at: string;
	unassigned_at: string | null;
};

// Fetch all machines
export async function getMachines(): Promise<Machine[]> {
	const supabase = await createClient();
	const { data = [] } = await supabase
		.from("machines")
		.select("*")
		.order("created_at", { ascending: false })
		.returns<Machine[]>();
	return data;
}

// Server action to create a new machine from form submission
export async function createMachine(formData: FormData): Promise<void> {
	"use server";
	const type = formData.get("type")?.toString().trim();
	const specs = formData.get("specs")?.toString().trim() || "";
	const location = formData.get("location")?.toString().trim() || "";
	const image_url = formData.get("image_url")?.toString().trim() || null;
	if (!type) throw new Error("Machine type is required");
	const supabase = await createClient();
	const { error } = await supabase
		.from("machines")
		.insert({ type, specs, location, image_url });
	if (error) throw error;
	revalidatePath("/maquinaria");
}

// Update machine details
export async function updateMachine(
	id: string,
	updates: Partial<Omit<Machine, "id" | "created_at">>
): Promise<Machine> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("machines")
		.update(updates)
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	revalidatePath(`/maquinaria/${id}`);
	return data as Machine;
}

// Fetch a machine with usage history and assignments
export async function getMachineById(id: string): Promise<{
	machine: Machine;
	usage: UsageRecord[];
	assignments: Assignment[];
}> {
	const supabase = await createClient();
	const { data: machine, error: mErr } = await supabase
		.from("machines")
		.select("*")
		.eq("id", id)
		.single();
	if (mErr) throw mErr;
	const { data: usage, error: uErr } = await supabase
		.from("usage_records")
		.select("*")
		.eq("machine_id", id)
		.order("checked_out", { ascending: false });
	if (uErr) throw uErr;
	const { data: assignments, error: aErr } = await supabase
		.from("machine_assignments")
		.select("*")
		.eq("machine_id", id)
		.order("assigned_at", { ascending: false });
	if (aErr) throw aErr;
	return {
		machine: machine as Machine,
		usage: usage as UsageRecord[],
		assignments: assignments as Assignment[],
	};
}

// Fetch all operators
export async function getOperators(): Promise<Operator[]> {
	const supabase = await createClient();
	const { data = [] } = await supabase
		.from("operators")
		.select("*")
		.order("name")
		.returns<Operator[]>();
	return data;
}

// Create a new operator
export async function createOperator({
	name,
	certifications,
	status = "Active",
}: {
	name: string;
	certifications: string[];
	status?: string;
}): Promise<Operator> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("operators")
		.insert({ name, certifications, status })
		.select()
		.single();
	if (error) throw error;
	revalidatePath("/maquinaria");
	return data as Operator;
}

// Record a machine checkout
export async function createUsageRecord({
	machine_id,
	operator_id,
	comments,
}: {
	machine_id: string;
	operator_id: string;
	comments?: string;
}): Promise<UsageRecord> {
	const supabase = await createClient();
	const now = new Date().toISOString();
	const { data, error } = await supabase
		.from("usage_records")
		.insert({
			machine_id,
			operator_id,
			checked_out: now,
			comments: comments || null,
		})
		.select()
		.single();
	if (error) throw error;
	revalidatePath(`/maquinaria/${machine_id}`);
	return data as UsageRecord;
}

// Record a machine return
export async function returnUsageRecord(
	id: string,
	hours_used: number
): Promise<UsageRecord> {
	const supabase = await createClient();
	const now = new Date().toISOString();
	const { data, error } = await supabase
		.from("usage_records")
		.update({ returned: now, hours_used })
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	revalidatePath(`/maquinaria`);
	return data as UsageRecord;
}

// Assign machine to operator
export async function assignMachine({
	machine_id,
	operator_id,
}: {
	machine_id: string;
	operator_id: string;
}): Promise<Assignment> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("machine_assignments")
		.insert({ machine_id, operator_id })
		.select()
		.single();
	if (error) throw error;
	revalidatePath(`/maquinaria/${machine_id}`);
	return data as Assignment;
}

// Unassign machine from operator
export async function unassignMachine(id: string): Promise<Assignment> {
	const supabase = await createClient();
	const now = new Date().toISOString();
	const { data, error } = await supabase
		.from("machine_assignments")
		.update({ unassigned_at: now })
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	revalidatePath(`/maquinaria`);
	return data as Assignment;
}

// Server action to record machine usage from form submission
export async function createUsageRecordAction(
	formData: FormData
): Promise<void> {
	"use server";
	const machine_id = formData.get("machine_id")?.toString();
	const operator_id = formData.get("operator_id")?.toString();
	const comments = formData.get("comments")?.toString() || null;
	if (!machine_id || !operator_id)
		throw new Error("Machine and operator are required");
	const supabase = await createClient();
	const now = new Date().toISOString();
	const { error } = await supabase
		.from("usage_records")
		.insert({ machine_id, operator_id, checked_out: now, comments });
	if (error) throw error;
	revalidatePath(`/maquinaria/${machine_id}`);
}

// Server action to assign machine to operator from form submission
export async function assignMachineAction(formData: FormData): Promise<void> {
	"use server";
	const machine_id = formData.get("machine_id")?.toString();
	const operator_id = formData.get("operator_id")?.toString();
	if (!machine_id || !operator_id)
		throw new Error("Machine and operator are required");
	const supabase = await createClient();
	const { error } = await supabase
		.from("machine_assignments")
		.insert({ machine_id, operator_id });
	if (error) throw error;
	revalidatePath(`/maquinaria/${machine_id}`);
}
