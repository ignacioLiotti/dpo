#!/usr/bin/env node
const mysql = require("mysql2/promise");

/** 1) DB Configurations */
// Update these configurations with your actual database credentials
const OLD_DB_CONFIG = {
	host: "localhost",
	user: "root",
	password: "Ibl2000",
	database: "test",
};

const NEW_DB_CONFIG = {
	host: "localhost",
	user: "root",
	password: "Ibl2000",
	database: "testresult",
};

/** 2) Build Month-to-Date Mapping (e.g., 'ene-09' => '2009-01-01') */
const MONTH_MAP = {
	ene: "01",
	feb: "02",
	mar: "03",
	abr: "04",
	may: "05",
	jun: "06",
	jul: "07",
	ago: "08",
	sep: "09",
	oct: "10",
	nov: "11",
	dic: "12",
};

function buildMonthToDate() {
	const map = {};
	for (let year = 2009; year <= 2025; year++) {
		const yearSuffix = String(year).slice(-2); // e.g., '09' for 2009
		for (const [abbr, monthNum] of Object.entries(MONTH_MAP)) {
			const colName = `${abbr}-${yearSuffix}`; // e.g., 'ene-09'
			const isoDate = `${year}-${monthNum}-01`; // e.g., '2009-01-01'
			map[colName] = isoDate;
		}
	}
	console.log("MONTH_TO_DATE Mapping:", map); // Debug log
	return map;
}
const MONTH_TO_DATE = buildMonthToDate();

/** 3) Define Category Detection Logic */
// Category rows are identified by having a NULL or empty 'unid' value.
// If 'unidCol' is not provided for a table, assign a default category based on 'typeValue'.
function isCategoryRow(row, unidCol) {
	if (!unidCol) return false; // No 'unidCol' defined for this table
	const unidValue = row[unidCol];
	return (
		unidValue === null ||
		unidValue === undefined ||
		unidValue.toString().trim() === ""
	);
}

/** 4) Migrate a Single Table with Batch Inserts */
async function migrateTable(oldConn, newConn, config, batchSize = 1000) {
	const { tableName, itemNameCol, unidCol, codCol, publicarCol, typeValue } =
		config;

	console.log(`\nMigrating table: ${tableName}`);

	// Fetch table columns
	const [columns] = await oldConn.execute(`DESCRIBE \`${tableName}\``);
	const columnNames = columns.map((col) => col.Field);

	// Verify required columns
	const requiredCols = [itemNameCol];
	if (codCol) requiredCols.push(codCol);
	if (unidCol) requiredCols.push(unidCol);
	if (publicarCol) requiredCols.push(publicarCol);

	const missingCols = requiredCols.filter((col) => !columnNames.includes(col));
	if (missingCols.length > 0) {
		console.error(
			`  Error: Missing columns in table '${tableName}': ${missingCols.join(
				", "
			)}. Skipping this table.`
		);
		return;
	}

	// Fetch all rows, ordered by 'codCol' if it exists
	let sql = `SELECT * FROM \`${tableName}\``;
	if (codCol && columnNames.includes(codCol)) {
		sql += ` ORDER BY \`${codCol}\` ASC`;
	}
	const [rows] = await oldConn.execute(sql);

	let currentCategory = null;

	// If the table does not have 'unidCol', assign default category based on 'typeValue'
	if (!unidCol) {
		currentCategory = typeValue.charAt(0).toUpperCase() + typeValue.slice(1);
		console.log(
			`  Assigned default category: "${currentCategory}" for all items in table "${tableName}"`
		);
	}

	// Arrays to hold batch data
	let itemsBatch = [];
	let itemPricesBatch = [];

	for (const row of rows) {
		const isCategory = isCategoryRow(row, unidCol);

		if (isCategory) {
			const categoryName =
				row[itemNameCol] !== null
					? row[itemNameCol].toString().trim()
					: `Category`;
			currentCategory = categoryName;
			console.log(
				`  Detected new category: "${currentCategory}" (ID: ${
					row[codCol] || "N/A"
				})`
			);
			continue;
		}

		// Extract relevant fields
		let cod = "";
		if (codCol && columnNames.includes(codCol) && row[codCol] !== null) {
			cod = row[codCol].toString();
		} else if (codCol && !columnNames.includes(codCol)) {
			console.error(
				`  Error: 'codCol' '${codCol}' is missing in table '${tableName}'. Skipping row.`
			);
			continue;
		}

		const itemName =
			row[itemNameCol] !== null ? row[itemNameCol].toString().trim() : "";
		const unid =
			unidCol && row[unidCol] !== null ? row[unidCol].toString().trim() : null;
		const publicar =
			publicarCol && row[publicarCol] !== null
				? row[publicarCol].toString().trim()
				: null;

		if (!itemName) {
			console.log(`  Skipping row with Cod: ${cod} due to empty item_name.`);
			continue;
		}

		// Add item to itemsBatch
		itemsBatch.push([
			cod,
			publicar,
			itemName,
			unid,
			currentCategory,
			typeValue,
			tableName,
		]);

		// Prepare prices for this item
		const itemPrices = [];
		for (const [colName, priceValue] of Object.entries(row)) {
			if (MONTH_TO_DATE.hasOwnProperty(colName)) {
				if (
					priceValue !== null &&
					priceValue !== undefined &&
					priceValue !== ""
				) {
					const dateStr = MONTH_TO_DATE[colName];
					itemPrices.push({ date: dateStr, price: priceValue });
				}
			}
			// Handle additional patterns if necessary
		}

		itemPricesBatch.push(itemPrices);

		// Execute batch inserts if batch size is reached
		if (itemsBatch.length >= batchSize) {
			await insertItemsAndPrices(newConn, itemsBatch, itemPricesBatch);
			itemsBatch = [];
			itemPricesBatch = [];
		}
	}

	// Insert any remaining items
	if (itemsBatch.length > 0) {
		await insertItemsAndPrices(newConn, itemsBatch, itemPricesBatch);
	}

	console.log(`  Finished migrating table: ${tableName}`);
}

