/**
 * PostgREST のフィルタ式 (`.or()` / `.ilike()`) にユーザー入力を補間する際の
 * サニタイズ用ヘルパー。
 *
 * - `escapeIlikePattern`: ILIKE のワイルドカード (`%`, `_`) と
 *   エスケープ文字 (`\`) を文字どおりにマッチさせるためにエスケープする。
 * - `sanitizePostgrestOrValue`: PostgREST の `.or()` 内でメタ文字として
 *   解釈される文字 (区切りの `,` `(` `)` および値を曖昧化する `*`) を除去する。
 *   `*` は PostgREST の一部演算子で多目的のメタ文字となるため、リテラル検索の
 *   一貫性を保つために除去している。
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
 * 区切り/メタ文字 (`,` `(` `)` `*`) を除去する。
 * `*` は PostgREST の値部分でメタ文字として解釈され得るため、
 * リテラル検索の一貫性のため落としている。
 * `escapeIlikePattern` と組み合わせて使う想定。
 */
export function sanitizePostgrestOrValue(input: string): string {
	return input.replace(/[,()*]/g, "");
}

/**
 * `.or()` の中で ILIKE パターンとして安全に使える形に整形する。
 * - `,` `(` `)` `*` を除去 (PostgREST 区切り/メタ文字)
 * - `%` `_` `\` をエスケープ (ILIKE ワイルドカード)
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
