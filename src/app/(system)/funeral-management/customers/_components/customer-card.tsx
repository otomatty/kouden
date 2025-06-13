import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Phone, Mail, MapPin, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";
import type { Customer, CustomerStatus } from "@/types/funeral-management";

interface CustomerCardProps {
	customer: Customer;
}

/**
 * 顧客カードコンポーネント
 * 顧客の基本情報を表示
 */
export function CustomerCard({ customer }: CustomerCardProps) {
	function getStatusVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
		switch (status) {
			case "アクティブ":
				return "default";
			case "案件進行中":
				return "secondary";
			case "フォロー中":
				return "outline";
			case "完了":
				return "destructive";
			default:
				return "outline";
		}
	}

	const status = customer.details?.status || "アクティブ";
	const address = customer.details?.address || "住所未登録";
	const lastContactDate = customer.details?.last_contact_date || null;

	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<CardTitle className="text-lg">{customer.name}</CardTitle>
					<Badge variant={getStatusVariant(status)}>{status}</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* 基本情報 */}
				<div className="grid grid-cols-1 gap-3 text-sm">
					<div className="flex items-center gap-2">
						<Phone className="h-4 w-4 text-muted-foreground" />
						<p className="font-medium">{customer.phone || "電話番号未登録"}</p>
					</div>
					<div className="flex items-center gap-2">
						<Mail className="h-4 w-4 text-muted-foreground" />
						<p className="font-medium">{customer.email}</p>
					</div>
					<div className="flex items-center gap-2">
						<MapPin className="h-4 w-4 text-muted-foreground" />
						<p className="font-medium">{address}</p>
					</div>
					<div className="flex items-center gap-2">
						<Calendar className="h-4 w-4 text-muted-foreground" />
						<p className="font-medium">
							{lastContactDate ? new Date(lastContactDate).toLocaleDateString("ja-JP") : "記録なし"}
						</p>
					</div>
					{customer.details?.notes && (
						<div className="flex items-center gap-2">
							<MessageSquare className="h-4 w-4 text-muted-foreground" />
							<p className="text-muted-foreground text-xs">{customer.details.notes}</p>
						</div>
					)}
				</div>

				{/* アクションボタン */}
				<div className="flex gap-2 pt-2">
					<Link href={`/funeral-management/customers/${customer.id}`}>
						<Button variant="outline" size="sm" className="flex-1">
							<Eye className="mr-2 h-4 w-4" />
							詳細
						</Button>
					</Link>
					<Link href={`/funeral-management/customers/${customer.id}/edit`}>
						<Button variant="outline" size="sm" className="flex-1">
							<Edit className="mr-2 h-4 w-4" />
							編集
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
