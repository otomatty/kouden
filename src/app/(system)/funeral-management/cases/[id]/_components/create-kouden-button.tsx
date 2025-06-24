"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createKoudenForCase } from "@/app/_actions/funeral/kouden/create";
import { BookOpen, Loader2 } from "lucide-react";

interface CreateKoudenButtonProps {
	caseId: string;
	defaultTitle: string;
}

export function CreateKoudenButton({ caseId, defaultTitle }: CreateKoudenButtonProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [title, setTitle] = useState(defaultTitle);
	const [description, setDescription] = useState("");
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!title.trim()) {
			toast.error("エラー", {
				description: "香典帳のタイトルを入力してください",
			});
			return;
		}

		setLoading(true);

		try {
			const result = await createKoudenForCase({
				caseId,
				title: title.trim(),
				description: description.trim() || undefined,
			});

			if (result.success) {
				toast.success("香典帳を作成しました", {
					description: "香典帳が正常に作成されました",
				});
				setOpen(false);
				router.refresh();
			} else {
				toast.error("エラー", {
					description: result.error || "香典帳の作成に失敗しました",
				});
			}
		} catch (error) {
			console.error("[ERROR] Failed to create kouden:", error);
			toast.error("エラー", {
				description: "予期せぬエラーが発生しました",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!loading) {
			setOpen(newOpen);
			if (!newOpen) {
				// ダイアログを閉じる時にフォームをリセット
				setTitle(defaultTitle);
				setDescription("");
			}
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button className="w-full">
					<BookOpen className="h-4 w-4 mr-2" />
					香典帳を作成
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>香典帳の作成</DialogTitle>
						<DialogDescription>
							この葬儀案件の香典帳を作成します。ご遺族の代わりに香典の記録を管理できます。
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="title">香典帳のタイトル *</Label>
							<Input
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="例: 田中太郎様の香典帳"
								disabled={loading}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">説明（任意）</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="香典帳の説明や備考を入力してください"
								rows={3}
								disabled={loading}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={loading}
						>
							キャンセル
						</Button>
						<Button type="submit" disabled={loading}>
							{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							作成
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
