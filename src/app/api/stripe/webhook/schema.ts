import { z } from "zod";

/**
 * Stripe Checkout Session の `metadata` に乗ってくる値は外部入力扱い。
 * 未検証で koudens テーブルに INSERT すると、悪意ある metadata で
 * title/description を上書きされる恐れがあるため必ず Zod で検証する。
 */
export const koudenMetadataSchema = z.object({
	koudenId: z.string().uuid(),
	planCode: z.string().min(1).max(50),
	userId: z.string().uuid(),
	title: z.string().min(1).max(100),
	description: z.string().max(500).optional().default(""),
	expectedCount: z.string().optional(),
});

export type KoudenCheckoutMetadata = z.infer<typeof koudenMetadataSchema>;
