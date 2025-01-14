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
import { SampleDataWrapper } from "@/components/custom/sample-data-wrapper";

interface TelegramTableProps {
	koudenId: string;
}

interface Telegram {
	id: string;
	sender: string;
	organization: string;
	message: string;
	receivedAt: string;
}

export function TelegramTable({ koudenId }: TelegramTableProps) {
	// TODO: 弔電データの取得と状態管理を実装
	const sampleData: Telegram[] = [
		{
			id: "1",
			sender: "山田太郎",
			organization: "株式会社山田商事",
			message: "謹んでご冥福をお祈り申し上げます。",
			receivedAt: "2024/03/21 10:00",
		},
		{
			id: "2",
			sender: "佐藤花子",
			organization: "佐藤工業株式会社",
			message: "心よりお悔やみ申し上げます。",
			receivedAt: "2024/03/21 11:30",
		},
	];

	return (
		<SampleDataWrapper feature="弔電一覧">
			<Card className="p-4 bg-transparent border-0">
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
						{sampleData.map((item) => (
							<TableRow key={item.id}>
								<TableCell>{item.sender}</TableCell>
								<TableCell>{item.organization}</TableCell>
								<TableCell>{item.message}</TableCell>
								<TableCell>{item.receivedAt}</TableCell>
								<TableCell>編集/削除</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</SampleDataWrapper>
	);
}
