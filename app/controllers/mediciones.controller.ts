import { prisma } from "@/lib/prisma";
import { APIError } from "@/lib/utils/errorHandler";

interface Medicion {
	id: number;
	presupuestoId: number;
	data: any;
	createdAt: Date;
	updatedAt: Date;
}

interface MedicionWithPresupuesto extends Medicion {
	presupuesto: {
		id: number;
		obraId: number;
		data: any;
		createdAt: Date;
		updatedAt: Date;
	};
}

export async function getMedicionesByPresupuestoId(presupuestoId: number) {
	const mediciones = await prisma.$queryRaw<Medicion[]>`
    SELECT * FROM mediciones 
    WHERE presupuestoId = ${presupuestoId}
    ORDER BY createdAt DESC
  `;

	if (!mediciones || mediciones.length === 0) {
		throw new APIError("No mediciones found for this presupuesto", 404);
	}

	return mediciones;
}

export async function getMedicionById(id: number) {
	const [medicion] = await prisma.$queryRaw<MedicionWithPresupuesto[]>`
    SELECT m.*, p.* 
    FROM mediciones m
    LEFT JOIN presupuestos p ON m.presupuestoId = p.id
    WHERE m.id = ${id}
  `;

	if (!medicion) {
		throw new APIError("Medicion not found", 404);
	}

	return medicion;
}

export async function createMedicion(presupuestoId: number, data: any) {
	// First check if the presupuesto exists
	const presupuesto = await prisma.presupuestos.findUnique({
		where: { id: presupuestoId },
	});

	if (!presupuesto) {
		throw new APIError("Presupuesto not found", 404);
	}

	const now = new Date();
	const [medicion] = await prisma.$queryRaw<Medicion[]>`
    INSERT INTO mediciones (presupuestoId, data, createdAt, updatedAt)
    VALUES (${presupuestoId}, ${JSON.stringify(
		data.data || {}
	)}, ${now}, ${now})
    RETURNING *
  `;

	return medicion;
}

export async function updateMedicion(id: number, data: any) {
	const [existingMedicion] = await prisma.$queryRaw<Medicion[]>`
    SELECT * FROM mediciones WHERE id = ${id}
  `;

	if (!existingMedicion) {
		throw new APIError("Medicion not found", 404);
	}

	const now = new Date();
	const [medicion] = await prisma.$queryRaw<Medicion[]>`
    UPDATE mediciones 
    SET data = ${JSON.stringify(data.data)}, updatedAt = ${now}
    WHERE id = ${id}
    RETURNING *
  `;

	return medicion;
}

export async function deleteMedicion(id: number) {
	const [existingMedicion] = await prisma.$queryRaw<Medicion[]>`
    SELECT * FROM mediciones WHERE id = ${id}
  `;

	if (!existingMedicion) {
		throw new APIError("Medicion not found", 404);
	}

	await prisma.$queryRaw`
    DELETE FROM mediciones WHERE id = ${id}
  `;

	return null;
}
