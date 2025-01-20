"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import type { AnnouncementData } from "@/app/_actions/admin/announcements";

interface AddAnnouncementButtonProps {
	createAnnouncement: (data: AnnouncementData) => Promise<void>;
}

export function AddAnnouncementButton({
	createAnnouncement,
}: AddAnnouncementButtonProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [priority, setPriority] = useState<
		"low" | "normal" | "high" | "urgent"
	>("normal");
	const [status, setStatus] = useState<"draft" | "published" | "archived">(
		"draft",
	);
	const [publishedAt, setPublishedAt] = useState("");
	const [expiresAt, setExpiresAt] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title || !content) return;

		try {
			setLoading(true);
			await createAnnouncement({
				title,
				content,
				priority,
				status,
				published_at: publishedAt || undefined,
				expires_at: expiresAt || undefined,
			});
			setOpen(false);
			router.refresh();
		} catch (error) {
			console.error(error);
			alert("お知らせの作成に失敗しました。");
		} finally {
			setLoading(false);
		}
	};

	return (
		<ResponsiveDialog
			open={open}
			onOpenChange={setOpen}
			trigger={<Button>お知らせを追加</Button>}
			title="お知らせを追加"
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="title">タイトル</Label>
					<Input
						id="title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="お知らせのタイトル"
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="content">内容</Label>
					<Textarea
						id="content"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder="お知らせの内容"
						required
						rows={5}
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="priority">優先度</Label>
						<Select
							value={priority}
							onValueChange={(value: "low" | "normal" | "high" | "urgent") =>
								setPriority(value)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="low">低</SelectItem>
								<SelectItem value="normal">中</SelectItem>
								<SelectItem value="high">高</SelectItem>
								<SelectItem value="urgent">緊急</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="status">ステータス</Label>
						<Select
							value={status}
							onValueChange={(value: "draft" | "published" | "archived") =>
								setStatus(value)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="draft">下書き</SelectItem>
								<SelectItem value="published">公開</SelectItem>
								<SelectItem value="archived">アーカイブ</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="publishedAt">公開日時</Label>
						<Input
							id="publishedAt"
							type="datetime-local"
							value={publishedAt}
							onChange={(e) => setPublishedAt(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="expiresAt">期限</Label>
						<Input
							id="expiresAt"
							type="datetime-local"
							value={expiresAt}
							onChange={(e) => setExpiresAt(e.target.value)}
						/>
					</div>
				</div>
				<Button type="submit" className="w-full" disabled={loading}>
					{loading ? "作成中..." : "作成"}
				</Button>
			</form>
		</ResponsiveDialog>
	);
}
