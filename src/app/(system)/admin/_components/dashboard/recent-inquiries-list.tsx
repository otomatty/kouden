import { RecentItemsList } from "./recent-items-list";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
interface Inquiry extends Record<string, any> {
  id: string;
  subject: string;
  user_email: string;
  created_at: string;
}

interface RecentInquiriesListProps {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  inquiries: Inquiry[] | null | undefined;
  isLoading?: boolean;
}

export function RecentInquiriesList({ inquiries, isLoading }: RecentInquiriesListProps) {
  const items = inquiries?.map(inquiry => ({
    id: inquiry.id,
    primaryText: inquiry.subject,
    secondaryText: `From: ${inquiry.user_email}`,
    timestamp: new Date(inquiry.created_at).toLocaleString(),
  })) ?? [];

  return (
    <RecentItemsList
      title="最近の問い合わせ"
      description="最新5件の未解決の問い合わせ"
      items={items}
      isLoading={isLoading}
      itemLimit={5}
    />
  );
}
