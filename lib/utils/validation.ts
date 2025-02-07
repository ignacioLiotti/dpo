import { APIError } from "./errorHandler";

export function validateRequiredFields<T extends Record<string, any>>(
	data: T,
	requiredFields: (keyof T)[]
) {
	for (const field of requiredFields) {
		if (
			data[field] === undefined ||
			data[field] === null ||
			data[field] === ""
		) {
			throw new APIError(
				`Missing required field: ${String(field)}`,
				400,
				"VALIDATION_ERROR"
			);
		}
	}
}

export function validateNumericField(value: any, fieldName: string) {
	if (isNaN(Number(value))) {
		throw new APIError(
			`${fieldName} must be a number`,
			400,
			"VALIDATION_ERROR"
		);
	}
}

export function validateDateField(value: any, fieldName: string) {
	const date = new Date(value);
	if (isNaN(date.getTime())) {
		throw new APIError(
			`${fieldName} must be a valid date`,
			400,
			"VALIDATION_ERROR"
		);
	}
}

export function validateIdParam(id: string) {
	if (!id || isNaN(Number(id))) {
		throw new APIError("Invalid ID parameter", 400, "VALIDATION_ERROR");
	}
	return parseInt(id, 10);
}
