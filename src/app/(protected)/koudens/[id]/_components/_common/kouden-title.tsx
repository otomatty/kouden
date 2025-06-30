"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { useAtomValue } from "jotai";
import { permissionAtom, canUpdateKouden } from "@/store/permission";
import { updateKouden } from "@/app/_actions/koudens";
import { toast } from "sonner";

interface KoudenTitleProps {
	koudenId: string;
	title: string;
	description?: string | null;
}

export function KoudenTitle({
	koudenId,
	title: initialTitle,
	description: initialDescription,
}: KoudenTitleProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [title, setTitle] = useState(initialTitle);
	const [description, setDescription] = useState(initialDescription || "");
	const [isLoading, setIsLoading] = useState(false);
	const permission = useAtomValue(permissionAtom);

	const handleSave = async () => {
		if (!title.trim()) {
			toast.error("タイトルを入力してください");
			return;
		}

		setIsLoading(true);
		try {
			await updateKouden(koudenId, {
				title: title.trim(),
				description: description.trim() || undefined,
			});
			setIsEditing(false);
			toast.success("香典帳の情報を更新しました");
		} catch (error) {
			console.error("Failed to update kouden:", error);
			const errorMessage = error instanceof Error ? error.message : "更新に失敗しました";
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	if (isEditing) {
		return (
			<div className="space-y-4 min-w-80" data-tour="kouden-detail-edit">
				<div className="space-y-2">
					<Input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="香典帳のタイトル"
						className="text-2xl font-bold"
					/>
					<Textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="説明文（任意）"
						className="resize-none"
					/>
				</div>
				<div className="flex gap-2">
					<Button onClick={handleSave} disabled={isLoading}>
						{isLoading ? "保存中..." : "保存"}
					</Button>
					<Button
						variant="outline"
						onClick={() => {
							setTitle(initialTitle);
							setDescription(initialDescription || "");
							setIsEditing(false);
						}}
						disabled={isLoading}
					>
						キャンセル
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="group relative space-y-1">
			<div className="flex items-center gap-2">
				<h2 className="text-2xl font-bold">{title}</h2>
				{canUpdateKouden(permission) && (
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsEditing(true)}
						className="opacity-0 group-hover:opacity-100 transition-opacity"
					>
						<Pencil className="h-4 w-4" />
					</Button>
				)}
			</div>
			{description && <p className="text-muted-foreground">{description}</p>}
		</div>
	);
}
