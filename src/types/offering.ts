import type { Database } from "@/types/supabase";

export type OfferingType = Database["public"]["Enums"]["offering_type"];

// データベースのレスポンス型
export type OfferingPhoto =
	Database["public"]["Tables"]["offering_photos"]["Row"];

export type OfferingEntry =
	Database["public"]["Tables"]["offering_entries"]["Row"];

export type BaseOffering = Database["public"]["Tables"]["offerings"]["Row"];

export interface Offering extends BaseOffering {
	offering_photos: OfferingPhoto[];
	offering_entries: OfferingEntry[];
}

// 入力型
export type CreateOfferingInput = Omit<
	Database["public"]["Tables"]["offerings"]["Insert"],
	"created_by"
> & {
	kouden_entry_ids?: string[];
	photos?: { storage_key: string; caption?: string }[];
};

export type UpdateOfferingInput =
	Database["public"]["Tables"]["offerings"]["Update"];

// 写真関連の入力型
export type CreateOfferingPhotoInput =
	Database["public"]["Tables"]["offering_photos"]["Insert"];

export type UpdateOfferingPhotoInput =
	Database["public"]["Tables"]["offering_photos"]["Update"];

// データベースのレスポンス型（Server Actions用）
export type OfferingResponse = BaseOffering;
export type OfferingEntryResponse = OfferingEntry;
export type OfferingPhotoResponse = OfferingPhoto;
