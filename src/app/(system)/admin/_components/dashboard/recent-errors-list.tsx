import { RecentItemsList } from "./recent-items-list";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
interface ErrorLog extends Record<string, any> {
  id: string;
  message: string;
  path?: string;
  created_at: string;
}

interface RecentErrorsListProps {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  errors: ErrorLog[] | null | undefined;
  isLoading?: boolean;
}

export function RecentErrorsList({ errors, isLoading }: RecentErrorsListProps) {
  const items = errors?.map(error => ({
    id: error.id,
    primaryText: error.message,
    secondaryText: error.path ? `Path: ${error.path}` : undefined,
    timestamp: new Date(error.created_at).toLocaleString(),
  })) ?? [];

  return (
    <RecentItemsList
      title="最近のエラー"
      description="最新5件のエラーログ"
      items={items}
      isLoading={isLoading}
      itemLimit={5}
    />
  );
}
