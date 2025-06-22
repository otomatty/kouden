import { RecentItemsList } from "./recent-items-list";

interface DebugLog {
	id: string;
	message: string;
	path: string;
	created_at: string | null;
}

interface RecentErrorsListProps {
	errors: DebugLog[] | null | undefined;
	isLoading?: boolean;
}

export function RecentErrorsList({ errors, isLoading }: RecentErrorsListProps) {
	const items =
		errors?.map((error) => ({
			id: error.id,
			primaryText: error.message,
			secondaryText: error.path ? `Details: ${error.path}` : undefined,
			timestamp: error.created_at ? new Date(error.created_at).toLocaleString() : "Unknown time",
		})) ?? [];

	return (
		<RecentItemsList
			title="最近のエラー"
			description="最新5件のデバッグログ"
			items={items}
			isLoading={isLoading}
			itemLimit={5}
		/>
	);
}
