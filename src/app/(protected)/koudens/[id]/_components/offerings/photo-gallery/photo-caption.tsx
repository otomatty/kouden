"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil } from "lucide-react";
import type { OfferingPhoto } from "@/types/offering";

interface PhotoCaptionProps {
	photo: OfferingPhoto;
	onCaptionChange: (photoId: string, caption: string) => Promise<void>;
}

export function PhotoCaption({ photo, onCaptionChange }: PhotoCaptionProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [caption, setCaption] = useState(photo.caption || "");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setIsSubmitting(true);
			await onCaptionChange(photo.id, caption);
			setIsEditing(false);
		} catch (error) {
			// エラーハンドリングは親コンポーネントで行う
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isEditing) {
		return (
			<form onSubmit={handleSubmit} className="flex gap-2">
				<Input
					value={caption}
					onChange={(e) => setCaption(e.target.value)}
					placeholder="キャプションを入力"
					disabled={isSubmitting}
				/>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					保存
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => setIsEditing(false)}
					disabled={isSubmitting}
				>
					キャンセル
				</Button>
			</form>
		);
	}

	return (
		<div className="flex items-center justify-between">
			<p className="text-sm text-muted-foreground">
				{photo.caption || "キャプションなし"}
			</p>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => setIsEditing(true)}
				className="h-8"
			>
				<Pencil className="mr-2 h-4 w-4" />
				編集
			</Button>
		</div>
	);
}
