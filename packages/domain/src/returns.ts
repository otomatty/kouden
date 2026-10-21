/**
 * 香典返しの提案（03 §6「香典返しの一括提案」）と、期限のお知らせの日程（E6-5）。
 * DO（保存時の計算）と画面（提案の表示）の両方から使う純粋な関数。
 */

export interface RuleForSuggestion {
	id: string;
	minAmount: number;
	/** null = 上限なし */
	maxAmount: number | null;
	ratioNumerator: number;
	ratioDenominator: number;
	suggestedItemId: string | null;
}

export interface ItemForSuggestion {
	id: string;
	name: string;
	price: number;
	isActive: boolean;
}

export interface ReturnSuggestion {
	/** 当てはまった金額帯ルール（なければ null で、半返しとして計算する） */
	ruleId: string | null;
	ratioNumerator: number;
	ratioDenominator: number;
	/** 目安額 = 受け取った額 × 目安率 − 当日返しの額（0 未満は 0） */
	target: number;
	/** 推奨品（目安額が 0 なら null） */
	item: ItemForSuggestion | null;
}

/** 金額帯ルールがないときの目安率（半返し） */
export const DEFAULT_RATIO = { numerator: 1, denominator: 2 } as const;

/** 受け取った額が当てはまる金額帯ルール。帯が重なる場合は下限の高いものを優先する */
export function findRule<R extends RuleForSuggestion>(
	rules: readonly R[],
	total: number,
): R | null {
	let found: R | null = null;
	for (const r of rules) {
		if (total < r.minAmount || (r.maxAmount !== null && total > r.maxAmount)) continue;
		if (!found || r.minAmount > found.minAmount) found = r;
	}
	return found;
}

/**
 * 差出人 1 人分の香典返しを提案する。
 * 1. 受け取った額（香典の合計。連名は按分済み）が当てはまる金額帯ルールを探す
 * 2. 目安額 = 受け取った額 × 目安率 − 当日返しで渡した額
 * 3. ルールの推奨品が有効ならそれ。なければ目安額に最も近い有効なカタログ品（同じ差なら安い方）
 */
export function suggestReturn(input: {
	total: number;
	onDayAmount: number;
	rules: readonly RuleForSuggestion[];
	items: readonly ItemForSuggestion[];
}): ReturnSuggestion {
	const rule = findRule(input.rules, input.total);
	const numerator = rule?.ratioNumerator ?? DEFAULT_RATIO.numerator;
	const denominator = rule?.ratioDenominator ?? DEFAULT_RATIO.denominator;
	const target = Math.max(
		0,
		Math.floor((input.total * numerator) / denominator) - Math.max(0, input.onDayAmount),
	);
	const active = input.items.filter((i) => i.isActive);
	let item: ItemForSuggestion | null = null;
	if (target > 0) {
		item = active.find((i) => i.id === rule?.suggestedItemId) ?? null;
		if (!item) {
			for (const candidate of active) {
				if (!item) {
					item = candidate;
					continue;
				}
				const diff = Math.abs(candidate.price - target);
				const best = Math.abs(item.price - target);
				if (diff < best || (diff === best && candidate.price < item.price)) item = candidate;
			}
		}
	}
	return {
		ruleId: rule?.id ?? null,
		ratioNumerator: numerator,
		ratioDenominator: denominator,
		target,
		item,
	};
}

// ---- 期限のお知らせ（E6-5） --------------------------------------------------

export type ReminderKind = "return_due_14d" | "return_due_3d";

/** 期限の何日前に知らせるか */
export const REMINDER_OFFSETS: readonly { kind: ReminderKind; days: number }[] = [
	{ kind: "return_due_14d", days: 14 },
	{ kind: "return_due_3d", days: 3 },
];

/** 送る時刻（日本時間 9:00 = UTC 0:00） */
const REMINDER_HOUR_UTC = 0;

/**
 * 期限（YYYY-MM-DD、日本の日付）から、お知らせを送る日時を求める。
 * すでに過ぎた日時は含めない（期限の直前に日付を入れた場合に、過去の分をまとめて送らないため）。
 */
export function reminderSchedule(
	dueDate: string,
	now: Date,
): { kind: ReminderKind; fireAt: string }[] {
	const [y, m, d] = dueDate.split("-").map(Number);
	if (!y || !m || !d) return [];
	return REMINDER_OFFSETS.map(({ kind, days }) => ({
		kind,
		fireAt: new Date(Date.UTC(y, m - 1, d - days, REMINDER_HOUR_UTC)).toISOString(),
	})).filter((r) => r.fireAt > now.toISOString());
}
