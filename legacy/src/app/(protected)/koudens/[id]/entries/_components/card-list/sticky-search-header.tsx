import type * as React from "react";
import { useEffect, useState } from "react";
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
	initialSearchBarRef: React.RefObject<HTMLDivElement | null>;
	searchOptions: Option[];
	sortOptions: Option[];
	filterOptions: Option[];
}

export function StickySearchHeader({
	searchQuery,
	onSearchChange,
	sortOrder,
	onSortOrderChange,
	initialSearchBarRef,
	searchOptions,
	sortOptions,
	filterOptions,
}: StickySearchHeaderProps) {
	const [isVisible, setIsVisible] = useState(false);
	const [scrollPosition, setScrollPosition] = useState(0);

	useEffect(() => {
		if (!initialSearchBarRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries[0]) return;
				// 初期位置の検索バーが見えなくなったときだけスティッキーヘッダーを表示
				setIsVisible(!entries[0].isIntersecting);
				// スクロール位置を保存
				setScrollPosition(window.scrollY);
			},
			{
				threshold: 0,
				rootMargin: "-1px 0px 0px 0px", // 1pxのマージンを設定して切り替わりを滑らかに
			},
		);

		observer.observe(initialSearchBarRef.current);
		return () => observer.disconnect();
	}, [initialSearchBarRef]);

	const handleSearch = (value: string) => {
		// 検索中のスクロール位置を保持
		const currentScroll = scrollPosition;

		// 検索処理
		onSearchChange(value);

		// 検索結果が少ない場合でも、現在のスクロール位置を維持
		requestAnimationFrame(() => {
			window.scrollTo(0, currentScroll);
		});
	};

	return (
		<div
			className={cn(
				"fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-50 transition-all duration-300 transform",
				isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
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
					onSearchChange={handleSearch}
					searchPlaceholder={`${searchOptions.map((opt) => opt.label).join("・")}から検索...`}
					sortOrder={sortOrder}
					onSortOrderChange={onSortOrderChange}
				/>
			</div>
		</div>
	);
}
