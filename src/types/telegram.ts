export interface Telegram {
	id: string;
	koudenId: string;
	koudenEntryId?: string;
	senderName: string;
	senderOrganization?: string;
	senderPosition?: string;
	message?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
}
