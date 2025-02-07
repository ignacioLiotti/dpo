import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse";
import { head } from "lodash";

const prisma = new PrismaClient();

function sanitizeColumnName(name: string): string {
	console.log(name);
	console.log(name.replace(/[^a-z0-9_]/g, "_").replace(/^[0-9]/, "_$&"));
	return name.replace(/[^a-z0-9_]/g, "_").replace(/^[0-9]/, "_$&");
}

function getColumnName(header: string): string {
	const sanitizedName = sanitizeColumnName(header);
	return sanitizedName === "id" ? "id" : sanitizedName;
}

function inferDecimalPrecisionAndScale(values: string[]): {
	precision: number;
	scale: number;
} {
	let maxWhole = 0;
	let maxFraction = 0;

	for (const value of values) {
		if (value.trim() === "") continue;
		const cleaned = value.replace(/^-/, ""); // Remove minus sign
		const parts = cleaned.split(".");
		const whole = parts[0] || "";
		const fraction = parts[1] || "";
		maxWhole = Math.max(maxWhole, whole.length);
		maxFraction = Math.max(maxFraction, fraction.length);
	}

	const precision = maxWhole + maxFraction;
	return { precision, scale: maxFraction };
}

function inferColumnType(values: string[]): string {
	const nonEmptyValues = values.filter((v) => v.trim() !== "");

	if (nonEmptyValues.length === 0) return "TEXT"; // Default to TEXT if column is empty

	const isInt = nonEmptyValues.every((v) => /^-?\d+$/.test(v));
	if (isInt) return "INT";

	const isFloat = nonEmptyValues.every((v) => /^-?\d+(\.\d+)?$/.test(v));
	if (isFloat) {
		const { precision, scale } = inferDecimalPrecisionAndScale(nonEmptyValues);
		return `DECIMAL(${Math.max(precision, 16)},${Math.min(scale, 4)})`;
	}

	const isDate = nonEmptyValues.every((v) => !isNaN(Date.parse(v)));
	if (isDate) return "DATETIME";

	// Find max length of values
	const maxLength = Math.max(...nonEmptyValues.map((v) => v.length));

	// Convert large VARCHAR to TEXT automatically
	if (maxLength > 191) return "TEXT"; // Anything above VARCHAR(191) becomes TEXT
	if (maxLength > 50) return `VARCHAR(${maxLength})`; // Otherwise, use VARCHAR

	return `VARCHAR(50)`; // Minimum size for shorter values
}

