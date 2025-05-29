import { useState, useEffect } from "react";

/**
 * useDebounce hook delays updating the value until after the specified delay has passed.
 * @param value The input value to debounce.
 * @param delay The debounce delay in milliseconds. Defaults to 300ms.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay = 300): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => setDebouncedValue(value), delay);
		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}
