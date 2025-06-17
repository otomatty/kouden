"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CampaignApplicationsPaginationProps {
	currentPage: number;
	totalPages: number;
	totalCount: number;
}

export function CampaignApplicationsPagination({
	currentPage,
	totalPages,
	totalCount,
}: CampaignApplicationsPaginationProps) {
	const searchParams = useSearchParams();

	const createPageUrl = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("page", page.toString());
		return `/admin/support?${params.toString()}`;
	};

	return (
		<div className="flex items-center justify-between text-sm text-gray-500">
			<div>
				{totalCount}件中 {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, totalCount)}
				件を表示
			</div>
			<div className="flex items-center gap-2">
				{currentPage > 1 && (
					<Button asChild variant="outline" size="sm">
						<Link href={createPageUrl(currentPage - 1)}>
							<ChevronLeft className="h-4 w-4 mr-1" />
							前へ
						</Link>
					</Button>
				)}
				<span className="px-2">
					{currentPage} / {totalPages}
				</span>
				{currentPage < totalPages && (
					<Button asChild variant="outline" size="sm">
						<Link href={createPageUrl(currentPage + 1)}>
							次へ
							<ChevronRight className="h-4 w-4 ml-1" />
						</Link>
					</Button>
				)}
			</div>
		</div>
	);
}