async function parseCSV(
	file: File
): Promise<{ headers: string[]; rows: string[][] }> {
	const text = await file.text();

	return new Promise((resolve, reject) => {
		const rows: string[][] = [];

		parse(text, {
			delimiter: ";", // Match MySQL export settings
			quote: '"', // Standard CSV quote
			escape: "\\", // Allow proper escaping
			relax_quotes: true, // Allow unescaped quotes
			relax_column_count: true, // Prevent column mismatch errors
			trim: true, // Remove extra spaces
			skip_empty_lines: true, // Ignore empty lines
		})
			.on("data", (row: string[], rowIndex: number) => {
				if (rowIndex < 10) console.log(`📌 Row ${rowIndex + 1}:`, row); // Debug first 10 rows
				// Replace escaped quotes with regular quotes
				const cleanedRow = row.map((cell) => cell.replace(/\\\"/g, '"'));
				rows.push(cleanedRow);
			})
			.on("error", (error: { message: string; lines?: number }) => {
				console.error(
					`❌ CSV Parsing Error at Line ${error.lines || "unknown"}:`,
					error.message
				);
				reject(
					new Error(
						`❌ CSV Parsing Error at Line ${error.lines || "unknown"}: ${
							error.message
						}`
					)
				);
			})
			.on("end", () => {
				const headers = rows.shift() || [];
				console.log("📌 CSV Headers:", headers);
				resolve({ headers, rows });
			});
	});
}

function sanitizeDate(value: string): string | null {
	// Handle NULL cases
	if (
		!value ||
		value.trim() === "" ||
		value.trim() === "\\N" ||
		value.toUpperCase() === "\\N"
	) {
		return null;
	}

	try {
		// First check if it's already in YYYY-MM-DD format
		const yyyymmdd = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
		if (yyyymmdd) {
			return value.split(".")[0]; // Remove any milliseconds if present
		}

		// Then try DD/MM/YYYY format
		const ddmmyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
		if (ddmmyyyy) {
			const [, day, month, year] = ddmmyyyy;
			return `${year}-${month.padStart(2, "0")}-${day.padStart(
				2,
				"0"
			)} 00:00:00`;
		}

		// Then try DD-MM-YYYY format
		const ddmmyyyyDash = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
		if (ddmmyyyyDash) {
			const [, day, month, year] = ddmmyyyyDash;
			return `${year}-${month.padStart(2, "0")}-${day.padStart(
				2,
				"0"
			)} 00:00:00`;
		}

		console.warn(`⚠️ Unexpected date format: ${value}`);
		return null;
	} catch (error) {
		console.warn(`⚠️ Error parsing date: ${value}`, error);
		return null;
	}
}

async function createTableFromCSV(
	tableName: string,
	headers: string[],
	rows: string[][]
): Promise<string> {
	if (!headers.length) {
		throw new Error(`❌ No headers found. Cannot create table: ${tableName}`);
	}

	const columnTypes = headers.map((header, index) => {
		const columnValues = rows.map((row) => row[index] || "");
		return inferColumnType(columnValues);
	});

	const columns = headers.map((header, index) => {
		const columnName = getColumnName(header);
		return `${columnName} ${columnTypes[index]}`;
	});

	console.log("📌 Table Columns Definition:\n", columns);

	if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
		throw new Error(`❌ Invalid table name: '${tableName}'`);
	}

	if (columns.length === 0) {
		throw new Error(`❌ No columns found for table '${tableName}'`);
	}

	const createTableSQL = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ${columns.join(",\n      ")}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
  `;

	console.log("🛠 SQL Query to Execute:\n", createTableSQL);

	try {
		if (!createTableSQL || createTableSQL.trim() === "") {
			throw new Error(`❌ SQL query is empty or malformed`);
		}

		const result = await prisma.$executeRawUnsafe(createTableSQL);
		console.log(`✅ Table '${tableName}' created successfully.`, result);
		return tableName;
	} catch (error) {
		if (error instanceof Error) {
			console.error(
				"❌ Error creating table:\n",
				error.stack,
				"\n",
				error.message
			);
			throw new Error(
				`❌ Failed to create table '${tableName}': ${error.message}`
			);
		} else {
			console.error("❌ Unknown error creating table:", error);
			throw new Error(
				`❌ Failed to create table '${tableName}': Unknown error occurred`
			);
		}
	}
}

function sanitizeNumeric(
	value: string,
	isDecimal: boolean = false
): string | number | null {
	if (!value || value.trim() === "") return null;

	let cleaned = value.replace(/[$€£,]/g, "").trim();

	if (isDecimal) {
		cleaned = cleaned.replace(",", ".");
		return parseFloat(cleaned);
	}

	return parseInt(cleaned);
}

async function insertDataIntoTable(
	tableName: string,
	headers: string[],
	rows: string[][]
): Promise<number> {
	if (rows.length === 0) return 0;

	// If we're inserting prices, first validate that all itemIds exist
	if (tableName === "prices") {
		const itemIds = rows
			.map((row) => {
				const itemIdIndex = headers.findIndex((h) => h === "itemId");
				return Number(row[itemIdIndex]);
			})
			.filter((id) => !isNaN(id));

		// Get unique item IDs
		const uniqueItemIds = [...new Set(itemIds)];

		// Check which items exist
		const existingItems = await prisma.items.findMany({
			where: {
				id: {
					in: uniqueItemIds,
				},
			},
			select: {
				id: true,
			},
		});

		const existingItemIds = new Set(existingItems.map((item) => item.id));

		// Find missing items
		const missingItemIds = uniqueItemIds.filter(
			(id) => !existingItemIds.has(id)
		);
		if (missingItemIds.length > 0) {
			throw new Error(
				`Cannot insert prices: Items with IDs ${missingItemIds.join(
					", "
				)} do not exist in the items table`
			);
		}
	}

	const columnMappings: Record<string, string> = {
		fechaContrato: "Fecha de Contrato",
		fechaInicio: "Fecha de Inicio",
		fechaFin: "Fecha de Finalización",
		fechaLicitacion: "FechaLicitacion",
		priceDate: "priceDate",
		unit: "unit",
		name: "name",
		// Add other mappings as needed
	};

	// Filter out empty headers and map them
	let sanitizedHeaders = headers
		.filter((header) => header.trim() !== "")
		.map((header) => columnMappings[header] || header);

	let insertedCount = 0;

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];

		try {
			// Filter out values for empty headers
			let sanitizedRow = row
				.slice(0, headers.length)
				.filter((_, index) => headers[index].trim() !== "")
				.map((value, index) => {
					const header = headers[index];

					// Handle \N values first
					if (!value || value.trim() === "" || value.trim() === "\\N") {
						return null;
					}

					// Special handling for prices table
					if (tableName === "prices") {
						// Handle priceDate column
						if (header === "priceDate") {
							// If it's just a number, assume it's a day of current month/year
							if (/^\d+$/.test(value)) {
								const date = new Date();
								date.setDate(parseInt(value));
								return date.toISOString().slice(0, 19).replace("T", " ");
							}
							const dateValue = sanitizeDate(value);
							if (dateValue === null) {
								console.warn(
									`⚠️ Could not parse date value: ${value} for column ${header}`
								);
							}
							return dateValue;
						}
						// Handle price column
						if (header === "price") {
							// Clean price value by removing multiple dots except the last one
							const cleanedPrice =
								value.split(".").slice(0, -1).join("") +
								"." +
								value.split(".").pop();
							return sanitizeNumeric(cleanedPrice, true);
						}
						// Handle numeric columns
						if (header === "id" || header === "itemId") {
							return Number(value);
						}
					} else if (tableName === "items") {
						// Special handling for items table
						if (header === "id") {
							return Number(value);
						}
						// Clean and normalize text values
						return value.trim().replace(/\\/g, "");
					} else {
						// General handling for other tables
						if (
							header.toLowerCase().includes("monto") ||
							header.toLowerCase().includes("precio") ||
							header.toLowerCase().includes("price")
						)
							return sanitizeNumeric(value, true);
						// Case insensitive check for date fields
						if (
							header.toLowerCase().includes("date") ||
							header.toLowerCase().includes("fecha") ||
							header.toLowerCase().includes("licit") ||
							/fecha|date|licit/i.test(header)
						) {
							const dateValue = sanitizeDate(value);
							if (dateValue === null) {
								console.warn(
									`⚠️ Could not parse date value: ${value} for column ${header}`
								);
							}
							return dateValue;
						}
					}

					return value.trim();
				}) as (string | number | null)[];

			console.log(`📌 Insert Row #${i + 1} Data:`, sanitizedRow);

			if (sanitizedRow.some((val) => val === undefined)) {
				console.error(
					`🚨 Row #${i + 1} contains undefined values:`,
					sanitizedRow
				);
				throw new Error(`Row #${i + 1} has undefined values.`);
			}

			const insertSQL = `
              INSERT INTO \`${tableName}\` (${sanitizedHeaders
				.map((h) => `\`${h}\``)
				.join(", ")})
              VALUES (${sanitizedRow.map(() => "?").join(", ")});
          `;

			console.log(`📌 Insert Row #${i + 1} SQL:`, insertSQL);

			await prisma.$executeRawUnsafe(insertSQL, ...sanitizedRow);
			insertedCount++;
		} catch (error) {
			console.log(
				`❌ Error inserting row #${i + 1} into '${tableName}':`,
				row,
				"\n",
				error instanceof Error ? error.message : String(error)
			);
			throw new Error(
				`Failed to insert data at row #${i + 1} in '${tableName}': ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	console.log(`✅ Inserted ${insertedCount} rows into '${tableName}'`);
	return insertedCount;
}

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File | null;

		if (!file) {
			return NextResponse.json(
				{ error: "❌ No file provided" },
				{ status: 400 }
			);
		}

		console.log(`📂 Processing file: ${file.name}`);

		// Hardcoded flag to skip table creation
		const shouldCreateTable = false;
		console.log(
			"🔥 Skipping table creation as per constant flag: shouldCreateTable is false."
		);

		const { headers, rows } = await parseCSV(file);

		// Log extracted headers
		console.log("🛠 CSV Headers Extracted:", headers);

		if (!headers.length || !rows.length) {
			return NextResponse.json(
				{ error: "❌ CSV file is empty or malformed." },
				{ status: 400 }
			);
		}

		const tableName = sanitizeColumnName(file.name.split(".")[0]);

		// Validate headers before proceeding
		if (headers.some((h) => !h.trim())) {
			throw new Error(`❌ Some headers are empty or invalid: ${headers}`);
		}

		// Validate if rows exist before processing
		if (rows.length === 0) {
			throw new Error(`❌ No data rows found in CSV.`);
		}

		if (shouldCreateTable) {
			// Create table only if flag permits (won't be executed here)
			await createTableFromCSV(tableName, headers, rows);
			console.log("🛠 Table created successfully");
		} else {
			console.log("🔥 Skipping table creation as per constant flag.");
		}

		// Insert data into the table
		const insertedCount = await insertDataIntoTable(tableName, headers, rows);

		return NextResponse.json({
			message: "✅ CSV file processed",
			results: [
				{
					success: true,
					statement: `Table '${tableName}' ${
						shouldCreateTable ? "created/updated" : "skipped creation"
					}, ${insertedCount} rows inserted`,
				},
			],
		});
	} catch (error) {
		if (error instanceof Error) {
			console.error(
				"❌ Error processing CSV file:",
				error.stack,
				"\n",
				error.message
			);
			return NextResponse.json({ error: error.message }, { status: 500 });
		} else {
			console.error("❌ Unknown error processing CSV file:", error);
			return NextResponse.json(
				{ error: "An unknown error occurred while processing the CSV file" },
				{ status: 500 }
			);
		}
	}
}
