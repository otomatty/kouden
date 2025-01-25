import { MobileDataTableToolbar } from "@/components/custom/data-table/mobile-toolbar";
import type { Table } from "@tanstack/react-table";
import type { Offering } from "@/types/offering";
import {
	Search,
	CalendarClock,
	CalendarCheck,
	BanknoteIcon,
	Coins,
	Flower2,
	UtensilsCrossed,
	Package,
} from "lucide-react";

interface MobileFiltersProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	searchField: string;
	onSearchFieldChange: (value: string) => void;
	sortOrder: string;
	onSortOrderChange: (value: string) => void;
	table: Table<Offering>;
}

const searchOptions = [
	{
		value: "description",
		label: "品名",
		icon: <Package className="h-4 w-4" />,
		description: "供物の品名で検索",
	},
	{
		value: "provider_name",
		label: "提供者",
		icon: <Search className="h-4 w-4" />,
		description: "提供者名で検索",
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
		value: "price_desc",
		label: "金額が高い順",
		icon: <BanknoteIcon className="h-4 w-4" />,
		description: "金額が高い順",
	},
	{
		value: "price_asc",
		label: "金額が低い順",
		icon: <Coins className="h-4 w-4" />,
		description: "金額が低い順",
	},
];

const filterOptions = [
	{
		value: "FLOWER",
		label: "生花",
		icon: <Flower2 className="h-4 w-4" />,
		description: "生花のみ表示",
	},
	{
		value: "FOOD",
		label: "供物",
		icon: <UtensilsCrossed className="h-4 w-4" />,
		description: "供物のみ表示",
	},
	{
		value: "OTHER",
		label: "その他",
		icon: <Package className="h-4 w-4" />,
		description: "その他の供物",
	},
];

export function MobileFilters({
	searchQuery,
	onSearchChange,
	searchField,
	onSearchFieldChange,
	sortOrder,
	onSortOrderChange,
	table,
}: MobileFiltersProps) {
	return (
		<MobileDataTableToolbar
			table={table}
			searchOptions={searchOptions}
			sortOptions={sortOptions}
			filterOptions={filterOptions}
			filterColumn="type"
			showColumnVisibility={false}
		/>
	);
}
