"use client";
// library
import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// types
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
// hooks
import { useMediaQuery } from "@/hooks/use-media-query";
// components
import { DataTable } from "./table/data-table";
import { EntryCardList } from "./card-list/entry-card-list";
import { Loading } from "@/components/custom/loading";
import { FloatingPagination } from "@/components/ui/floating-pagination";

// Props
interface EntryViewProps {
	entries: Entry[];
	koudenId: string;
	relationships: Relationship[];
	totalCount: number;
	currentPage: number;
	pageSize: number;
}

/**
 * EntryViewコンポーネント
 * 役割：エントリーの表示
 */
export function EntryView({
	entries = [],
	koudenId,
	relationships = [],
	totalCount,
	currentPage,
	pageSize,
}: EntryViewProps) {
	const [data, setData] = useState<Entry[]>(entries);
	const isMobile = useMediaQuery("(max-width: 767px)");
	const [isClient, setIsClient] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const totalPages = Math.ceil(totalCount / pageSize);
	const handlePageChange = (newPage: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("page", String(newPage));
		params.set("pageSize", String(pageSize));
		router.push(`${pathname}?${params.toString()}`);
	};
	const handlePageSizeChange = (newSize: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("pageSize", String(newSize));
		params.set("page", "1");
		router.push(`${pathname}?${params.toString()}`);
	};

	useEffect(() => {
		setIsClient(true);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		if (!Array.isArray(entries)) {
			console.error("Invalid entries data:", entries);
			return;
		}
		setData(entries);
	}, [entries]);

	if (!isClient || isLoading) {
		return <Loading message="表示モードを確認中..." />;
	}

	if (!Array.isArray(data)) {
		return <Loading message="データを読み込み中..." />;
	}

	return (
		<>
			{isMobile ? (
				<>
					<EntryCardList entries={data} koudenId={koudenId} relationships={relationships} />
					<div className="mt-4 flex justify-center">
						<FloatingPagination
							currentPage={currentPage}
							totalPages={totalPages}
							totalCount={totalCount}
							pageSize={pageSize}
							onPageChange={handlePageChange}
							onPageSizeChange={handlePageSizeChange}
						/>
					</div>
				</>
			) : (
				<DataTable
					koudenId={koudenId}
					entries={Array.isArray(data) ? data : []}
					relationships={Array.isArray(relationships) ? relationships : []}
					onDataChange={setData}
					currentPage={currentPage}
					pageSize={pageSize}
					totalCount={totalCount}
					onPageChange={handlePageChange}
					onPageSizeChange={handlePageSizeChange}
				/>
			)}
		</>
	);
}
