"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createShareInvitation } from "@/app/_actions/invitations";
import { Share2 } from "lucide-react";

interface ShareLinkFormProps {
	koudenId: string;
	roles: {
		id: string;
		name: string;
	}[];
}

export function ShareLinkForm({ koudenId, roles }: ShareLinkFormProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [invitationLink, setInvitationLink] = useState<string>("");
	const [copied, setCopied] = useState(false);
	const { toast } = useToast();

	const handleCreateLink = async (formData: FormData) => {
		try {
			setLoading(true);
			const roleId = formData.get("role") as string;
			const maxUses = formData.get("maxUses")
				? Number(formData.get("maxUses"))
				: null;
			const expiresIn = (formData.get("expiresIn") as string) || "7d";

			const invitation = await createShareInvitation({
				koudenId,
				roleId,
				maxUses,
				expiresIn,
			});

			const link = `${window.location.origin}/invitations/${invitation.invitation_token}`;
			setInvitationLink(link);

			toast({
				title: "招待リンクを作成しました",
				description: "リンクをコピーして共有してください",
			});
		} catch (error) {
			console.error("Error creating invitation:", error);
			toast({
				title: "エラー",
				description:
					error instanceof Error
						? error.message
						: "招待リンクの作成に失敗しました",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(invitationLink);
			setCopied(true);
			toast({
				title: "コピーしました",
				description: "招待リンクをクリップボードにコピーしました",
			});
			setTimeout(() => {
				setCopied(false);
			}, 2000);
		} catch (error) {
			toast({
				title: "エラー",
				description: "リンクのコピーに失敗しました",
				variant: "destructive",
			});
		}
	};

	return (
		<ResponsiveDialog
			open={open}
			onOpenChange={setOpen}
			trigger={
				<Button variant="outline" className="gap-2">
					<Share2 className="h-4 w-4" />
					共有リンクを作成
				</Button>
			}
			title="共有リンクの作成"
			description="香典帳を共有するためのリンクを作成します。"
		>
			<form action={handleCreateLink} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="role">権限</Label>
					<Select name="role" required>
						<SelectTrigger>
							<SelectValue placeholder="権限を選択" />
						</SelectTrigger>
						<SelectContent>
							{roles.map((role) => (
								<SelectItem key={role.id} value={role.id}>
									{role.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="maxUses">使用回数制限（オプション）</Label>
					<Input type="number" name="maxUses" min="1" placeholder="制限なし" />
				</div>

				<div className="space-y-2">
					<Label htmlFor="expiresIn">有効期限</Label>
					<Select name="expiresIn" defaultValue="7d">
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1d">24時間</SelectItem>
							<SelectItem value="7d">7日間</SelectItem>
							<SelectItem value="30d">30日間</SelectItem>
							<SelectItem value="90d">90日間</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<Button type="submit" disabled={loading} className="w-full">
					{loading ? "作成中..." : "リンクを作成"}
				</Button>
			</form>

			{invitationLink && (
				<div className="mt-4 space-y-2">
					<Label>招待リンク</Label>
					<div className="flex gap-2">
						<Input
							value={invitationLink}
							readOnly
							className="font-mono text-sm"
						/>
						<Button
							onClick={handleCopyLink}
							variant="outline"
							disabled={copied}
						>
							{copied ? "コピー完了" : "コピー"}
						</Button>
					</div>
				</div>
			)}
		</ResponsiveDialog>
	);
}
