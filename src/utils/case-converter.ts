export function toCamelCase<T>(obj: Record<string, any>): T {
	const result: Record<string, any> = {};
	for (const [key, value] of Object.entries(obj)) {
		const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
			letter.toUpperCase(),
		);
		result[camelKey] = value;
	}
	return result as T;
}

export function toSnakeCase<T>(obj: Record<string, any>): T {
	const result: Record<string, any> = {};
	for (const [key, value] of Object.entries(obj)) {
		const snakeKey = key.replace(
			/[A-Z]/g,
			(letter) => `_${letter.toLowerCase()}`,
		);
		result[snakeKey] = value;
	}
	return result as T;
}
