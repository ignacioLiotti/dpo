import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Split SQL text into statements by semicolon,
 * ignoring semicolons inside quoted strings.
 */
/**
 * Splits a SQL string into separate statements by semicolons
 * that appear *outside* of single or double quotes.
 *
 * 1. Tracks whether we're in a single-quoted or double-quoted string.
 * 2. Logs each character index, current state, and whether we skip semicolons in quotes.
 * 3. Handles doubled single quotes ('') so they don't prematurely end a string.
 *
 * @param sql The full SQL dump as a string.
 * @returns An array of statement strings, each trimmed, in the order they appear.
 */
/**
 * Splits a SQL string into separate statements by semicolons
 * that appear *outside* of single or double quotes.
 *
 * This version has been updated to also handle backslash-escaped characters
 * inside quotes.
 *
 * @param sql The full SQL dump as a string.
 * @returns An array of statement strings, each trimmed.
 */
function splitSQLStatements(sql: string): string[] {
	const statements: string[] = [];
	let current = "";
	let inSingleQuote = false;
	let inDoubleQuote = false;

	for (let i = 0; i < sql.length; i++) {
		const char = sql[i];

		// If we are inside any quoted string and we see a backslash,
		// append it and the next character without any further checks.
		if ((inSingleQuote || inDoubleQuote) && char === "\\") {
			current += char;
			if (i + 1 < sql.length) {
				current += sql[i + 1];
				i++; // skip the next char
			}
			continue;
		}

		if (!inSingleQuote && !inDoubleQuote) {
			// We are outside of any quotes.
			if (char === "'") {
				inSingleQuote = true;
				current += char;
			} else if (char === '"') {
				inDoubleQuote = true;
				current += char;
			} else if (char === ";") {
				// A semicolon outside of quotes marks the end of a statement.
				const trimmed = current.trim();
				if (trimmed) {
					statements.push(trimmed);
				}
				current = "";
			} else {
				current += char;
			}
		} else if (inSingleQuote) {
			// We are inside a single-quoted string.
			if (char === "'") {
				// Check if it is an escaped single quote by doubling (i.e. '')
				if (i + 1 < sql.length && sql[i + 1] === "'") {
					current += "'";
					i++; // skip the next quote
				} else {
					inSingleQuote = false;
					current += "'";
				}
			} else {
				current += char;
			}
		} else if (inDoubleQuote) {
			// We are inside a double-quoted string.
			if (char === '"') {
				if (i + 1 < sql.length && sql[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inDoubleQuote = false;
					current += '"';
				}
			} else {
				current += char;
			}
		}
	}

	// Append any leftover text as the final statement.
	const leftover = current.trim();
	if (leftover.length > 0) {
		statements.push(leftover);
	}
	return statements;
}

/**
 * Transform MySQL-specific syntax into Postgres-friendly SQL.
 */
function transformMySQLtoPostgres(stmt: string): string {
	// 1) Remove MySQL comments (/* ... */, -- ...)
	//    (We do it inline so we don't break quoted text.)
	//    If your file has block comments or mid-statement line comments,
	//    you might want to remove them earlier, but carefully.
	let sql = stmt
		// Remove block comments
		.replace(/\/\*[\s\S]*?\*\//g, "")
		// Remove line comments not in quotes (naive approach—be careful if you have `--` inside strings)
		.replace(/-- .*/g, "");

	// 2) Replace backticks with double quotes
	sql = sql.replace(/`/g, '"');

	// 3) Remove or replace MySQL engine/charset
	sql = sql
		.replace(/ENGINE=InnoDB[^,)]*/gi, "")
		.replace(/AUTO_INCREMENT=\d+/gi, "")
		.replace(/CHARACTER SET [^\s,]+/gi, "")
		.replace(/COLLATE [^\s,]+/gi, "")
		.replace(/DEFAULT CHARSET=[^\s;]+/gi, "");

	// 4) Convert MySQL data types to Postgres
	sql = sql
		.replace(/int\(\d+\)/gi, "integer")
		.replace(/datetime/gi, "timestamp")
		.replace(/double/gi, "double precision")
		.replace(/longtext/gi, "text")
		.replace(/tinyint/gi, "smallint");

	// 5) Convert MySQL "AUTO_INCREMENT" -> Postgres IDENTITY
	sql = sql.replace(/AUTO_INCREMENT/gi, "GENERATED ALWAYS AS IDENTITY");

	// 6) Convert MySQL "UNIQUE KEY", "PRIMARY KEY", etc.
	sql = sql
		.replace(/UNIQUE KEY [^(]+/gi, "UNIQUE")
		// Keep PRIMARY KEY as is
		.replace(/KEY [^(]+\([^)]+\),?/gi, "") // remove normal KEY statements
		.replace(/FOREIGN KEY \([^)]+\) REFERENCES [^(]+\([^)]+\)/gi, (m) => m);

	// 7) Fix backslash-escaped quotes \'
	//    We do this only if MySQL dump used that style. Convert \'
	//    to '', typical for Postgres strings.
	//
	//    Also handle typical NULL => null
	//    And remove trailing commas before closing parenthesis in INSERT
	sql = sql
		.replace(/\\'/g, "''")
		.replace(/\bNULL\b/gi, "null")
		.replace(/,\s*\)/g, ")");

	return sql.trim();
}

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json(
				{ error: "No se proporcionó ningún archivo" },
				{ status: 400 }
			);
		}

		const fileContent = await file.text();

		// 1) Split the entire file content into statements,
		//    ignoring semicolons inside quotes.
		const rawStatements = splitSQLStatements(fileContent);

		// 2) Transform each statement from MySQL to Postgres syntax
		const statements = rawStatements.map(transformMySQLtoPostgres);

		// 3) Execute only CREATE TABLE or INSERT statements
		const results: { success: boolean; statement: string; error?: string }[] =
			[];

		for (const stmt of statements) {
			const lower = stmt.toLowerCase();

			// (optional) skip empty statements after trimming
			if (!stmt.trim()) continue;

			if (lower.includes("create table") || lower.includes("insert into")) {
				try {
					// Postgres requires a semicolon at the end
					await prisma.$executeRawUnsafe(stmt + ";");
					results.push({
						success: true,
						statement: stmt.substring(0, 100) + "...",
					});
				} catch (err) {
					results.push({
						success: false,
						statement: stmt.substring(0, 100) + "...",
						error: (err as Error).message,
					});
				}
			}
		}

		return NextResponse.json({ message: "Archivo procesado", results });
	} catch (error) {
		console.error("Error processing SQL file:", error);
		return NextResponse.json(
			{ error: "Error al procesar el archivo SQL" },
			{ status: 500 }
		);
	}
}
