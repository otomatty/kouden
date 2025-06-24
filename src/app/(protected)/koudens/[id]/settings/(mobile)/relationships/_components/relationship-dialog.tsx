"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { createRelationship, updateRelationship } from "@/app/_actions/relationships";
import type { Relationship } from "@/types/relationships";
import { RelationshipForm, type RelationshipFormValues } from "./relationship-form";
import { Button } from "@/components/ui/button";
interface RelationshipDialogProps {
	koudenId: string;
	onOpenChange: (open: boolean) => void;
	relationship?: Relationship;
}

export function RelationshipDialog({
	koudenId,
	relationship,
	onOpenChange,
}: RelationshipDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (values: RelationshipFormValues) => {
		setIsSubmitting(true);
		try {
			if (relationship) {
				await updateRelationship(relationship.id, {
					name: values.name,
					description: values.description ?? undefined,
				});
				toast.success("関係性を更新しました");
			} else {
				await createRelationship({
					name: values.name,
					description: values.description ?? undefined,
					koudenId,
				});
				toast.success("関係性を作成しました");
			}
			onOpenChange(false);
		} catch (error) {
			console.error(error);
			toast.error("関係性の保存に失敗しました", {
				description: "しばらく時間をおいてから再度お試しください",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<ResponsiveDialog
			trigger={<Button>関係性を追加</Button>}
			title={relationship ? "関係性を編集" : "関係性を追加"}
			description={relationship ? "既存の関係性を編集します" : "新しい関係性を追加します"}
		>
			<RelationshipForm
				koudenId={koudenId}
				defaultValues={relationship}
				onSubmit={handleSubmit}
				isSubmitting={isSubmitting}
			/>
		</ResponsiveDialog>
	);
}
