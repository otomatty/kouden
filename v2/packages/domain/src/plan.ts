/** 無料版で登録できる「いただきもの」の件数（ADR-P10） */
export const FREE_GIFT_LIMIT = 30;

/** 有料版の価格（1 冊・税込・買い切り） */
export const PAID_PRICE_JPY = 2980;

export function formatYen(amount: number): string {
	return `¥${amount.toLocaleString("ja-JP")}`;
}
