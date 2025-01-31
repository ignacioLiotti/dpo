import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Debug log for DATABASE_URL
console.log(
	"DATABASE_URL first characters:",
	process.env.DATABASE_URL?.substring(0, 20)
);

export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		log: ["query", "error", "warn"], // Added more logging
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
