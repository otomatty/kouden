import { MobileDataTableToolbar } from "@/components/custom/data-table/mobile-toolbar";
import { Package, CalendarClock, CalendarCheck, ArrowDownAZ, FileText } from "lucide-react";

const searchOptions = [
	{
		value: "name",
		label: "品名",
		icon: <Package className="h-4 w-4" />,
		description: "お供物の品名で検索",
	},
	{
		value: "note",
		label: "備考",
		icon: <FileText className="h-4 w-4" />,
		description: "備考内容で検索",
	},
];

const sortOptions = [
	{
		value: "created_at_desc",
		label: "新しい順",
		icon: <CalendarCheck className="h-4 w-4" />,
		description: "登録日時が新しい順",
	},
	{
		value: "created_at_asc",
		label: "古い順",
		icon: <CalendarClock className="h-4 w-4" />,
		description: "登録日時が古い順",
	},
	{
		value: "name_asc",
		label: "品名順",
		icon: <ArrowDownAZ className="h-4 w-4" />,
		description: "品名の五十音順",
	},
];

interface MobileFiltersProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	searchField: string;
	onSearchFieldChange: (value: string) => void;
	sortOrder: string;
	onSortOrderChange: (value: string) => void;
}

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
