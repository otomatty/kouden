import type { UseFormReturn } from "react-hook-form";
import type { Entry } from "@/types/entries";
import type { ReturnItem } from "@/types/return-records/return-items";

export interface ReturnFormData {
	kouden_entry_id: string;
	return_status: "PENDING" | "PARTIAL_RETURNED" | "COMPLETED" | "NOT_REQUIRED";
	funeral_gift_amount: number;
	// additional_return_amount は生成カラムのため除外
	return_method?: string;
	arrangement_date?: string;
	remarks?: string;
	return_items?: Array<{
		name: string;
		price: number;
		quantity: number;
		notes?: string;
		isFromMaster?: boolean;
		masterId?: string;
	}>;
}

export interface ReturnFormItemsProps {
	form: UseFormReturn<ReturnFormData>;
	selectedEntry?: Entry;
	koudenId: string;
}

export interface ReturnItemSelectorProps {
	onSelect: (item: ReturnItem) => void;
	koudenId: string;
}

export interface ReturnRateInfoProps {
	selectedEntry?: Entry;
	totalAmount: number;
}
