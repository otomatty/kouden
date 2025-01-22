export type OfferingType = "FLOWER" | "FOOD" | "OTHER";

export interface OfferingPhoto {
	id: string;
	storage_key: string;
	caption: string | null;
	created_at: string;
	updated_at: string;
}

export interface Offering {
	id: string;
	type: OfferingType;
	description: string;
	quantity: number;
	price: number | null;
	provider_name: string;
	notes: string | null;
	created_at: string;
	updated_at: string;
	offering_photos: OfferingPhoto[];
	created_by: string;
}

export interface CreateOfferingInput {
	type: OfferingType;
	description: string;
	quantity: number;
	price?: number | null;
	provider_name: string;
	notes?: string | null;
	kouden_entry_id: string;
	photos?: File[];
}

export interface UpdateOfferingInput {
	type?: OfferingType;
	description?: string;
	quantity?: number;
	price?: number | null;
	provider_name?: string;
	notes?: string | null;
}
