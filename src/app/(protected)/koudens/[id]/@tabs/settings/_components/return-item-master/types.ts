import type { ReturnItemMaster } from "@/types/return-records/return-item-masters";

export interface ReturnItemMasterSectionProps {
	koudenId: string;
	returnItemMasters: ReturnItemMaster[];
}

export interface ReturnItemMasterFormData {
	name: string;
	description: string;
	price: number;
}

export interface ReturnItemMasterDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	koudenId: string;
	selectedItem?: ReturnItemMaster;
	onSuccess?: () => void;
}

export interface ReturnItemMasterTableProps {
	data: ReturnItemMaster[];
	koudenId: string;
	onEdit: (item: ReturnItemMaster) => void;
}

export interface ReturnItemMasterToolbarProps {
	onAdd: () => void;
}
