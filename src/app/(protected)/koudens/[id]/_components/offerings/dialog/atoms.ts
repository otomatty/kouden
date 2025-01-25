import { atomWithStorage } from "jotai/utils";
import * as z from "zod";

export const formSchema = z.object({
	type: z.enum(["FLOWER", "FOOD", "OTHER"], {
		required_error: "種類を選択してください",
	}),
	description: z.string().optional(),
	quantity: z.coerce
		.number()
		.min(1, "数量は1以上を入力してください")
		.max(999, "数量は999以下を入力してください"),
	price: z.coerce
		.number()
		.min(0, "金額は0以上を入力してください")
		.max(9999999, "金額は9,999,999以下を入力してください")
		.optional(),
	provider_name: z.string().min(1, "提供者名を入力してください"),
	notes: z.string().optional(),
	kouden_entry_ids: z.array(z.string()).min(1, "香典情報を選択してください"),
});

export type OfferingFormState = z.infer<typeof formSchema> & {
	photos?: File[];
};

export const offeringFormAtom = atomWithStorage<OfferingFormState | null>(
	"offering-form-state",
	null,
);
