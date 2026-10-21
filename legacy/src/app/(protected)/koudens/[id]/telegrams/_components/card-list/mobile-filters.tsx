import { MobileDataTableToolbar } from "@/components/custom/data-table/mobile-toolbar";

interface MobileFiltersProps {
	searchQuery: string;
	searchField: string;
	onSearchFieldChange: (value: string) => void;
	onSearchChange: (value: string) => void;
	sortOrder: string;
	onSortOrderChange: (value: string) => void;
}

const searchOptions = [
	{
		value: "senderName",
		label: "送信者名",
	},
	{
		value: "senderOrganization",
		label: "所属組織",
	},
	{
		value: "message",
		label: "メッセージ",
	},
];

const sortOptions = [
	{
		value: "created_at_desc",
		label: "新しい順",
	},
	{
		value: "created_at_asc",
		label: "古い順",
	},
	{
		value: "senderName_asc",
		label: "送信者名（昇順）",
	},
	{
		value: "senderName_desc",
		label: "送信者名（降順）",
	},
];

export function MobileFilters({
	searchQuery,
	onSearchChange,
	sortOrder,
	onSortOrderChange,
}: MobileFiltersProps) {
	return (
		<MobileDataTableToolbar
			searchOptions={searchOptions}
			sortOptions={sortOptions}
			showFilter={false}
			showSort={true}
			searchValue={searchQuery}
			onSearchChange={onSearchChange}
			searchPlaceholder={`${searchOptions.map((opt) => opt.label).join("・")}から検索...`}
			sortOrder={sortOrder}
			onSortOrderChange={onSortOrderChange}
		/>
	);
}
