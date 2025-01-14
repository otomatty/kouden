"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface TelegramTableProps {
	koudenId: string;
}

export function TelegramTable({ koudenId }: TelegramTableProps) {
	// TODO: 弔電データの取得と状態管理を実装
	return (
		<Card className="p-4">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>差出人</TableHead>
						<TableHead>組織</TableHead>
						<TableHead>メッセージ</TableHead>
						<TableHead>受付日時</TableHead>
						<TableHead>操作</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{/* TODO: 弔電データの表示を実装 */}
					<TableRow>
						<TableCell>山田太郎</TableCell>
						<TableCell>株式会社サンプル</TableCell>
						<TableCell>謹んでお悔やみ申し上げます</TableCell>
						<TableCell>2024/03/21 10:00</TableCell>
						<TableCell>編集/削除</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</Card>
	);
}
