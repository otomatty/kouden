/**
 * PostgREST のフィルタ式 (`.or()` / `.ilike()`) にユーザー入力を補間する際の
 * サニタイズ用ヘルパー。
 *
 * - `escapeIlikePattern`: ILIKE のワイルドカード (`%`, `_`) と
 *   エスケープ文字 (`\`) を文字どおりにマッチさせるためにエスケープする。
 * - `sanitizePostgrestOrValue`: PostgREST の `.or()` で構文として解釈される
 *   区切り文字 (`,` `(` `)`) を除去する。
 * - `ALLOWED_ENTRY_SORT_FIELDS` / `ALLOWED_SORT_DIRECTIONS`:
 *   `order()` の列名・方向に渡せる値のホワイトリスト。
 */

const ILIKE_SPECIAL_CHARS = /[\\%_]/g;

/**
 * ILIKE のワイルドカード (% _) と エスケープ文字 (\) をエスケープして、
 * ユーザー入力を「リテラル」として検索できるようにする。
 *
 * 注意: 返り値は `%pattern%` のような前後ラップ前の値。呼び出し側で
 *   `` `%${escapeIlikePattern(input)}%` `` のように結合する。
 */
export function escapeIlikePattern(input: string): string {
	return input.replace(ILIKE_SPECIAL_CHARS, "\\$&");
}

/**
 * PostgREST の `.or()` クエリ文字列に補間する値から、
 * `,` `(` `)` といった区切り/メタ文字を除去する。
 * `escapeIlikePattern` と組み合わせて使う想定。
 */
export function sanitizePostgrestOrValue(input: string): string {
	return input.replace(/[,()*]/g, "");
}

/**
 * `.or()` の中で ILIKE パターンとして安全に使える形に整形する。
 * - `,` `(` `)` `*` を除去
 * - `%` `_` `\` をエスケープ
 */
export function buildOrIlikePattern(input: string): string {
	return `%${escapeIlikePattern(sanitizePostgrestOrValue(input))}%`;
}

export const ALLOWED_ENTRY_SORT_FIELDS = [
	"created_at",
	"updated_at",
	"amount",
	"name",
	"organization",
	"position",
	"address",
] as const;

export type AllowedEntrySortField = (typeof ALLOWED_ENTRY_SORT_FIELDS)[number];

export const ALLOWED_SORT_DIRECTIONS = ["asc", "desc"] as const;

export type AllowedSortDirection = (typeof ALLOWED_SORT_DIRECTIONS)[number];

/**
 * `field_direction` 形式のソート指定文字列を、ホワイトリストに基づいて
 * 安全な `{ field, ascending }` に変換する。
 *
 * - 想定外のフィールド名・方向が指定された場合はデフォルト値を返す
 *   (列名列挙やエラーリーク防止)。
 */
export function parseEntrySortValue(sortValue: string | undefined): {
	field: AllowedEntrySortField;
	ascending: boolean;
} {
	const fallback = { field: "created_at" as AllowedEntrySortField, ascending: false };
	if (!sortValue || sortValue === "default") {
		return fallback;
	}

	const lastUnderscore = sortValue.lastIndexOf("_");
	if (lastUnderscore < 0) {
		return fallback;
	}

	const rawField = sortValue.slice(0, lastUnderscore);
	const rawDirection = sortValue.slice(lastUnderscore + 1);

	const field = (ALLOWED_ENTRY_SORT_FIELDS as readonly string[]).includes(rawField)
		? (rawField as AllowedEntrySortField)
		: fallback.field;
	const direction = (ALLOWED_SORT_DIRECTIONS as readonly string[]).includes(rawDirection)
		? (rawDirection as AllowedSortDirection)
		: "desc";

	return { field, ascending: direction === "asc" };
}
