"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table2 } from "lucide-react";
import { OfferingTable } from "../offering-table";
import { OfferingCardList } from "../offering-card/offering-card-list";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { getOfferings } from "@/app/_actions/offerings";
import type { Offering } from "@/types/offering";
import type { OfferingType } from "@/types/offering";

interface OfferingViewProps {
	koudenId: string;
}

export function OfferingView({ koudenId }: OfferingViewProps) {
	const [viewMode, setViewMode] = useLocalStorage<"table" | "grid">(
		"offering-view-mode",
		"table",
	);
	const [offerings, setOfferings] = useState<Offering[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchOfferings = useCallback(async () => {
		try {
			setIsLoading(true);
			const data = await getOfferings(koudenId);
			setOfferings(
				data.map((offering) => ({
					...offering,
					type: offering.type as OfferingType,
				})),
			);
		} catch (error) {
			console.error("Failed to fetch offerings:", error);
		} finally {
			setIsLoading(false);
		}
	}, [koudenId]);

	useEffect(() => {
		fetchOfferings();
	}, [fetchOfferings]);

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
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

			{viewMode === "table" ? (
				<OfferingTable offerings={offerings} />
			) : (
				<OfferingCardList offerings={offerings} onDelete={fetchOfferings} />
			)}
		</div>
	);
}
