"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateAvatar } from "@/app/_actions/profiles";
import { Camera } from "lucide-react";

interface AvatarUploadProps {
	userId: string;
	avatarUrl: string | null;
	displayName: string;
}

export function AvatarUpload({ userId, avatarUrl, displayName }: AvatarUploadProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [isPending, setIsPending] = useState(false);

	async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
		try {
			setIsPending(true);
			const file = event.target.files?.[0];
			if (!file) return;

			const supabase = createClient();

			// アバター画像をStorageにアップロード
			const fileExt = file.name.split(".").pop();
			const filePath = `${userId}/avatar.${fileExt}`;

			const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
				upsert: true,
			});

			if (uploadError) {
				throw uploadError;
			}

			// 公開URLを取得
			const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(filePath);

			// プロフィールを更新
			const { error: updateError } = await updateAvatar(userId, publicUrl.publicUrl);

			if (updateError) {
				throw updateError;
			}

			toast.success("アバターを更新しました");
			router.refresh();
			setIsOpen(false);
		} catch (error) {
			toast.error("エラー", {
				description: error instanceof Error ? error.message : "アバターの更新に失敗しました",
			});
		} finally {
			setIsPending(false);
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<div className="relative group cursor-pointer">
					<Avatar className="h-24 w-24">
						<AvatarImage src={avatarUrl || undefined} />
						<AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
					</Avatar>
					<div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
						<Camera className="h-6 w-6 text-white" />
					</div>
				</div>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>アバターの変更</DialogTitle>
					<DialogDescription>プロフィール画像をアップロードしてください</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="avatar">画像を選択</Label>
						<Input
							id="avatar"
							type="file"
							accept="image/*"
							onChange={handleFileUpload}
							disabled={isPending}
						/>
					</div>
				</div>
				<Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
					キャンセル
				</Button>
			</DialogContent>
		</Dialog>
	);
}
