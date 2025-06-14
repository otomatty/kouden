"use client";

// library
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// components
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface MobileFiltersProps {
	className?: string;
}

/**
 * 返礼状況のオプション
 */
const statusOptions = [
	{ value: "all", label: "すべて" },
	{ value: "PENDING", label: "未対応" },
	{ value: "PARTIAL_RETURNED", label: "一部返礼" },
	{ value: "COMPLETED", label: "完了" },
	{ value: "NOT_REQUIRED", label: "返礼不要" },
];

/**
 * MobileFiltersコンポーネント
 * 役割：スマホ用のフィルター操作
 */
export function MobileFilters({ className }: MobileFiltersProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
	const [sortValue, setSortValue] = useState(searchParams.get("sort") || "default");

	const handleStatusChange = (value: string) => {
		setStatusFilter(value);
		updateSearchParams("status", value === "all" ? null : value);
	};

	const handleSortChange = (value: string) => {
		setSortValue(value);
		updateSearchParams("sort", value === "default" ? null : value);
	};

	const updateSearchParams = (key: string, value: string | null) => {
		const params = new URLSearchParams(searchParams);
		if (value) {
			params.set(key, value);
		} else {
			params.delete(key);
		}
		router.push(`?${params.toString()}`);
	};

	const clearAllFilters = () => {
		setStatusFilter("all");
		setSortValue("default");
		router.push(window.location.pathname);
	};

	const hasActiveFilters = statusFilter !== "all" || sortValue !== "default";

	return (
		<div className={`p-4 border-b bg-muted/50 ${className || ""}`}>
			<div className="flex flex-col gap-4">
				<div className="flex justify-between items-center">
					<h3 className="font-medium text-sm">フィルター</h3>
					{hasActiveFilters && (
						<Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-auto p-1">
							<X className="h-4 w-4 mr-1" />
							クリア
						</Button>
					)}
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<Label className="text-xs text-muted-foreground mb-1 block">ステータス</Label>
						<Select value={statusFilter} onValueChange={handleStatusChange}>
							<SelectTrigger className="h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{statusOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label className="text-xs text-muted-foreground mb-1 block">並び替え</Label>
						<Select value={sortValue} onValueChange={handleSortChange}>
							<SelectTrigger className="h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="default">作成日時順</SelectItem>
								<SelectItem value="name">名前順</SelectItem>
								<SelectItem value="amount">金額順</SelectItem>
								<SelectItem value="status">ステータス順</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* アクティブフィルターの表示 */}
				{hasActiveFilters && (
					<div className="flex flex-wrap gap-2">
						{statusFilter !== "all" && (
							<Badge variant="secondary" className="text-xs">
								{statusOptions.find((opt) => opt.value === statusFilter)?.label}
								<Button
									variant="ghost"
									size="sm"
									className="h-auto p-0 ml-1"
									onClick={() => handleStatusChange("all")}
								>
									<X className="h-3 w-3" />
								</Button>
							</Badge>
						)}
						{sortValue !== "default" && (
							<Badge variant="secondary" className="text-xs">
								{sortValue === "name"
									? "名前順"
									: sortValue === "amount"
										? "金額順"
										: "ステータス順"}
								<Button
									variant="ghost"
									size="sm"
									className="h-auto p-0 ml-1"
									onClick={() => handleSortChange("default")}
								>
									<X className="h-3 w-3" />
								</Button>
							</Badge>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
