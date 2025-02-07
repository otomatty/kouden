"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, TrashIcon } from "lucide-react";
import type { ReturnRecord } from "@/types/return-records";
import type { Entry } from "@/types/entries";

interface ReturnRecordCardListProps {
	returnRecords: ReturnRecord[];
	koudenId: string;
	entry: Entry;
}

/**
 * 返礼情報カードリスト（モバイル表示用）
 */
export function ReturnRecordCardList({
	returnRecords,
	koudenId,
	entry,
}: ReturnRecordCardListProps) {
	const getStatusBadge = (status: ReturnRecord["status"]) => {
		switch (status) {
			case "preparing":
				return <Badge variant="secondary">準備中</Badge>;
			case "pending":
				return <Badge variant="secondary">未返礼</Badge>;
			case "completed":
				return <Badge variant="secondary">返礼済み</Badge>;
			default:
				return null;
		}
	};

	const getTotalAmount = (record: ReturnRecord) => {
		return record.items.reduce((total, item) => {
			return total + item.price * item.quantity;
		}, 0);
	};

	const getDeliveryMethodName = (record: ReturnRecord) => {
		if (record.kouden_delivery_method.delivery_method_master) {
			return record.kouden_delivery_method.delivery_method_master.name;
		}
		return record.kouden_delivery_method.name;
	};

	const handleEdit = (record: ReturnRecord) => {
		// TODO: 編集モーダルを開く
		console.log("Edit record:", record);
	};

	const handleDelete = async (record: ReturnRecord) => {
		// TODO: 削除確認モーダルを開く
		console.log("Delete record:", record);
	};

	return (
		<div className="space-y-4">
			{returnRecords.map((record) => (
				<Card key={record.id} className="p-4">
					<div className="space-y-4">
						{/* ステータスと操作ボタン */}
						<div className="flex items-center justify-between">
							<div>{getStatusBadge(record.status)}</div>
							<div className="flex items-center gap-2">
								<Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
									<PencilIcon className="w-4 h-4" />
								</Button>
								<Button variant="ghost" size="icon" onClick={() => handleDelete(record)}>
									<TrashIcon className="w-4 h-4" />
								</Button>
							</div>
						</div>

						{/* 返礼品情報 */}
						<div className="space-y-2">
							{record.items.map((item) => (
								<div key={item.id} className="space-y-1">
									<div className="font-medium">{item.return_item_master.name}</div>
									<div className="text-sm text-muted-foreground">数量: {item.quantity}</div>
									<div className="text-sm text-muted-foreground">
										金額: ¥{(item.price * item.quantity).toLocaleString()}
									</div>
									{item.notes && (
										<div className="text-sm text-muted-foreground">備考: {item.notes}</div>
									)}
								</div>
							))}
						</div>

						{/* 配送情報 */}
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div>
								<div className="font-medium">配送方法</div>
								<div className="text-muted-foreground">{getDeliveryMethodName(record)}</div>
							</div>
							<div>
								<div className="font-medium">配送料</div>
								<div className="text-muted-foreground">
									{record.shipping_fee ? `¥${record.shipping_fee.toLocaleString()}` : "-"}
								</div>
							</div>
							<div>
								<div className="font-medium">予定日</div>
								<div className="text-muted-foreground">{record.scheduled_date || "-"}</div>
							</div>
							<div>
								<div className="font-medium">完了日</div>
								<div className="text-muted-foreground">{record.completed_date || "-"}</div>
							</div>
						</div>

						{/* 合計金額 */}
						<div className="text-right font-medium">
							合計: ¥{getTotalAmount(record).toLocaleString()}
						</div>
					</div>
				</Card>
			))}
		</div>
	);
}
