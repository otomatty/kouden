import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReturnItems, deleteReturnItem } from "@/app/_actions/return-records/return-items";
import { ReturnItemDialog } from "./return-item-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ReturnItem } from "@/types/return-records/return-items";

type Props = {
	koudenId: string;
};

export async function ReturnItemCardList({ koudenId }: Props) {
	const returnItemsResult = await getReturnItems(koudenId);
	if (!returnItemsResult.ok) {
		throw new Error(returnItemsResult.error.message);
	}
	const returnItems = returnItemsResult.data;

	return (
		<div className="space-y-4">
			{returnItems.map((returnItem) => (
				<ReturnItemCard key={returnItem.id} returnItem={returnItem} koudenId={koudenId} />
			))}
			{returnItems.length === 0 && (
				<Card>
					<CardContent className="pt-6">
						<p className="text-center text-sm text-muted-foreground">返礼品が登録されていません</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

type ReturnItemCardProps = {
	returnItem: ReturnItem;
	koudenId: string;
};

function ReturnItemCard({ returnItem, koudenId }: ReturnItemCardProps) {
	async function handleDelete() {
		try {
			const result = await deleteReturnItem(returnItem.id, koudenId);
			if (!result.ok) {
				toast.error(result.error.message, {
					description: "しばらく時間をおいてから再度お試しください",
				});
				return;
			}
			toast.success("返礼品を削除しました");
		} catch (error) {
			console.error(error);
			toast.error("返礼品の削除に失敗しました", {
				description: "しばらく時間をおいてから再度お試しください",
			});
		}
	}

	return (
		<Card>
			<CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
				<div className="space-y-1">
					<CardTitle className="text-base">{returnItem.name}</CardTitle>
					<CardDescription>{returnItem.description}</CardDescription>
				</div>
				<div className="flex items-center space-x-2">
					<ReturnItemDialog koudenId={koudenId} returnItem={returnItem} />
					<Button variant="ghost" size="sm" onClick={handleDelete}>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<p className="text-sm font-medium">価格: {returnItem.price.toLocaleString()}円</p>
			</CardContent>
		</Card>
	);
}
