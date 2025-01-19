"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { createKouden } from "@/app/_actions/koudens";
import { createClient } from "@/lib/supabase/client";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Plus } from "lucide-react";

export function CreateKoudenForm() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const formRef = useRef<HTMLFormElement>(null);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		try {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("認証が必要です");

			if (!formRef.current) return;
			const formData = new FormData(formRef.current);
			await createKouden({
				title: formData.get("title") as string,
				description: formData.get("description") as string,
				userId: user.id,
			});
			setOpen(false);
			router.refresh();
		} catch (error) {
			console.error("Error:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<ResponsiveDialog
			open={open}
			onOpenChange={setOpen}
			trigger={
				<Button className="create-kouden-button flex items-center gap-2">
					<Plus className="h-4 w-4" />
					<span>香典帳を作成する</span>
				</Button>
			}
			title="新しい香典帳を作成"
		>
			<form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="title">タイトル</Label>
					<Input
						className="create-kouden-form-title"
						id="title"
						name="title"
						placeholder="例：〇〇家 告別式"
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="description">説明（任意）</Label>
					<Textarea
						id="description"
						name="description"
						placeholder="説明を入力してください"
					/>
				</div>
				<div className="flex justify-end">
					<Button
						type="submit"
						disabled={loading}
						className="create-kouden-form-button"
					>
						{loading ? "作成中..." : "作成"}
					</Button>
				</div>
			</form>
		</ResponsiveDialog>
	);
}
