import { z } from "zod";

/**
 * Stripe Checkout Session の `metadata` に乗ってくる値は外部入力扱い。
 * 未検証で koudens テーブルに INSERT すると、悪意ある metadata で
 * title/description を上書きされる恐れがあるため必ず Zod で検証する。
 *
 * title / description / expectedCount は upgrade フローでは送出されないため
 * optional + default で許容する (purchaseKouden 側で空文字を送るケースを含む)。
 */
export const koudenMetadataSchema = z.object({
	koudenId: z.string().uuid(),
	planCode: z.string().min(1).max(50),
	userId: z.string().uuid(),
	title: z.string().max(100).optional().default(""),
	description: z.string().max(500).optional().default(""),
	// purchaseKouden は未指定時に "" を送るため空文字を許容する。
	// route.ts の `expectedCount ? Number(expectedCount) : null` で
	// 空文字は null として扱われる。
	// 桁数無制限だと Number() 変換時に MAX_SAFE_INTEGER (2^53-1) を超えて
	// 精度劣化するため、安全整数範囲内であることを refine で確認する。
	expectedCount: z
		.string()
		.regex(/^\d*$/, "expectedCount must contain digits only")
		.refine(
			(value) => value === "" || Number.isSafeInteger(Number(value)),
			"expectedCount must be empty or within JS safe integer range",
		)
		.optional(),
});

export type KoudenCheckoutMetadata = z.infer<typeof koudenMetadataSchema>;
