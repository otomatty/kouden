"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { useAtomValue } from "jotai";
import { permissionAtom } from "@/store/permission";
import { updateKouden } from "@/app/_actions/koudens";

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
	const permission = useAtomValue(permissionAtom);

	const handleSave = async () => {
		try {
			await updateKouden(koudenId, {
				title,
				description: description || undefined,
			});
			setIsEditing(false);
		} catch (error) {
			console.error("Failed to update kouden:", error);
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
					<Button onClick={handleSave}>保存</Button>
					<Button
						variant="outline"
						onClick={() => {
							setTitle(initialTitle);
							setDescription(initialDescription || "");
							setIsEditing(false);
						}}
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
				{permission === "owner" && (
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
