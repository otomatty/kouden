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

interface OfferingListProps {
	koudenId: string;
}

interface Offering {
	id: string;
	name: string;
	quantity: number;
	sender: string;
	date: string;
}

export function OfferingList({ koudenId }: OfferingListProps) {
	// TODO: お供え物データの取得と状態管理を実装
	const sampleData: Offering[] = [
		{
			id: "1",
			name: "生花",
			quantity: 1,
			sender: "山田太郎",
			date: "2024-03-20",
		},
		{
			id: "2",
			name: "果物籠",
			quantity: 1,
			sender: "佐藤花子",
			date: "2024-03-21",
		},
	];

	return (
		<SampleDataWrapper feature="お供え物一覧">
			<Card className="p-4 bg-transparent border-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>品名</TableHead>
							<TableHead>数量</TableHead>
							<TableHead>贈主</TableHead>
							<TableHead>日付</TableHead>
							<TableHead>操作</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sampleData.map((item) => (
							<TableRow key={item.id}>
								<TableCell>{item.name}</TableCell>
								<TableCell>{item.quantity}</TableCell>
								<TableCell>{item.sender}</TableCell>
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
