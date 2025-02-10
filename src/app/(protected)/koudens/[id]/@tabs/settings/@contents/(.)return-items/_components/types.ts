import type { ReturnItem } from "@/types/return-records/return-items";

export interface ReturnItemSectionProps {
	koudenId: string;
	returnItems: ReturnItem[];
}

export interface ReturnItemFormData {
	name: string;
	description: string;
	price: number;
}

export interface ReturnItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	koudenId: string;
	selectedItem?: ReturnItem;
	onSuccess?: () => void;
}

export interface ReturnItemTableProps {
	data: ReturnItem[];
	koudenId: string;
	onEdit: (item: ReturnItem) => void;
}

export interface ReturnItemToolbarProps {
	onAdd: () => void;
}
