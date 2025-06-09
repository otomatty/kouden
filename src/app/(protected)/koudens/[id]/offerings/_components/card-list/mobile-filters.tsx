import { useRef, useEffect, useState } from "react";
import { MobileDataTableToolbar } from "@/components/custom/data-table/mobile-toolbar";
import { StickySearchHeader } from "./sticky-search-header";
import {
	User,
	FileText,
	CalendarCheck,
	CalendarClock,
	BanknoteIcon,
	Coins,
	ArrowDownAZ,
	Image,
	Package,
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
		value: "provider_name",
		label: "提供者名",
		icon: <User className="h-4 w-4" />,
		description: "提供者の氏名で検索",
	},
	{
		value: "description",
		label: "内容",
		icon: <FileText className="h-4 w-4" />,
		description: "供物の内容で検索",
	},
	{
		value: "notes",
		label: "備考",
		icon: <FileText className="h-4 w-4" />,
		description: "備考欄で検索",
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
	{
		value: "provider_name_asc",
		label: "提供者名順",
		icon: <ArrowDownAZ className="h-4 w-4" />,
		description: "提供者名の五十音順",
	},
];

// フィルターオプション
const filterOptions = [
	{
		value: "has_photo",
		label: "写真あり",
		icon: <Image className="h-4 w-4" />,
	},
	{
		value: "has_quantity",
		label: "在庫あり",
		icon: <Package className="h-4 w-4" />,
	},
];

export function MobileFilters({
	searchQuery,
	onSearchChange,
	sortOrder,
	onSortOrderChange,
}: MobileFiltersProps) {
	const searchBarRef = useRef<HTMLDivElement>(null);
	const [lastSearchQuery, setLastSearchQuery] = useState(searchQuery);

	// 検索クエリが変更された時の処理
	useEffect(() => {
		setLastSearchQuery(searchQuery);
	}, [searchQuery]);

	// 検索処理のハンドラー
	const handleSearch = (value: string) => {
		setLastSearchQuery(value);
		onSearchChange(value);
	};

	return (
		<>
			<StickySearchHeader
				searchQuery={lastSearchQuery}
				onSearchChange={handleSearch}
				searchField=""
				onSearchFieldChange={() => {}}
				sortOrder={sortOrder}
				onSortOrderChange={onSortOrderChange}
				initialSearchBarRef={searchBarRef}
				searchOptions={searchOptions}
				sortOptions={sortOptions}
				filterOptions={filterOptions}
			/>
			<div ref={searchBarRef}>
				<MobileDataTableToolbar
					searchOptions={searchOptions}
					sortOptions={sortOptions}
					filterOptions={filterOptions}
					showFilter={true}
					showSort={true}
					searchValue={lastSearchQuery}
					onSearchChange={handleSearch}
					searchPlaceholder={`${searchOptions.map((opt) => opt.label).join("・")}から検索...`}
					sortOrder={sortOrder}
					onSortOrderChange={onSortOrderChange}
				/>
			</div>
		</>
	);
}
