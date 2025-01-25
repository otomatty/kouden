"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Flower2, Gift, Package, MoreHorizontal } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteOffering, updateOfferingPhoto } from "@/app/_actions/offerings";
import { toast } from "@/hooks/use-toast";
import { OfferingPhotoGallery } from "../photo-gallery";
import type { Offering } from "@/types/offering";

const typeIcons = {
	FLOWER: <Flower2 className="h-4 w-4" />,
	FOOD: <Gift className="h-4 w-4" />,
	OTHER: <Package className="h-4 w-4" />,
};

const typeLabels = {
	FLOWER: "供花",
	FOOD: "供物",
	OTHER: "その他",
};

interface OfferingCardProps {
	offering: Offering;
	onDelete?: () => void;
}

export function OfferingCard({ offering, onDelete }: OfferingCardProps) {
	const [isGalleryOpen, setIsGalleryOpen] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteOffering(offering.id);
			toast({
				title: "お供え物を削除しました",
			});
			onDelete?.();
		} catch (error) {
			toast({
				title: "お供え物の削除に失敗しました",
				variant: "destructive",
			});
		}
	};

	const handleCaptionChange = async (photoId: string, caption: string) => {
		try {
			await updateOfferingPhoto(photoId, { caption });
			toast({
				title: "キャプションを更新しました",
			});
		} catch (error) {
			toast({
				title: "キャプションの更新に失敗しました",
				variant: "destructive",
			});
		}
	};

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
				<div className="flex items-center gap-2">
					{typeIcons[offering.type]}
					<span className="font-semibold">{typeLabels[offering.type]}</span>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<span className="sr-only">メニューを開く</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							className="text-destructive"
							onClick={handleDelete}
						>
							削除
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span>{offering.description}</span>
								<Badge variant="secondary">{offering.quantity}点</Badge>
							</div>
							{offering.price && (
								<span className="text-sm text-muted-foreground">
									{formatCurrency(offering.price)}
								</span>
							)}
						</div>
						<p className="text-sm text-muted-foreground">
							{offering.provider_name}
						</p>
					</div>

					{offering.notes && (
						<p className="text-sm text-muted-foreground">{offering.notes}</p>
					)}

					{offering.offering_photos.length > 0 && (
						<div>
							<OfferingPhotoGallery
								photos={offering.offering_photos}
								onCaptionChange={handleCaptionChange}
							/>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
