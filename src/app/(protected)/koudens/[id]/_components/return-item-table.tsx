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
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { DeliveryMap } from "./delivery-map";
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
	address?: string;
	latitude?: number;
	longitude?: number;
}

export function ReturnItemTable({ koudenId }: ReturnItemTableProps) {
	const [showMap, setShowMap] = useState(false);
	const [selectedItems, setSelectedItems] = useState<ReturnItem[]>([]);

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
			address: "東京都渋谷区神宮前1-1-1",
			latitude: 35.6812,
			longitude: 139.7671,
		},
	];

	const handleShowMap = () => {
		const directDeliveryItems = sampleData.filter(
			(item) => item.delivery_method === "DIRECT",
		);
		setSelectedItems(directDeliveryItems);
		setShowMap(true);
	};

	return (
		<div className="space-y-4">
			<SampleDataWrapper feature="返礼品一覧">
				<Card className="p-4 bg-transparent border-0">
					<div className="flex justify-end mb-4">
						<Button
							variant="outline"
							size="sm"
							onClick={handleShowMap}
							className="flex items-center gap-2"
						>
							<MapPin className="h-4 w-4" />
							<span>配送ルート表示</span>
						</Button>
					</div>
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

			{showMap && (
				<Card className="p-4">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">配送ルート</h3>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowMap(false)}
						>
							閉じる
						</Button>
					</div>
					<DeliveryMap items={selectedItems} />
				</Card>
			)}
		</div>
	);
}
