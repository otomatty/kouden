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
