import { prisma } from "@/lib/prisma";
import { APIError } from "@/lib/utils/errorHandler";

export type DataType = "obra" | "presupuesto" | "medicion";

export async function getData(type: DataType, id?: number) {
	try {
		switch (type) {
			case "obra":
				return id
					? await prisma.obras.findUnique({
							where: { id },
							include: {
								presupuestos: true,
							},
					  })
					: await prisma.obras.findMany({
							include: {
								presupuestos: true,
							},
					  });

			case "presupuesto":
				return id
					? await prisma.presupuestos.findUnique({
							where: { id },
							include: {
								mediciones: true,
								obra: true,
							},
					  })
					: await prisma.presupuestos.findMany({
							include: {
								mediciones: true,
								obra: true,
							},
					  });

			case "medicion":
				return id
					? await prisma.mediciones.findUnique({
							where: { id },
							include: {
								presupuesto: true,
							},
					  })
					: await prisma.mediciones.findMany({
							include: {
								presupuesto: true,
							},
					  });

			default:
				throw new APIError("Tipo de dato no válido");
		}
	} catch (error) {
		console.error("Error en getData:", error);
		throw new APIError("Error al obtener datos");
	}
}

export async function createData(type: DataType, data: any) {
	try {
		switch (type) {
			case "obra":
				return await prisma.obras.create({ data });
			case "presupuesto":
				return await prisma.presupuestos.create({ data });
			case "medicion":
				return await prisma.mediciones.create({ data });
			default:
				throw new APIError("Tipo de dato no válido");
		}
	} catch (error) {
		console.error("Error en createData:", error);
		throw new APIError("Error al crear datos");
	}
}

export async function updateData(type: DataType, id: number, data: any) {
	try {
		switch (type) {
			case "obra":
				return await prisma.obras.update({ where: { id }, data });
			case "presupuesto":
				return await prisma.presupuestos.update({ where: { id }, data });
			case "medicion":
				return await prisma.mediciones.update({ where: { id }, data });
			default:
				throw new APIError("Tipo de dato no válido");
		}
	} catch (error) {
		console.error("Error en updateData:", error);
		throw new APIError("Error al actualizar datos");
	}
}

export async function deleteData(type: DataType, id: number) {
	try {
		switch (type) {
			case "obra":
				return await prisma.obras.delete({ where: { id } });
			case "presupuesto":
				return await prisma.presupuestos.delete({ where: { id } });
			case "medicion":
				return await prisma.mediciones.delete({ where: { id } });
			default:
				throw new APIError("Tipo de dato no válido");
		}
	} catch (error) {
		console.error("Error en deleteData:", error);
		throw new APIError("Error al eliminar datos");
	}
}
