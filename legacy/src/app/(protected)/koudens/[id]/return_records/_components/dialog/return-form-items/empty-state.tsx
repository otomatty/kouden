import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Package, Plus, ShoppingCart } from "lucide-react";
import { ReturnItemSelector } from "./return-item-selector";
import type { ReturnItem } from "@/types/return-records/return-items";

interface EmptyStateProps {
	onAddCustomItem: () => void;
	onSelectFromMaster: () => void;
	onItemSelected: (item: ReturnItem) => void;
	koudenId: string;
	showSelector: boolean;
	setShowSelector: (show: boolean) => void;
}

/**
 * 返礼品が登録されていない場合の空の状態を表示
 */
export function EmptyState({
	onAddCustomItem,
	onSelectFromMaster,
	onItemSelected,
	koudenId,
	showSelector,
	setShowSelector,
}: EmptyStateProps) {
	return (
		<Card className="border-dashed">
			<CardContent className="flex flex-col items-center justify-center py-8">
				<Package className="h-12 w-12 text-muted-foreground mb-4" />
				<p className="text-muted-foreground mb-4">返礼品が登録されていません</p>
				<div className="flex gap-2">
					<Dialog open={showSelector} onOpenChange={setShowSelector}>
						<DialogTrigger asChild>
							<Button
								variant="outline"
								onClick={onSelectFromMaster}
								className="flex items-center gap-2"
							>
								<ShoppingCart className="h-4 w-4" />
								マスターから選択
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl">
							<DialogHeader>
								<DialogTitle>返礼品を選択</DialogTitle>
								<DialogDescription>登録済みの返礼品から選択してください</DialogDescription>
							</DialogHeader>
							<ReturnItemSelector onSelect={onItemSelected} koudenId={koudenId} />
						</DialogContent>
					</Dialog>
					<Button onClick={onAddCustomItem} variant="outline">
						<Plus className="h-4 w-4 mr-2" />
						手動で追加
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
