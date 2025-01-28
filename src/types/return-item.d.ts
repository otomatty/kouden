import { z } from "zod";
import type { Database } from "@/types/supabase";

export type ReturnItem = Database["public"]["Tables"]["return_items"]["Row"];

const returnItemSchema = z.object({
	kouden_entry_id: z.string().uuid(),
	name: z.string().min(1, "品名を入力してください"),
	price: z.number().min(1, "価格を入力してください"),
	delivery_method: z
		.enum(["MAIL", "HAND", "DELIVERY", "OTHER"])
		.default("MAIL"),
	sent_date: z.string().optional(),
	notes: z.string().nullish(),
});

export type CreateReturnItemInput = z.infer<typeof returnItemSchema>;
export type UpdateReturnItemInput = Partial<CreateReturnItemInput>;
