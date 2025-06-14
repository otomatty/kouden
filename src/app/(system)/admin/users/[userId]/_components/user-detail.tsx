"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
	ArrowLeft,
	Crown,
	Calendar,
	Activity,
	Mail,
	Users,
	BookOpen,
	FileText,
	ExternalLink,
	Shield,
	CheckCircle,
	XCircle,
} from "lucide-react";
import type { UserDetail as UserDetailType } from "@/app/_actions/admin/users";
import { formatDistanceToNow, format } from "date-fns";
import { ja } from "date-fns/locale";

interface UserDetailProps {
	user: UserDetailType;
}

export function UserDetail({ user }: UserDetailProps) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"overview" | "koudens" | "activity">("overview");

	const handleBack = () => {
		router.back();
	};

	const handleKoudenClick = (koudenId: string) => {
		router.push(`/admin/koudens/${koudenId}`);
	};

	return (
		<div className="space-y-6">
			{/* ヘッダー */}
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" onClick={handleBack}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					戻る
				</Button>
				<div>
					<h1 className="text-3xl font-bold">ユーザー詳細</h1>
					<p className="text-muted-foreground">{user.display_name} の詳細情報</p>
				</div>
			</div>

			{/* ユーザー基本情報 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						基本情報
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-start gap-6">
						<Avatar className="h-24 w-24">
							<AvatarImage src={user.avatar_url || undefined} />
							<AvatarFallback className="text-2xl">
								{user.display_name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>

						<div className="flex-1 space-y-4">
							<div>
								<div className="flex items-center gap-2 mb-2">
									<h2 className="text-2xl font-bold">{user.display_name}</h2>
									{user.admin_info && (
										<Badge variant="secondary" className="text-sm">
											<Crown className="h-4 w-4 mr-1" />
											{user.admin_info.role === "super_admin" ? "スーパー管理者" : "管理者"}
										</Badge>
									)}
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
									<div className="flex items-center gap-2">
										<Mail className="h-4 w-4 text-muted-foreground" />
										<span>{user.email || "未設定"}</span>
										{user.email_confirmed_at ? (
											<CheckCircle className="h-4 w-4 text-green-600" />
										) : (
											<XCircle className="h-4 w-4 text-red-600" />
										)}
									</div>

									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span>
											登録日: {format(new Date(user.created_at), "yyyy年MM月dd日", { locale: ja })}
										</span>
									</div>

									{user.last_sign_in_at && (
										<div className="flex items-center gap-2">
											<Activity className="h-4 w-4 text-muted-foreground" />
											<span>
												最終ログイン:{" "}
												{formatDistanceToNow(new Date(user.last_sign_in_at), {
													addSuffix: true,
													locale: ja,
												})}
											</span>
										</div>
									)}

									{user.admin_info && (
										<div className="flex items-center gap-2">
											<Shield className="h-4 w-4 text-muted-foreground" />
											<span>
												管理者権限付与:{" "}
												{format(new Date(user.admin_info.granted_at), "yyyy年MM月dd日", {
													locale: ja,
												})}
											</span>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 統計情報 */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<BookOpen className="h-5 w-5 text-blue-600" />
							<div>
								<p className="text-sm text-muted-foreground">所有香典帳</p>
								<p className="text-2xl font-bold">{user.stats.owned_koudens_count}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5 text-green-600" />
							<div>
								<p className="text-sm text-muted-foreground">参加香典帳</p>
								<p className="text-2xl font-bold">{user.stats.participated_koudens_count}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<FileText className="h-5 w-5 text-purple-600" />
							<div>
								<p className="text-sm text-muted-foreground">記録数</p>
								<p className="text-2xl font-bold">{user.stats.total_entries_count}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* タブナビゲーション */}
			<Card>
				<CardHeader>
					<div className="flex space-x-1 border-b">
						<button
							type="button"
							className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
								activeTab === "overview"
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
							onClick={() => setActiveTab("overview")}
						>
							概要
						</button>
						<button
							type="button"
							className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
								activeTab === "koudens"
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
							onClick={() => setActiveTab("koudens")}
						>
							参加香典帳 ({user.koudens.length})
						</button>
						<button
							type="button"
							className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
								activeTab === "activity"
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
							onClick={() => setActiveTab("activity")}
						>
							アクティビティ
						</button>
					</div>
				</CardHeader>
				<CardContent>
					{activeTab === "overview" && (
						<div className="space-y-4">
							<div>
								<h3 className="font-semibold mb-2">アカウント状態</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
									<div className="flex items-center justify-between p-3 border rounded-lg">
										<span>メール認証</span>
										{user.email_confirmed_at ? (
											<Badge variant="default" className="bg-green-100 text-green-800">
												<CheckCircle className="h-3 w-3 mr-1" />
												認証済み
											</Badge>
										) : (
											<Badge variant="destructive">
												<XCircle className="h-3 w-3 mr-1" />
												未認証
											</Badge>
										)}
									</div>

									<div className="flex items-center justify-between p-3 border rounded-lg">
										<span>アカウント種別</span>
										<Badge variant={user.admin_info ? "secondary" : "outline"}>
											{user.admin_info ? "管理者" : "一般ユーザー"}
										</Badge>
									</div>
								</div>
							</div>

							<Separator />

							<div>
								<h3 className="font-semibold mb-2">利用状況</h3>
								<div className="text-sm text-muted-foreground space-y-1">
									<p>• 香典帳を {user.stats.owned_koudens_count} 件所有</p>
									<p>• {user.stats.participated_koudens_count} 件の香典帳に参加</p>
									<p>• 合計 {user.stats.total_entries_count} 件の記録を作成</p>
									{user.last_sign_in_at && (
										<p>
											• 最終ログイン:{" "}
											{format(new Date(user.last_sign_in_at), "yyyy年MM月dd日 HH:mm", {
												locale: ja,
											})}
										</p>
									)}
								</div>
							</div>
						</div>
					)}

					{activeTab === "koudens" && (
						<div className="space-y-4">
							{user.koudens.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									<BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
									<p>参加している香典帳がありません</p>
								</div>
							) : (
								<div className="space-y-3">
									{user.koudens.map((kouden) => (
										<button
											type="button"
											key={kouden.id}
											className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
											onClick={() => handleKoudenClick(kouden.id)}
										>
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<h4 className="font-medium">{kouden.title}</h4>
													<Badge
														variant={kouden.role === "owner" ? "default" : "secondary"}
														className="text-xs"
													>
														{kouden.role === "owner"
															? "所有者"
															: kouden.role === "editor"
																? "編集者"
																: "閲覧者"}
													</Badge>
												</div>
												<div className="text-sm text-muted-foreground">
													参加日:{" "}
													{format(new Date(kouden.joined_at), "yyyy年MM月dd日", { locale: ja })}
													{kouden.last_activity && (
														<span className="ml-4">
															最終更新:{" "}
															{formatDistanceToNow(new Date(kouden.last_activity), {
																addSuffix: true,
																locale: ja,
															})}
														</span>
													)}
												</div>
											</div>
											<ExternalLink className="h-4 w-4 text-muted-foreground" />
										</button>
									))}
								</div>
							)}
						</div>
					)}

					{activeTab === "activity" && (
						<div className="space-y-4">
							<div className="text-center py-8 text-muted-foreground">
								<Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>アクティビティ履歴は今後実装予定です</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
