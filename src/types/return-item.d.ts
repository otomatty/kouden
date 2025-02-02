import type { z } from "zod";
import type { Database } from "@/types/supabase";
import type { returnItemSchema } from "@/schemas/return-items";

export type ReturnItem = Database["public"]["Tables"]["return_items"]["Row"];

export type CreateReturnItemInput = z.infer<typeof returnItemSchema>;
export type UpdateReturnItemInput = Partial<CreateReturnItemInput>;
