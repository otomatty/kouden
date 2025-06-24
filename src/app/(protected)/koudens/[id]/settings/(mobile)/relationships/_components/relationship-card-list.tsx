"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import { useAtomValue } from "jotai";
import { permissionAtom } from "@/store/permission";
import { RelationshipDialog } from "./relationship-dialog";
import type { Relationship } from "@/types/relationships";
import { deleteRelationship, updateRelationship } from "@/app/_actions/relationships";

interface RelationshipCardListProps {
	koudenId: string;
	relationships: Relationship[];
}

export function RelationshipCardList({ koudenId, relationships }: RelationshipCardListProps) {
	const permission = useAtomValue(permissionAtom);

	const [, setIsDialogOpen] = useState(false);
	const [selectedRelationship, setSelectedRelationship] = useState<Relationship | undefined>();
	const canEdit = permission === "owner" || permission === "editor";

	const handleAdd = () => {
		setSelectedRelationship(undefined);
		setIsDialogOpen(true);
	};

	const handleEdit = (relationship: Relationship) => {
		setSelectedRelationship(relationship);
		setIsDialogOpen(true);
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteRelationship(id);
			toast.success("関係性を削除しました");
		} catch (error) {
			console.error(error);
			toast.error("関係性の削除に失敗しました", {
				description: "しばらく時間をおいてから再度お試しください",
			});
		}
	};

	const handleToggle = async (id: string, isDefault: boolean) => {
		try {
			await updateRelationship(id, {
				is_default: isDefault,
			});
		} catch (error) {
			console.error(error);
			toast.error("設定の更新に失敗しました", {
				description: "しばらく時間をおいてから再度お試しください",
			});
		}
	};

	return (
		<div className="space-y-4">
			{canEdit && (
				<div className="flex justify-end">
					<Button variant="outline" size="sm" onClick={handleAdd}>
						<Plus className="h-4 w-4 mr-2" />
						追加
					</Button>
				</div>
			)}

			<div className="space-y-4">
				{relationships.map((relationship) => (
					<div
						key={relationship.id}
						className="flex items-center justify-between p-4 border rounded-lg"
					>
						<div className="space-y-1">
							<div className="font-medium">{relationship.name}</div>
							{relationship.description && (
								<div className="text-sm text-muted-foreground">{relationship.description}</div>
							)}
						</div>
						<div className="flex items-center gap-2">
							{canEdit && (
								<>
									<Switch
										checked={relationship.is_default}
										onCheckedChange={(checked) => handleToggle(relationship.id, checked)}
									/>
									<div className="flex flex-col gap-2">
										<Button variant="ghost" size="icon" onClick={() => handleEdit(relationship)}>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDelete(relationship.id)}
										>
											<Trash className="h-4 w-4" />
										</Button>
									</div>
								</>
							)}
						</div>
					</div>
				))}
			</div>

			<RelationshipDialog
				koudenId={koudenId}
				onOpenChange={setIsDialogOpen}
				relationship={selectedRelationship}
			/>
		</div>
	);
}
