import { RecentItemsList } from "./recent-items-list";

interface ContactRequest {
	id: string;
	subject: string | null;
	category: string;
	name: string | null;
	email: string;
	created_at: string;
	status: string;
}

interface RecentInquiriesListProps {
	inquiries: ContactRequest[] | null | undefined;
	isLoading?: boolean;
}

export function RecentInquiriesList({ inquiries, isLoading }: RecentInquiriesListProps) {
	const items =
		inquiries?.map((inquiry) => ({
			id: inquiry.id,
			primaryText: inquiry.subject || `[${inquiry.category}] ${inquiry.name || "匿名"}`,
			secondaryText: `From: ${inquiry.email} | Status: ${inquiry.status}`,
			timestamp: new Date(inquiry.created_at).toLocaleString(),
		})) ?? [];

	return (
		<RecentItemsList
			title="最近の問い合わせ"
			description="最新5件のお問い合わせ"
			items={items}
			isLoading={isLoading}
			itemLimit={5}
		/>
	);
}
