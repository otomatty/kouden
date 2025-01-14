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

interface OfferingTableProps {
	koudenId: string;
}

interface Offering {
	id: string;
	name: string;
	quantity: number;
	note: string;
}

export function OfferingTable({ koudenId }: OfferingTableProps) {
	// TODO: お供物データの取得と状態管理を実装
	const sampleData: Offering[] = [
		{
			id: "1",
			name: "生花",
			quantity: 1,
			note: "祭壇用",
		},
		{
			id: "2",
			name: "果物籠",
			quantity: 2,
			note: "控室用",
		},
	];

	return (
		<SampleDataWrapper feature="お供物一覧">
			<Card className="p-4 bg-transparent border-0">
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
						{sampleData.map((item) => (
							<TableRow key={item.id}>
								<TableCell>{item.name}</TableCell>
								<TableCell>{item.quantity}</TableCell>
								<TableCell>{item.note}</TableCell>
								<TableCell>編集/削除</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</SampleDataWrapper>
	);
}
