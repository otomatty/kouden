"use client";
import type React from "react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DOTS = "...";

function range(start: number, end: number): number[] {
	const length = end - start + 1;
	return Array.from({ length }, (_, idx) => start + idx);
}

export interface PaginationProps {
	currentPage: number;
	totalPages: number;
	totalCount: number;
	pageSize: number;
	pageSizeOptions?: number[];
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	siblingCount?: number;
}

export const FloatingPagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	totalCount,
	pageSize,
	pageSizeOptions = [25, 50, 100],
	onPageChange,
	onPageSizeChange,
	siblingCount = 1,
}) => {
	const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
	const end = Math.min(currentPage * pageSize, totalCount);
	const paginationRange = useMemo<(number | string)[]>(() => {
		const totalPageNumbers = siblingCount * 2 + 5;
		// ページ数が少ない場合は全ページを表示
		if (totalPages <= totalPageNumbers) {
			return range(1, totalPages);
		}
		const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
		const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

		const shouldShowLeftDots = leftSiblingIndex > 2;
		const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

		const firstPageIndex = 1;
		const lastPageIndex = totalPages;

		// 左にドットを表示せず、右にドットを表示するパターン
		if (!shouldShowLeftDots && shouldShowRightDots) {
			const leftItemCount = 3 + 2 * siblingCount;
			const leftRange = range(1, leftItemCount);
			return [...leftRange, DOTS, lastPageIndex];
		}

		// 左にドットを表示し、右にドットを表示しないパターン
		if (shouldShowLeftDots && !shouldShowRightDots) {
			const rightItemCount = 3 + 2 * siblingCount;
			const rightRange = range(totalPages - rightItemCount + 1, totalPages);
			return [firstPageIndex, DOTS, ...rightRange];
		}

		// 両側にドットを表示するパターン
		if (shouldShowLeftDots && shouldShowRightDots) {
			const middleRange = range(leftSiblingIndex, rightSiblingIndex);
			return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
		}

		return [];
	}, [totalPages, siblingCount, currentPage]);

	return (
		<div className="fixed z-50 bottom-4 inset-x-0 max-w-3xl mx-auto bg-background dark:bg-default-900 p-4 shadow-sm border border-border rounded-lg">
			<div className="flex items-center justify-between w-full space-x-4">
				<div className="text-sm text-muted-foreground">
					全{totalCount}件中 {start}–{end}件表示
				</div>
				<div className="flex items-center space-x-2">
					<span className="text-sm text-muted-foreground">表示件数:</span>
					<Select
						value={String(pageSize)}
						onValueChange={(value) => onPageSizeChange(Number(value))}
					>
						<SelectTrigger className="h-8 w-16">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{pageSizeOptions.map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<nav className="flex items-center space-x-1">
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === 1}
						onClick={() => onPageChange(currentPage - 1)}
					>
						<ChevronLeft className="h-4 w-4" />
						{/* 前へ */}
					</Button>
					{paginationRange.map((page, idx) => {
						const key = page === DOTS ? `dots-${idx}` : `page-${page}`;
						return page === DOTS ? (
							<span key={key} className="px-2 text-sm text-muted-foreground">
								{DOTS}
							</span>
						) : (
							<Button
								key={key}
								variant={page === currentPage ? "default" : "outline"}
								size="sm"
								onClick={() => onPageChange(page as number)}
							>
								{page}
							</Button>
						);
					})}
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === totalPages}
						onClick={() => onPageChange(currentPage + 1)}
					>
						{/* 次へ */}
						<ChevronRight className="h-4 w-4" />
					</Button>
				</nav>
			</div>
		</div>
	);
};
