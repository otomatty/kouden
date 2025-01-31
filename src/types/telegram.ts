export interface Telegram {
	id: string;
	koudenId: string;
	koudenEntryId: string | null;
	senderName: string;
	senderOrganization: string | null;
	senderPosition: string | null;
	message: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
}

export interface TelegramInput {
	senderName: string;
	senderOrganization?: string;
	senderPosition?: string;
	message?: string;
	notes?: string;
	koudenEntryId?: string;
}
