import type { DeliveryMethod } from "@/types/return-records/delivery-methods";

export interface DeliveryMethodSectionProps {
	koudenId: string;
	deliveryMethods: DeliveryMethod[];
}

export interface DeliveryMethodFormData {
	name: string;
	description: string;
}

export interface DeliveryMethodDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	koudenId: string;
	selectedItem?: DeliveryMethod;
	onSuccess?: () => void;
}

export interface DeliveryMethodTableProps {
	data: DeliveryMethod[];
	koudenId: string;
	onEdit: (item: DeliveryMethod) => void;
}

export interface DeliveryMethodToolbarProps {
	onAdd: () => void;
}
