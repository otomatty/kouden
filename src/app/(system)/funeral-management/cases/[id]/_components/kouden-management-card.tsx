"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { transferKoudenOwnership } from "@/app/_actions/funeral/kouden/create";
import { BookOpen, ExternalLink, Users, Gift, UserCheck, Mail, Loader2 } from "lucide-react";

interface KoudenCase {
	id: string;
	case_id: string;
	kouden_id: string;
	proxy_manager_id: string;
	family_user_id: string | null;
	status: string;
	created_at: string;
	updated_at: string | null;
	koudens: {
		id: string;
		title: string;
		description: string | null;
		status: string;
		created_at: string;
		updated_at: string | null;
	} | null;
}

interface KoudenManagementCardProps {
	koudenCase: KoudenCase;
}

export function KoudenManagementCard({ koudenCase }: KoudenManagementCardProps) {
	const [transferDialogOpen, setTransferDialogOpen] = useState(false);
	const [transferEmail, setTransferEmail] = useState("");
	const [transferLoading, setTransferLoading] = useState(false);
	const { toast } = useToast();

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "proxy_managed":
				return <Badge variant="default">代理管理中</Badge>;
			case "transferred":
				return <Badge variant="secondary">移譲済み</Badge>;
			case "completed":
				return <Badge variant="outline">完了</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const handleTransferOwnership = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!transferEmail.trim()) {
			toast({
				title: "エラー",
				description: "メールアドレスを入力してください",
				variant: "destructive",
			});
			return;
		}

		setTransferLoading(true);

		try {
			const result = await transferKoudenOwnership(koudenCase.kouden_id, transferEmail.trim());

			if (result.success) {
				toast({
					title: "所有権を移譲しました",
					description: "香典帳の所有権がご遺族に移譲されました",
				});
				setTransferDialogOpen(false);
				setTransferEmail("");
				// ページをリフレッシュして最新状態を取得
				window.location.reload();
			} else {
				toast({
					title: "エラー",
					description: result.error || "所有権の移譲に失敗しました",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("[ERROR] Failed to transfer ownership:", error);
			toast({
				title: "エラー",
				description: "予期せぬエラーが発生しました",
				variant: "destructive",
			});
		} finally {
			setTransferLoading(false);
		}
	};

	if (!koudenCase.koudens) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>香典帳管理</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">香典帳情報の取得に失敗しました</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center">
					<BookOpen className="h-5 w-5 mr-2" />
					香典帳管理
				</CardTitle>
				<CardDescription>作成済みの香典帳を管理できます</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* 香典帳基本情報 */}
				<div className="space-y-3">
					<div>
						<Label className="text-sm font-medium text-muted-foreground">タイトル</Label>
						<p className="font-semibold">{koudenCase.koudens.title}</p>
					</div>

					{koudenCase.koudens.description && (
						<div>
							<Label className="text-sm font-medium text-muted-foreground">説明</Label>
							<p className="text-sm">{koudenCase.koudens.description}</p>
						</div>
					)}

					<div className="flex items-center justify-between">
						<div>
							<Label className="text-sm font-medium text-muted-foreground">管理状態</Label>
							<div className="mt-1">{getStatusBadge(koudenCase.status)}</div>
						</div>
						<div className="text-right">
							<Label className="text-sm font-medium text-muted-foreground">作成日</Label>
							<p className="text-sm">
								{new Date(koudenCase.created_at).toLocaleDateString("ja-JP")}
							</p>
						</div>
					</div>
				</div>

				<Separator />

				{/* アクションボタン */}
				<div className="space-y-2">
					<Link href={`/koudens/${koudenCase.kouden_id}`} target="_blank">
						<Button variant="outline" className="w-full justify-start">
							<ExternalLink className="h-4 w-4 mr-2" />
							香典帳を開く
						</Button>
					</Link>

					<Link href={`/koudens/${koudenCase.kouden_id}/entries`} target="_blank">
						<Button variant="outline" className="w-full justify-start">
							<Users className="h-4 w-4 mr-2" />
							香典記録を管理
						</Button>
					</Link>

					<Link href={`/koudens/${koudenCase.kouden_id}/returns`} target="_blank">
						<Button variant="outline" className="w-full justify-start">
							<Gift className="h-4 w-4 mr-2" />
							返礼品を管理
						</Button>
					</Link>

					{koudenCase.status === "proxy_managed" && (
						<>
							<Separator />
							<Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
								<DialogTrigger asChild>
									<Button variant="secondary" className="w-full justify-start">
										<UserCheck className="h-4 w-4 mr-2" />
										ご遺族に所有権を移譲
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[425px]">
									<form onSubmit={handleTransferOwnership}>
										<DialogHeader>
											<DialogTitle>所有権の移譲</DialogTitle>
											<DialogDescription>
												香典帳の所有権をご遺族に移譲します。移譲後もあなたは代理管理者として引き続きアクセスできます。
											</DialogDescription>
										</DialogHeader>
										<div className="grid gap-4 py-4">
											<div className="space-y-2">
												<Label htmlFor="email">ご遺族のメールアドレス *</Label>
												<Input
													id="email"
													type="email"
													value={transferEmail}
													onChange={(e) => setTransferEmail(e.target.value)}
													placeholder="family@example.com"
													disabled={transferLoading}
													required
												/>
												<p className="text-xs text-muted-foreground">
													このメールアドレスでアカウント登録済みのユーザーに所有権が移譲されます
												</p>
											</div>
										</div>
										<DialogFooter>
											<Button
												type="button"
												variant="outline"
												onClick={() => setTransferDialogOpen(false)}
												disabled={transferLoading}
											>
												キャンセル
											</Button>
											<Button type="submit" disabled={transferLoading}>
												{transferLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
												移譲する
											</Button>
										</DialogFooter>
									</form>
								</DialogContent>
							</Dialog>
						</>
					)}

					{koudenCase.status === "transferred" && koudenCase.family_user_id && (
						<div className="p-3 bg-green-50 border border-green-200 rounded-md">
							<div className="flex items-center">
								<UserCheck className="h-4 w-4 text-green-600 mr-2" />
								<span className="text-sm text-green-800">ご遺族に所有権が移譲されました</span>
							</div>
							<p className="text-xs text-green-600 mt-1">
								引き続き代理管理者として香典記録の管理が可能です
							</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
