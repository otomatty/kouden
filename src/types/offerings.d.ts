import type { Database } from "@/types/supabase";
import type { SnakeToCamelCaseNested } from "@/utils/case-converter";
import type { KeysToCamelCase } from "@/utils/case-converter";

export type OfferingType = Database["public"]["Enums"]["offering_type"];

// データベースのレスポンス型
export type OfferingPhoto = Database["public"]["Tables"]["offering_photos"]["Row"];
export type OfferingEntry = Database["public"]["Tables"]["offering_entries"]["Row"];
export type BaseOffering = Database["public"]["Tables"]["offerings"]["Row"];
export type KoudenEntry = Database["public"]["Tables"]["kouden_entries"]["Row"];

export interface DatabaseOffering extends BaseOffering {
	offering_photos: OfferingPhoto[];
	offering_entries: OfferingEntry[];
}

// アプリケーション内で使用する型
export interface Offering extends BaseOffering, Partial<KeysToCamelCase<BaseOffering>> {
	offeringPhotos: OfferingPhoto[];
	offeringEntries: OfferingEntryWithKoudenEntry[];
}

// Offering に KoudenEntry の情報を追加した型
export type OfferingWithKoudenEntries = Omit<Offering, "offeringEntries"> & {
	offeringEntries: OfferingEntryWithKoudenEntry[];
};

// OfferingEntry に KoudenEntry を結合した型
export type OfferingEntryWithKoudenEntry = Omit<OfferingEntry, "kouden_entry_id"> & {
	koudenEntry: KoudenEntryForOffering | null;
};

// OfferingEntryWithKoudenEntry型で使用する KoudenEntry型 (getOfferings用)
export type KoudenEntryForOffering = Pick<KoudenEntry, "id" | "name" | "organization" | "amount">;

// フォームの値の型
export type OfferingFormValues = z.infer<typeof offeringFormSchema> & {
	photos?: File[];
};

// 入力型
export type CreateOfferingInput = Omit<
	Database["public"]["Tables"]["offerings"]["Insert"],
	"created_by"
> & {
	kouden_entry_ids?: string[];
	photos?: { storage_key: string; caption?: string }[];
};

export type UpdateOfferingInput = Database["public"]["Tables"]["offerings"]["Update"];
export type UpdateOfferingEntryInput = Database["public"]["Tables"]["offering_entries"]["Update"];

// 写真関連の入力型
export type CreateOfferingPhotoInput = Database["public"]["Tables"]["offering_photos"]["Insert"];
export type UpdateOfferingPhotoInput = Database["public"]["Tables"]["offering_photos"]["Update"];

// データベースのレスポンス型（Server Actions用）
export type OfferingResponse = DatabaseOffering;
export type OfferingEntryResponse = OfferingEntry;
export type OfferingPhotoResponse = OfferingPhoto;

export interface OptimisticOffering extends Offering {
	isOptimistic: boolean;
	isDeleted?: boolean;
}
