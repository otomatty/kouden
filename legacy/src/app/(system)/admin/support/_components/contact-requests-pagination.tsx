"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ContactRequestsPaginationProps {
	currentPage: number;
	totalPages: number;
	totalCount: number;
}

export function ContactRequestsPagination({
	currentPage,
	totalPages,
	totalCount,
}: ContactRequestsPaginationProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const navigateToPage = (page: number) => {
		const params = new URLSearchParams(searchParams);
		params.set("page", page.toString());
		router.push(`/admin/support?${params.toString()}`);
	};

	if (totalPages <= 1) {
		return null;
	}

	const startItem = (currentPage - 1) * 20 + 1;
	const endItem = Math.min(currentPage * 20, totalCount);

	return (
		<div className="flex items-center justify-between">
			<div className="text-sm text-gray-600">
				{totalCount}件中 {startItem}-{endItem}件を表示
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => navigateToPage(currentPage - 1)}
					disabled={currentPage <= 1}
				>
					<ChevronLeft className="h-4 w-4" />
					前へ
				</Button>

				<div className="flex items-center gap-1">
					{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
						let pageNumber: number;

						if (totalPages <= 5) {
							pageNumber = i + 1;
						} else if (currentPage <= 3) {
							pageNumber = i + 1;
						} else if (currentPage >= totalPages - 2) {
							pageNumber = totalPages - 4 + i;
						} else {
							pageNumber = currentPage - 2 + i;
						}

						return (
							<Button
								key={pageNumber}
								variant={currentPage === pageNumber ? "default" : "outline"}
								size="sm"
								onClick={() => navigateToPage(pageNumber)}
								className="w-8 h-8 p-0"
							>
								{pageNumber}
							</Button>
						);
					})}
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => navigateToPage(currentPage + 1)}
					disabled={currentPage >= totalPages}
				>
					次へ
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
