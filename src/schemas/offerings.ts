import { z } from "zod";

export const offeringFormSchema = z.object({
	type: z.enum(["OTHER", "FLOWER", "INCENSE", "FOOD", "MONEY"], {
		required_error: "種類を選択してください",
	}),
	description: z.string().nullable(),
	quantity: z.number().min(1, "数量を入力してください"),
	price: z
		.number()
		.optional()
		.transform((val) => (val === 0 ? undefined : val)),
	provider_name: z.string().min(1, "提供者名を入力してください"),
	notes: z.string().nullable(),
	kouden_entry_ids: z.array(z.string()),
});
