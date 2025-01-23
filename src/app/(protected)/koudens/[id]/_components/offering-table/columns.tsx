import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
	MoreHorizontal,
	Gift,
	Flower2,
	Package,
	Image as ImageIcon,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { deleteOffering, updateOfferingPhoto } from "@/app/_actions/offerings";
import { toast } from "@/hooks/use-toast";
import { OfferingPhotoGallery } from "../offering-photo-gallery";
import Image from "next/image";
import { useState } from "react";
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

export const columns: ColumnDef<Offering>[] = [
	{
		accessorKey: "type",
		header: "種類",
		cell: ({ row }) => {
			const type = row.getValue("type") as keyof typeof typeIcons;
			return (
				<div className="flex items-center gap-2">
					{typeIcons[type]}
					<span>{typeLabels[type]}</span>
				</div>
			);
		},
	},
	{
		accessorKey: "provider_name",
		header: "提供者名",
	},
	{
		accessorKey: "description",
		header: "内容",
		cell: ({ row }) => {
			const quantity = row.original.quantity;
			const description = row.getValue("description") as string | null;
			return (
				<div className="flex items-center gap-2">
					<span>{description || "-"}</span>
					<Badge variant="secondary">{quantity}点</Badge>
				</div>
			);
		},
	},
	{
		accessorKey: "price",
		header: "金額",
		cell: ({ row }) => {
			const price = row.getValue("price") as number | null;
			return price ? formatCurrency(price) : "-";
		},
	},
	{
		accessorKey: "notes",
		header: "備考",
		cell: ({ row }) => row.getValue("notes") || "-",
	},
	{
		accessorKey: "offering_photos",
		header: "写真",
		cell: ({ row }) => {
			const photos = row.original.offering_photos;
			const [isGalleryOpen, setIsGalleryOpen] = useState(false);

			if (photos.length === 0) {
				return (
					<div className="flex items-center gap-2 text-muted-foreground">
						<ImageIcon className="h-4 w-4" />
						<span className="text-sm">なし</span>
					</div>
				);
			}

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
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setIsGalleryOpen(true)}
						className="relative h-8 w-8 rounded-md overflow-hidden hover:ring-2 hover:ring-primary transition-all"
					>
						<Image
							src={`/api/storage/${photos[0].storage_key}`}
							alt={photos[0].caption || "写真"}
							className="object-cover"
							fill
							sizes="32px"
						/>
					</button>
					<Badge variant="secondary">{photos.length}枚</Badge>
					{isGalleryOpen && (
						<OfferingPhotoGallery
							photos={photos}
							onCaptionChange={handleCaptionChange}
						/>
					)}
				</div>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const offering = row.original;

			const handleDelete = async () => {
				try {
					await deleteOffering(offering.id);
					toast({
						title: "お供え物を削除しました",
					});
				} catch (error) {
					toast({
						title: "お供え物の削除に失敗しました",
						variant: "destructive",
					});
				}
			};

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
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
			);
		},
	},
];
