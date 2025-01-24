"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table2 } from "lucide-react";
import { OfferingTable } from "../offering-table";
import { OfferingCardList } from "../offering-card/offering-card-list";
import { OfferingDialog } from "../offering-dialog";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { OfferingType } from "@/types/offering";
import type { KoudenEntry } from "@/types/kouden";
import { useMediaQuery } from "@/hooks/use-media-query";

interface OfferingViewProps {
	koudenId: string;
	koudenEntries: KoudenEntry[];
}

export function OfferingView({
	koudenId,
	koudenEntries = [],
}: OfferingViewProps) {
	const isMobile = useMediaQuery("(max-width: 768px)");
	const [viewMode, setViewMode] = useLocalStorage<"table" | "grid">(
		"offering-view-mode",
		isMobile ? "grid" : "table",
	);

	// 全てのお供物情報を結合して重複を除去
	const offerings = useMemo(() => {
		const allOfferings = koudenEntries
			.flatMap(
				(entry) => entry.offering_entries?.map((oe) => oe.offering) ?? [],
			)
			.filter(
				(offering): offering is NonNullable<typeof offering> =>
					offering !== null,
			);

		// 重複を除去して一つの配列にまとめる
		return Array.from(
			new Map(allOfferings.map((offering) => [offering.id, offering])).values(),
		).map((offering) => ({
			...offering,
			type: offering.type as OfferingType,
		}));
	}, [koudenEntries]);

	// モバイルの場合は強制的にグリッド表示
	useEffect(() => {
		if (isMobile && viewMode !== "grid") {
			setViewMode("grid");
		}
	}, [isMobile, viewMode, setViewMode]);

	return (
		<div className="space-y-4">
			{!isMobile && (
				<div className="flex justify-between items-center">
					<OfferingDialog koudenId={koudenId} koudenEntries={koudenEntries} />
					<div className="inline-flex rounded-md border bg-background">
						<Button
							variant="ghost"
							size="sm"
							className={`${viewMode === "table" ? "bg-muted" : ""} rounded-l-md`}
							onClick={() => setViewMode("table")}
						>
							<Table2 className="mr-2 h-4 w-4" />
							テーブル
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className={`${viewMode === "grid" ? "bg-muted" : ""} rounded-r-md`}
							onClick={() => setViewMode("grid")}
						>
							<LayoutGrid className="mr-2 h-4 w-4" />
							グリッド
						</Button>
					</div>
				</div>
			)}

			{viewMode === "table" && !isMobile ? (
				<OfferingTable offerings={offerings} />
			) : (
				<OfferingCardList offerings={offerings} onDelete={() => {}} />
			)}
		</div>
	);
}
