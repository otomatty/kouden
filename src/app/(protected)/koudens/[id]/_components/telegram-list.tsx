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

interface TelegramListProps {
	koudenId: string;
}

interface Telegram {
	id: string;
	sender: string;
	company: string;
	message: string;
	date: string;
}

export function TelegramList({ koudenId }: TelegramListProps) {
	// TODO: 弔電データの取得と状態管理を実装
	const sampleData: Telegram[] = [
		{
			id: "1",
			sender: "山田太郎",
			company: "株式会社山田商事",
			message: "謹んでご冥福をお祈り申し上げます。",
			date: "2024-03-20",
		},
		{
			id: "2",
			sender: "佐藤花子",
			company: "佐藤工業株式会社",
			message: "心よりお悔やみ申し上げます。",
			date: "2024-03-21",
		},
	];

	return (
		<SampleDataWrapper feature="弔電一覧">
			<Card className="p-4 bg-transparent border-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>差出人</TableHead>
							<TableHead>会社名</TableHead>
							<TableHead>メッセージ</TableHead>
							<TableHead>日付</TableHead>
							<TableHead>操作</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sampleData.map((item) => (
							<TableRow key={item.id}>
								<TableCell>{item.sender}</TableCell>
								<TableCell>{item.company}</TableCell>
								<TableCell>{item.message}</TableCell>
								<TableCell>{item.date}</TableCell>
								<TableCell>編集/削除</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</SampleDataWrapper>
	);
}
