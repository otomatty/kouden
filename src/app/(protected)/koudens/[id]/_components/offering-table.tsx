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

interface OfferingTableProps {
	koudenId: string;
}

export function OfferingTable({ koudenId }: OfferingTableProps) {
	// TODO: お供物データの取得と状態管理を実装
	return (
		<Card className="p-4">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>品名</TableHead>
						<TableHead>数量</TableHead>
						<TableHead>備考</TableHead>
						<TableHead>操作</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{/* TODO: お供物データの表示を実装 */}
					<TableRow>
						<TableCell>サンプルお供物</TableCell>
						<TableCell>1</TableCell>
						<TableCell>備考</TableCell>
						<TableCell>編集/削除</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</Card>
	);
}
