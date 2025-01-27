import { MobileDataTableToolbar } from "@/components/custom/data-table/mobile-toolbar";
import type { Table } from "@tanstack/react-table";
import type { KoudenEntry } from "@/types/kouden";
import {
	User,
	Building2,
	MapPin,
	BadgeIcon,
	CalendarClock,
	CalendarCheck,
	BanknoteIcon,
	Coins,
	ArrowDownAZ,
} from "lucide-react";

interface MobileFiltersProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	searchField: string;
	onSearchFieldChange: (value: string) => void;
	sortOrder: string;
	onSortOrderChange: (value: string) => void;
}

const searchOptions = [
	{
		value: "name",
		label: "ご芳名",
		icon: <User className="h-4 w-4" />,
		description: "参列者のお名前で検索",
	},
	{
		value: "address",
		label: "住所",
		icon: <MapPin className="h-4 w-4" />,
		description: "住所情報で検索",
	},
	{
		value: "organization",
		label: "団体名",
		icon: <Building2 className="h-4 w-4" />,
		description: "所属団体で検索",
	},
	{
		value: "position",
		label: "役職",
		icon: <BadgeIcon className="h-4 w-4" />,
		description: "役職名で検索",
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
		value: "amount_desc",
		label: "金額が高い順",
		icon: <BanknoteIcon className="h-4 w-4" />,
		description: "香典金額が高い順",
	},
	{
		value: "amount_asc",
		label: "金額が低い順",
		icon: <Coins className="h-4 w-4" />,
		description: "香典金額が低い順",
	},
	{
		value: "name_asc",
		label: "名前順",
		icon: <ArrowDownAZ className="h-4 w-4" />,
		description: "ご芳名の五十音順",
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
