import { z } from "zod";
import { atom } from "jotai";
import type { OfferingType } from "@/types/offering";

export const formSchema = z.object({
	type: z.enum(["FLOWER", "FOOD", "OTHER"], {
		required_error: "種類を選択してください",
	}),
	description: z.string().optional(),
	quantity: z.number().min(1, "数量を入力してください").default(1),
	price: z.number().optional(),
	provider_name: z.string().min(1, "提供者名を入力してください"),
	notes: z.string().optional(),
	kouden_entry_ids: z.array(z.string()).default([]),
});

export const offeringFormAtom = atom<
	(z.infer<typeof formSchema> & { photos: File[] }) | null
>(null);
