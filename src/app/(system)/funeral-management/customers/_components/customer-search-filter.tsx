import { Button } from "@/components/ui/button";
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

interface CustomerSearchFilterProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	statusFilter: string;
	onStatusFilterChange: (value: string) => void;
}

/**
 * 顧客検索・フィルターコンポーネント
 * 顧客名での検索とステータスでのフィルタリング機能を提供
 */
export function CustomerSearchFilter({
	searchTerm,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
}: CustomerSearchFilterProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">検索・フィルター</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex gap-4">
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="顧客名で検索..."
							className="pl-10"
							value={searchTerm}
							onChange={(e) => onSearchChange(e.target.value)}
						/>
					</div>
					<Select value={statusFilter} onValueChange={onStatusFilterChange}>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="ステータス選択" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">全ステータス</SelectItem>
							<SelectItem value="active">アクティブ</SelectItem>
							<SelectItem value="in-progress">案件進行中</SelectItem>
							<SelectItem value="follow-up">フォロー中</SelectItem>
							<SelectItem value="completed">完了</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="outline">
						<Filter className="h-4 w-4 mr-2" />
						詳細フィルター
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
