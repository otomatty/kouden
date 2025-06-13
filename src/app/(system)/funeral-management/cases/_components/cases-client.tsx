"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { CaseStatusStats } from "./case-status-stats";
import { CaseCard } from "./case-card";
import type { FuneralCaseWithDetails } from "@/types/funeral-management";

interface CasesClientProps {
	initialCases: FuneralCaseWithDetails[];
}

/**
 * 葬儀案件管理のクライアントサイドロジック
 * 検索・フィルタリング状態管理を担当
 */
export function CasesClient({ initialCases }: CasesClientProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// 検索とフィルタリングロジック
	const filteredCases = useMemo(() => {
		return initialCases.filter((funeralCase) => {
			const matchesSearch = funeralCase.deceased_name
				.toLowerCase()
				.includes(searchTerm.toLowerCase());
			const matchesStatus =
				statusFilter === "all" || getStatusKey(funeralCase.status || "") === statusFilter;
			return matchesSearch && matchesStatus;
		});
	}, [initialCases, searchTerm, statusFilter]);

	// ステータスのキーを取得するヘルパー関数
	function getStatusKey(status: string): string {
		switch (status) {
			case "準備中":
				return "preparation";
			case "施行中":
				return "in-progress";
			case "完了":
				return "completed";
			case "要注意":
				return "attention";
			default:
				return "preparation";
		}
	}

	// ステータス統計の計算
	const statusStats = useMemo(() => {
		const stats = { preparation: 0, inProgress: 0, completed: 0, attention: 0 };
		for (const caseItem of initialCases) {
			const status = caseItem.status || "";
			switch (status) {
				case "準備中":
					stats.preparation++;
					break;
				case "施行中":
					stats.inProgress++;
					break;
				case "完了":
					stats.completed++;
					break;
				case "要注意":
					stats.attention++;
					break;
				default:
					stats.preparation++;
					break;
			}
		}
		return stats;
	}, [initialCases]);

	return (
		<div className="space-y-6">
			{/* ステータス統計 */}
			<CaseStatusStats stats={statusStats} />

			{/* 検索・フィルター */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Filter className="h-5 w-5" />
						検索・フィルター
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								placeholder="故人名で検索..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-full sm:w-[200px]">
								<SelectValue placeholder="ステータス" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">すべて</SelectItem>
								<SelectItem value="preparation">準備中</SelectItem>
								<SelectItem value="in-progress">施行中</SelectItem>
								<SelectItem value="completed">完了</SelectItem>
								<SelectItem value="attention">要注意</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* 案件一覧 */}
			<div className="space-y-4">
				{filteredCases.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">該当する案件がありません</div>
				) : (
					filteredCases.map((caseItem) => <CaseCard key={caseItem.id} caseItem={caseItem} />)
				)}
			</div>
		</div>
	);
}
