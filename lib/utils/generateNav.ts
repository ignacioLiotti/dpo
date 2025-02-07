import fs from "fs";
import path from "path";

export function getDirectoryStructure(dirPath: string): Record<string, any> {
	const result: Record<string, any> = {};
	const files = fs.readdirSync(dirPath);

	for (const file of files) {
		const filePath = path.join(dirPath, file);
		const stats = fs.statSync(filePath);

		if (stats.isDirectory()) {
			result[file] = getDirectoryStructure(filePath); // Recurse into subdirectories
		} else {
			if (!result.files) result.files = [];
			result.files.push(file); // Add files to a `files` array
		}
	}

	return result;
}
