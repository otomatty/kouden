import { z } from "zod";

/**
 * API ルートで `page` / `pageSize` を受け取る際の共通バリデーション。
 * - `page`: 1 以上の整数。未指定なら 1。
 * - `pageSize`: 1〜100 の整数。未指定なら 50。`pageSize=999999` のような巨大値で DoS を狙う攻撃を防ぐ。
 */
export const paginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * URLSearchParams から `page` / `pageSize` を取り出して `paginationQuerySchema` でパースする。
 */
export function parsePagination(searchParams: URLSearchParams) {
	return paginationQuerySchema.safeParse({
		page: searchParams.get("page") ?? undefined,
		pageSize: searchParams.get("pageSize") ?? undefined,
	});
}
