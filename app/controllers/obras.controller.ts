import { prisma } from "@/lib/prisma";
import { APIError } from "@/lib/utils/errorHandler";
import { Prisma } from "@prisma/client";

export async function getAllObras() {
	try {
		const obras = await prisma.obras.findMany({
			include: {
				presupuestos: true,
			},
		});

		if (!obras) {
			throw new APIError("No obras found", 404);
		}

		return obras;
	} catch (error) {
		console.error("Error in getAllObras:", error);
		throw error;
	}
}

export async function getObraById(id: number) {
	console.log("getObraById called with id:", id);
	try {
		const obra = await prisma.obras.findFirst({
			where: {
				id: id,
			},
			include: {
				presupuestos: true,
			},
		});

		if (!obra) {
			throw new APIError("Obra not found", 404);
		}

		return obra;
	} catch (error) {
		console.log("Error in getObraById:", error.stack);
		console.error("Error in getObraById:", error);
		throw error;
	}
}

export async function createObra(data: any) {
	return prisma.obras.create({
		data: {
			NombreObra: data.name,
			Monto_Contrato: data.Monto_Contrato,
			plazo: data.plazo,
			Fecha_de_Contrato: data.Fecha_de_Contrato
				? new Date(data.Fecha_de_Contrato)
				: null,
			Fecha_de_Inicio: data.Fecha_de_Inicio
				? new Date(data.Fecha_de_Inicio)
				: null,
			Fecha_de_Finalizaci_n: data.Fecha_de_Finalizaci_n
				? new Date(data.Fecha_de_Finalizaci_n)
				: null,
			Fechalicit: data.Fechalicit ? new Date(data.Fechalicit) : null,
			inaugurada: data.inaugurada || 0,
		},
	});
}

export async function updateObra(id: number, data: Prisma.obrasUpdateInput) {
	try {
		const updateData: Prisma.obrasUpdateInput = {
			NombreObra: data.NombreObra,
			Monto_Contrato: data.Monto_Contrato,
			plazo: data.plazo,
			Fecha_de_Contrato: data.Fecha_de_Contrato,
			Fecha_de_Inicio: data.Fecha_de_Inicio,
			Fecha_de_Finalizaci_n: data.Fecha_de_Finalizaci_n,
			Fechalicit: data.Fechalicit,
			inaugurada: data.inaugurada,
			data: data.data || Prisma.JsonNull,
		};

		return await prisma.obras.update({
			where: {
				IdObras: id,
			},
			data: updateData,
		});
	} catch (error) {
		console.error("Error in updateObra:", error);
		throw error;
	}
}

export async function deleteObra(id: number) {
	const obra = await prisma.obras.findUnique({
		where: { IdObras: id },
	});

	if (!obra) {
		throw new APIError("Obra not found", 404);
	}

	return prisma.obras.delete({
		where: { IdObras: id },
	});
}
