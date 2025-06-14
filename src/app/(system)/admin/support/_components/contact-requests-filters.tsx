"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

const statusOptions = [
	{ value: "new", label: "新規" },
	{ value: "in_progress", label: "対応中" },
	{ value: "closed", label: "完了" },
];

const categoryOptions = [
	{ value: "support", label: "サポート" },
	{ value: "account", label: "アカウント" },
	{ value: "bug", label: "バグ報告" },
	{ value: "feature", label: "機能要望" },
	{ value: "business", label: "法人相談" },
	{ value: "other", label: "その他" },
];

export function ContactRequestsFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const currentStatus = searchParams.get("status");
	const currentCategory = searchParams.get("category");

	const updateFilter = (key: string, value: string | null) => {
		const params = new URLSearchParams(searchParams);

		if (value && value !== "all") {
			params.set(key, value);
		} else {
			params.delete(key);
		}

		// ページをリセット
		params.delete("page");

		router.push(`/admin/support?${params.toString()}`);
	};

	const clearAllFilters = () => {
		router.push("/admin/support");
	};

	const hasActiveFilters = currentStatus || currentCategory;

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="flex flex-wrap items-center gap-4">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-gray-700">フィルター:</span>
					</div>

					<Select
						value={currentStatus || "all"}
						onValueChange={(value) => updateFilter("status", value)}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="ステータス" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">すべて</SelectItem>
							{statusOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={currentCategory || "all"}
						onValueChange={(value) => updateFilter("category", value)}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="カテゴリ" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">すべて</SelectItem>
							{categoryOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{hasActiveFilters && (
						<Button
							variant="outline"
							size="sm"
							onClick={clearAllFilters}
							className="flex items-center gap-1"
						>
							<X className="h-4 w-4" />
							クリア
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
