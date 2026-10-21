// 郵便番号のフォーマット
export function formatPostalCode(value: string | number | null): string {
	if (!value) return "";
	const numbers = value.toString().replace(/[^\d]/g, "");
	if (numbers.length <= 3) return numbers;
	return `〒${numbers.slice(0, 3)}-${numbers.slice(3)}`;
}
