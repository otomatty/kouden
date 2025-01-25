"use client";

import { useState } from "react";
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

interface ReturnItemTableProps {
	koudenId: string;
}

type DeliveryMethod = "DIRECT" | "MAIL";

interface ReturnItem {
	id: string;
	name: string;
	quantity: number;
	amount: number;
	recipient: string;
	status: string;
	delivery_method: DeliveryMethod;
}

export function ReturnItemTable({ koudenId }: ReturnItemTableProps) {
	// TODO: 返礼品データの取得と状態管理を実装
	const sampleData: ReturnItem[] = [
		{
			id: "1",
			name: "お茶",
			quantity: 1,
			amount: 1000,
			recipient: "山田太郎",
			status: "未返礼",
			delivery_method: "DIRECT",
		},
	];

	return (
		<div className="space-y-4">
			<SampleDataWrapper feature="返礼品一覧">
				<Card className="p-4 bg-transparent border-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>品名</TableHead>
								<TableHead>数量</TableHead>
								<TableHead>金額</TableHead>
								<TableHead>返礼先</TableHead>
								<TableHead>配送方法</TableHead>
								<TableHead>返礼状況</TableHead>
								<TableHead>操作</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sampleData.map((item) => (
								<TableRow key={item.id}>
									<TableCell>{item.name}</TableCell>
									<TableCell>{item.quantity}</TableCell>
									<TableCell>¥{item.amount.toLocaleString()}</TableCell>
									<TableCell>{item.recipient}</TableCell>
									<TableCell>
										{item.delivery_method === "DIRECT" ? "直接届ける" : "郵送"}
									</TableCell>
									<TableCell>{item.status}</TableCell>
									<TableCell>編集/削除</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Card>
			</SampleDataWrapper>
		</div>
	);
}
