import type { Database } from "./supabase";

// Kouden Entry types
export interface CreateKoudenEntryInput {
	kouden_id: string;
	name: string;
	organization?: string;
	position?: string;
	amount: number;
	postal_code?: string;
	address: string;
	phone_number?: string;
	attendance_type: "FUNERAL" | "CONDOLENCE_VISIT" | null;
	has_offering: boolean;
	is_return_completed: boolean;
	notes?: string;
	relationship_id?: string;
}

export type UpdateKoudenEntryInput = Partial<CreateKoudenEntryInput>;

// Offering types
export type CreateOfferingInput = {
	kouden_entry_id: string;
	type: "FLOWER" | "FOOD" | "OTHER";
	description: string;
	price?: number;
	notes?: string;
};

export type UpdateOfferingInput = Partial<CreateOfferingInput>;

// Return Item types
export type CreateReturnItemInput = {
	kouden_entry_id: string;
	name: string;
	price: number;
	delivery_method: "OTHER" | "MAIL" | "HAND" | "DELIVERY" | null;
	sent_date?: string;
	notes?: string;
};

export type UpdateReturnItemInput = Partial<CreateReturnItemInput>;

// Response types
export type KoudenEntryResponse =
	Database["public"]["Tables"]["kouden_entries"]["Row"];
export type OfferingResponse = Database["public"]["Tables"]["offerings"]["Row"];
export type ReturnItemResponse =
	Database["public"]["Tables"]["return_items"]["Row"];
