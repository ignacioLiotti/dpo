import { PrismaClient } from "@prisma/client";

// Create two Prisma clients - one for source and one for destination
const sourceDb = new PrismaClient({
	datasources: {
		db: {
			url: process.env.SOURCE_DATABASE_URL, // Your local database URL
		},
	},
});

const destDb = new PrismaClient({
	datasources: {
		db: {
			url: process.env.DATABASE_URL, // Your Neon database URL
		},
	},
});

async function migrateData() {
	try {
		// Migrate obras
		console.log("Migrating obras...");
		const obras = await sourceDb.obras.findMany();
		for (const obra of obras) {
			await destDb.obras.create({
				data: obra,
			});
		}
		console.log(`Migrated ${obras.length} obras`);

		// Migrate empresas
		console.log("Migrating empresas...");
		const empresas = await sourceDb.empresas.findMany();
		for (const empresa of empresas) {
			await destDb.empresas.create({
				data: empresa,
			});
		}
		console.log(`Migrated ${empresas.length} empresas`);

		// Add more tables as needed...
	} catch (error) {
		console.error("Migration failed:", error);
	} finally {
		await sourceDb.$disconnect();
		await destDb.$disconnect();
	}
}

migrateData();
