// PDF用フォーマッター

/**
 * 日付を YYYY/MM/DD 形式に変換
 */
export const formatDate = (date: Date | string): string => {
	const d = typeof date === "string" ? new Date(date) : date;
	const y = d.getFullYear();
	const m = `${d.getMonth() + 1}`.padStart(2, "0");
	const day = `${d.getDate()}`.padStart(2, "0");
	return `${y}/${m}/${day}`;
};

/**
 * 金額をカンマ区切りで表示
 */
export const formatAmount = (amount: number | string): string => {
	const num = typeof amount === "string" ? Number(amount) : amount;
	return num.toLocaleString();
};
