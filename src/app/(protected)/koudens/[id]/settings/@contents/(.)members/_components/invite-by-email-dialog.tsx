"use client";

import { useState } from "react";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from "@/components/ui/select";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, MailPlus, SendIcon, MailPlusIcon } from "lucide-react";
import { sendBatchInvitationEmails } from "@/app/_actions/batch-invitations";
import Link from "next/link";

interface InviteByEmailDialogProps {
	koudenId: string;
	roles: { id: string; name: string }[];
}

const getRoleDisplayName = (roleName: string) => {
	const roleMap: Record<string, string> = {
		owner: "管理者",
		editor: "編集者",
		viewer: "閲覧者",
	};
	return roleMap[roleName] || "未設定";
};

// 固定数のメール入力フィールドのための安定したキー (この配列はもう使わないわ)
// const emailInputKeys = ["email-input-field-1", "email-input-field-2", "email-input-field-3", "email-input-field-4", "email-input-field-5"];

export function InviteByEmailDialog({ koudenId, roles }: InviteByEmailDialogProps) {
	const isMobile = useMediaQuery("(max-width: 768px)");
	const [loading, setLoading] = useState(false);
	// 表示するメール入力欄の数を管理
	const [numInputs, setNumInputs] = useState(1);
	const { toast } = useToast();

	const handleSend = async (formData: FormData) => {
		setLoading(true);
		try {
			formData.append("koudenId", koudenId);
			await sendBatchInvitationEmails(formData);
			toast({ title: "招待メールを送信しました" });
		} catch (error) {
			toast({
				title: "エラー",
				description: error instanceof Error ? error.message : "メール送信に失敗しました",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<ResponsiveDialog
			trigger={
				<Button
					size={isMobile ? "lg" : "default"}
					className={isMobile ? "w-full mx-4 flex items-center" : "flex items-center"}
				>
					<MailPlusIcon className="h-4 w-4" />
					メールで招待
				</Button>
			}
			title="メールで招待"
			description="複数のメールアドレスを入力して一括で招待メールを送信します。最大5名まで。"
		>
			<form action={handleSend} className="space-y-4">
				<input type="hidden" name="koudenId" value={koudenId} />
				<div className="space-y-2">
					<Label htmlFor="role">権限</Label>
					<Select name="role" required>
						<SelectTrigger>
							<SelectValue placeholder="権限を選択" />
						</SelectTrigger>
						<SelectContent>
							{roles.map((role) => (
								<SelectItem key={role.id} value={role.id}>
									{getRoleDisplayName(role.name)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{Array.from({ length: numInputs }, (_, idx) => (
					<div key={`email-input-field-${idx + 1}`} className="space-y-2">
						<Label htmlFor={`emails-${idx}`}>メールアドレス {idx + 1}</Label>
						<Input type="email" id={`emails-${idx}`} name="emails" placeholder="user@example.com" />
					</div>
				))}
				{/* メールアドレス追加ボタン */}
				{numInputs < 5 && (
					<Button
						type="button"
						variant="ghost"
						onClick={() => setNumInputs((prev) => prev + 1)}
						className="w-full flex items-center gap-2"
					>
						<Plus className="h-4 w-4" />
						メールアドレスを追加
					</Button>
				)}
				<Button type="submit" disabled={loading} className="w-full">
					{loading ? (
						<>
							<SendIcon className="h-4 w-4 animate-spin" />
							送信中...
						</>
					) : (
						<>
							<MailPlus className="h-4 w-4" />
							招待メールを送信
						</>
					)}
				</Button>
				<div className="text-right mt-4">
					<Link
						href={`/koudens/preview-email?koudenId=${koudenId}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-blue-500 underline"
					>
						メールプレビューを見る
					</Link>
				</div>
			</form>
		</ResponsiveDialog>
	);
}
