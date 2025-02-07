import { prisma } from "@/lib/prisma";
import { APIError } from "@/lib/utils/errorHandler";

export async function getPresupuestosByObraId(obraId: number) {
	try {
		const presupuestos = await prisma.presupuestos.findMany({
			where: {
				id: obraId,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return presupuestos;
	} catch (error) {
		console.error("Error in getPresupuestosByObraId:", error);
		throw new APIError("Failed to fetch presupuestos");
	}
}

export async function getPresupuestoById(id: number) {
	const presupuesto = await prisma.presupuestos.findUnique({
		where: { id },
		include: {
			obra: true,
		},
	});

	if (!presupuesto) {
		throw new APIError("Presupuesto not found", 404);
	}

	return presupuesto;
}

export async function createPresupuesto(obraId: number, data: any) {
	try {
		// First check if the obra exists
		const obra = await prisma.obras.findUnique({
			where: {
				IdObras: obraId,
			},
		});

		if (!obra) {
			throw new APIError("Obra not found", 404);
		}

		// Create the presupuesto
		const presupuesto = await prisma.presupuestos.create({
			data: {
				obraId: obraId,
				data: data,
			},
		});

		return presupuesto;
	} catch (error) {
		console.error("Error in createPresupuesto:", error);
		if (error instanceof APIError) {
			throw error;
		}
		throw new APIError("Failed to create presupuesto");
	}
}

export async function updatePresupuesto(id: number, data: any) {
	try {
		const presupuesto = await prisma.presupuestos.update({
			where: {
				id: id,
			},
			data: {
				data: data,
			},
		});

		return presupuesto;
	} catch (error) {
		console.error("Error in updatePresupuesto:", error);
		throw new APIError("Failed to update presupuesto");
	}
}

export async function deletePresupuesto(id: number) {
	try {
		const presupuesto = await prisma.presupuestos.delete({
			where: {
				id: id,
			},
		});

		return presupuesto;
	} catch (error) {
		console.error("Error in deletePresupuesto:", error);
		throw new APIError("Failed to delete presupuesto");
	}
}
