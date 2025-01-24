import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * 名前からイニシャルを生成する
 */
export function getInitials(name: string): string {
	return name
		.split(/\s+/)
		.map((word) => word.charAt(0))
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

export function formatDate(date: string | null) {
	if (!date) return "";

	return new Date(date).toLocaleString("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

// 郵便番号のフォーマット
export function formatPostalCode(value: string | number | null): string {
	if (!value) return "";
	const numbers = value.toString().replace(/[^\d]/g, "");
	if (numbers.length <= 3) return numbers;
	return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
}

// 金額のフォーマット
export function formatCurrency(value: string | number | null): string {
	if (!value) return "";
	return Number(value).toLocaleString("ja-JP");
}

export function convertToCamelCase<T>(obj: Record<string, any>): T {
	const camelCaseObj: Record<string, any> = {};
	for (const key in obj) {
		const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
			letter.toUpperCase(),
		);
		camelCaseObj[camelKey] = obj[key];
	}
	return camelCaseObj as T;
}
