import type * as React from "react";
import { MobileDataTableToolbar } from "@/components/custom/data-table/mobile-toolbar";
import { cn } from "@/lib/utils";

interface Option {
	value: string;
	label: string;
	icon?: React.ReactNode;
	description?: string;
}

interface StickySearchHeaderProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	searchField: string;
	onSearchFieldChange: (value: string) => void;
	sortOrder: string;
	onSortOrderChange: (value: string) => void;
	isIntersecting: boolean;
	searchOptions: Option[];
	sortOptions: Option[];
	filterOptions: Option[];
}

export function StickySearchHeader({
	searchQuery,
	onSearchChange,
	sortOrder,
	onSortOrderChange,
	isIntersecting,
	searchOptions,
	sortOptions,
	filterOptions,
}: StickySearchHeaderProps) {
	return (
		<div
			className={cn(
				"fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-50 transition-all duration-300 transform",
				isIntersecting ? "-translate-y-full" : "translate-y-0",
			)}
		>
			<div className="container px-4">
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
		</div>
	);
}
