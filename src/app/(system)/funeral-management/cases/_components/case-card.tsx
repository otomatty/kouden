import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, MapPin, Eye, Edit, DollarSign } from "lucide-react";
import Link from "next/link";
import type { FuneralCaseWithDetails } from "@/types/funeral-management";

interface CaseCardProps {
	caseItem: FuneralCaseWithDetails;
}

/**
 * 葬儀案件情報表示カードコンポーネント
 * 個別の案件情報を整理して表示
 */
export function CaseCard({ caseItem }: CaseCardProps) {
	const getStatusVariant = (status: string | null) => {
		switch (status) {
			case "施行中":
				return "default";
			case "準備中":
				return "secondary";
			case "完了":
				return "outline";
			case "要注意":
				return "destructive";
			default:
				return "destructive";
		}
	};

	return (
		<div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
			<div className="flex justify-between items-start">
				<div className="space-y-3 flex-1">
					<div className="flex items-center gap-3">
						<h3 className="font-semibold text-lg">{caseItem.deceased_name} 様</h3>
						<Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status || "未設定"}</Badge>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
						<div className="flex items-center gap-2">
							<User className="h-4 w-4 text-muted-foreground" />
							<span>顧客ID: {caseItem.customer_id}</span>
						</div>
						<div className="flex items-center gap-2">
							<MapPin className="h-4 w-4 text-muted-foreground" />
							<span>会場: {caseItem.venue || "未設定"}</span>
						</div>
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<span>
								日時:{" "}
								{caseItem.start_datetime
									? new Date(caseItem.start_datetime).toLocaleString("ja-JP")
									: "未設定"}
							</span>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						{caseItem.assigned_staff && (
							<div>
								<span className="text-muted-foreground">担当スタッフ:</span>
								<span className="ml-2 font-medium">{caseItem.assigned_staff}</span>
							</div>
						)}
						{caseItem.budget && (
							<div className="flex items-center gap-2">
								<DollarSign className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">予算:</span>
								<span className="ml-2 font-medium">¥{caseItem.budget.toLocaleString()}</span>
							</div>
						)}
					</div>
				</div>

				<div className="flex gap-2 ml-4">
					<Button variant="outline" size="sm" asChild>
						<Link href={`/funeral-management/cases/${caseItem.id}`}>
							<Eye className="h-4 w-4" />
							<span className="sr-only">詳細を見る</span>
						</Link>
					</Button>
					<Button variant="outline" size="sm" asChild>
						<Link href={`/funeral-management/cases/${caseItem.id}/edit`}>
							<Edit className="h-4 w-4" />
							<span className="sr-only">編集</span>
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