/** Helper Function to Insert Items and Prices */
async function insertItemsAndPrices(newConn, itemsBatch, itemPricesBatch) {
	const insertItemsSQL = `
		INSERT INTO items (cod, publicar, item_name, unid, category, type, origin_table)
		VALUES ?
	`;
	try {
		const [itemResult] = await newConn.query(insertItemsSQL, [itemsBatch]);
		const insertedIds = [];
		for (let i = 0; i < itemsBatch.length; i++) {
			insertedIds.push(itemResult.insertId + i);
		}

		console.log(`    Inserted Items IDs:`, insertedIds);

		const pricesToInsert = [];
		for (let i = 0; i < insertedIds.length; i++) {
			const itemId = insertedIds[i];
			const prices = itemPricesBatch[i] || [];
			for (const price of prices) {
				// Validate data before insertion
				if (isValidDate(price.date) && isValidPrice(price.price)) {
					pricesToInsert.push([itemId, price.date, price.price]);
				} else {
					console.warn(`    Invalid price data for item ${itemId}:`, price);
				}
			}
		}

		console.log(`    Total Prices to Insert: ${pricesToInsert.length}`);

		if (pricesToInsert.length > 0) {
			const insertPricesSQL = `
				INSERT INTO prices (item_id, price_date, price)
				VALUES ?
			`;
			await newConn.query(insertPricesSQL, [pricesToInsert]);
			console.log(`    Inserted ${pricesToInsert.length} price records.`);
		} else {
			console.log(`    No prices to insert for this batch.`);
		}
	} catch (error) {
		console.error("  Error during batch insert:", error.message);
		throw error; // Re-throw to handle in the calling function
	}
}

/** Helper Functions for Data Validation */
function isValidDate(dateStr) {
	return !isNaN(Date.parse(dateStr));
}

function isValidPrice(price) {
	return typeof price === "number" && !isNaN(price);
}

/** 5) Main Migration Function */
(async function main() {
	try {
		// Connect to old and new databases
		const oldConn = await mysql.createConnection(OLD_DB_CONFIG);
		const newConn = await mysql.createConnection(NEW_DB_CONFIG);

		// Start a transaction
		await newConn.beginTransaction();

		// Create new normalized tables
		console.log("Creating new tables...");
		const TABLE_CREATION_SQL = `
			DROP TABLE IF EXISTS prices;
			DROP TABLE IF EXISTS items;

			CREATE TABLE items (
				id INT AUTO_INCREMENT PRIMARY KEY,
				cod VARCHAR(255) NOT NULL,
				publicar VARCHAR(255) DEFAULT NULL,
				item_name VARCHAR(255) NOT NULL,
				unid VARCHAR(255) DEFAULT NULL,
				category VARCHAR(255) DEFAULT NULL,
				type VARCHAR(255) DEFAULT NULL,
				origin_table VARCHAR(255) DEFAULT NULL
			);

			CREATE TABLE prices (
				id INT AUTO_INCREMENT PRIMARY KEY,
				item_id INT NOT NULL,
				price_date DATE NOT NULL,
				price DOUBLE DEFAULT NULL,
				FOREIGN KEY (item_id) REFERENCES items(id)
			);
		`;

		// Execute each statement separately
		for (const stmt of TABLE_CREATION_SQL.split(";")) {
			const trimmedStmt = stmt.trim();
			if (trimmedStmt) {
				await newConn.execute(trimmedStmt);
			}
		}
		console.log("New tables created successfully.");

		// Define migration configurations for each old table
		const migrationConfigs = [
			{
				tableName: "materiales",
				itemNameCol: "material",
				unidCol: "unid", // Ensure 'unid' column exists and is used correctly
				codCol: "Cod",
				publicarCol: "publicar",
				typeValue: "material",
			},
			{
				tableName: "indices",
				itemNameCol: "INDICE",
				unidCol: "unid", // Ensure 'unid' column exists and is used correctly
				codCol: "Cod",
				publicarCol: "publicar",
				typeValue: "indice",
			},
			{
				tableName: "item",
				itemNameCol: "Item",
				unidCol: "unid", // Ensure 'unid' column exists and is used correctly
				codCol: "Cod",
				publicarCol: "publicar",
				typeValue: "item",
			},
			{
				tableName: "jornales",
				itemNameCol: "obrero",
				unidCol: null, // Indicates no 'unid' column
				codCol: "id_jornal", // Replace with the actual unique identifier column name
				publicarCol: null, // Indicates no 'publicar' column
				typeValue: "jornal", // Sets the 'type' field in the new 'items' table
			},
			// Add more configurations here if you have additional tables
		];

		// Iterate over each migration configuration and migrate
		for (const config of migrationConfigs) {
			await migrateTable(oldConn, newConn, config);
		}

		// Commit the transaction
		await newConn.commit();
		console.log("\nMigration completed successfully!");

		// Close database connections
		await oldConn.end();
		await newConn.end();
	} catch (error) {
		console.error("An error occurred during migration:", error);
		try {
			await newConn.rollback();
			console.log("Transaction rolled back due to errors.");
		} catch (rollbackError) {
			console.error("Error during rollback:", rollbackError.message);
		}
		process.exit(1);
	}
})();
