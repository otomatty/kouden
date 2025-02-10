import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReturnItems, deleteReturnItem } from "@/app/_actions/return-records/return-items";
import { ReturnItemDialog } from "./return-item-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Props = {
	koudenId: string;
};

export async function ReturnItemCardList({ koudenId }: Props) {
	const returnItems = await getReturnItems(koudenId);

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
	returnItem: Awaited<ReturnType<typeof getReturnItems>>[number];
	koudenId: string;
};

function ReturnItemCard({ returnItem, koudenId }: ReturnItemCardProps) {
	const { toast } = useToast();

	async function handleDelete() {
		try {
			await deleteReturnItem(returnItem.id, koudenId);
			toast({
				title: "返礼品を削除しました",
			});
		} catch (error) {
			console.error(error);
			toast({
				title: "エラーが発生しました",
				variant: "destructive",
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
