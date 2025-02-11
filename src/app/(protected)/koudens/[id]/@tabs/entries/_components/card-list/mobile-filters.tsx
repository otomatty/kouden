import { MobileDataTableToolbar } from "@/components/custom/data-table/mobile-toolbar";
import { useScrollPosition } from "@/hooks/use-scroll-position";
import { cn } from "@/lib/utils";
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

// 検索オプション
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

// ソートオプション
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

// フィルターオプション
const filterOptions = [
	{
		value: "has_offering",
		label: "供物あり",
	},
	{
		value: "is_return_completed",
		label: "返礼済",
	},
];

export function MobileFilters({
	searchQuery,
	onSearchChange,
	sortOrder,
	onSortOrderChange,
}: MobileFiltersProps) {
	const { scrollY, isScrollingUp } = useScrollPosition();
	const shouldStick = scrollY > 180; // ヘッダーの高さを考慮して調整

	return (
		<div
			className={cn(
				"transition-all duration-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50",
				shouldStick && !isScrollingUp
					? "sticky top-16 border-b" // top-0 から top-16 に変更してヘッダー下に固定
					: "relative",
			)}
		>
			<MobileDataTableToolbar
				searchOptions={searchOptions}
				sortOptions={sortOptions}
				filterOptions={filterOptions}
				showFilter={true}
				showSort={true}
				searchValue={searchQuery}
				onSearchChange={onSearchChange}
				searchPlaceholder={`${searchOptions.map((opt) => opt.label).join("・")}から検索...`}
				sortOrder={sortOrder}
				onSortOrderChange={onSortOrderChange}
			/>
		</div>
	);
}
