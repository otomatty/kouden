import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getContactRequestDetail } from "@/app/_actions/admin/contact-requests";
import { formatDistanceToNow, format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, Mail, User, Building, Calendar, FileText, Paperclip } from "lucide-react";
import Link from "next/link";
import { ContactRequestStatusUpdater } from "../_components/contact-request-status-updater";

interface ContactRequestDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

const statusConfig = {
	new: { label: "新規", variant: "destructive" as const },
	in_progress: { label: "対応中", variant: "default" as const },
	closed: { label: "完了", variant: "secondary" as const },
};

const categoryConfig = {
	support: "サポート",
	account: "アカウント",
	bug: "バグ報告",
	feature: "機能要望",
	business: "法人相談",
	other: "その他",
};

export default async function ContactRequestDetailPage({ params }: ContactRequestDetailPageProps) {
	try {
		const { id } = await params;
		const request = await getContactRequestDetail(id);

		return (
			<div className="space-y-6">
				{/* ヘッダー */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button asChild variant="outline" size="sm">
							<Link href="/admin/support">
								<ArrowLeft className="h-4 w-4 mr-1" />
								一覧に戻る
							</Link>
						</Button>
						<div>
							<h1 className="text-2xl font-semibold text-gray-900">お問い合わせ詳細</h1>
							<p className="text-gray-600 text-sm font-mono">ID: {request.id}</p>
						</div>
					</div>
					<ContactRequestStatusUpdater requestId={request.id} currentStatus={request.status} />
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					{/* メイン情報 */}
					<div className="lg:col-span-2 space-y-6">
						{/* 基本情報 */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="flex items-center gap-2">
										<FileText className="h-5 w-5" />
										お問い合わせ内容
									</CardTitle>
									<div className="flex items-center gap-2">
										<Badge variant="outline">
											{categoryConfig[request.category as keyof typeof categoryConfig] ||
												request.category}
										</Badge>
										<Badge
											variant={
												statusConfig[request.status as keyof typeof statusConfig]?.variant ||
												"default"
											}
										>
											{statusConfig[request.status as keyof typeof statusConfig]?.label ||
												request.status}
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{request.subject && (
									<div>
										<h3 className="font-medium text-gray-900 mb-2">件名</h3>
										<p className="text-gray-700">{request.subject}</p>
									</div>
								)}
								<div>
									<h3 className="font-medium text-gray-900 mb-2">内容</h3>
									<div className="bg-gray-50 p-4 rounded-lg">
										<pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
											{request.message}
										</pre>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* 添付ファイル */}
						{request.contact_request_attachments &&
							request.contact_request_attachments.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Paperclip className="h-5 w-5" />
											添付ファイル
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											{request.contact_request_attachments.map((attachment) => (
												<div
													key={attachment.id}
													className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
												>
													<span className="text-sm font-medium">{attachment.file_name}</span>
													<Button asChild variant="outline" size="sm">
														<a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
															ダウンロード
														</a>
													</Button>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							)}
					</div>

					{/* サイドバー */}
					<div className="space-y-6">
						{/* お客様情報 */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<User className="h-5 w-5" />
									お客様情報
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-2">
									<User className="h-4 w-4 text-gray-500" />
									<span className="text-sm">{request.name || "未入力"}</span>
								</div>
								<div className="flex items-center gap-2">
									<Mail className="h-4 w-4 text-gray-500" />
									<span className="text-sm">{request.email}</span>
								</div>
								{request.company_name && (
									<div className="flex items-center gap-2">
										<Building className="h-4 w-4 text-gray-500" />
										<span className="text-sm">{request.company_name}</span>
									</div>
								)}
							</CardContent>
						</Card>

						{/* 日時情報 */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Calendar className="h-5 w-5" />
									日時情報
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<p className="text-sm font-medium text-gray-900">作成日時</p>
									<p className="text-sm text-gray-600">
										{format(new Date(request.created_at), "yyyy年MM月dd日 HH:mm", {
											locale: ja,
										})}
									</p>
									<p className="text-xs text-gray-500">
										(
										{formatDistanceToNow(new Date(request.created_at), {
											addSuffix: true,
											locale: ja,
										})}
										)
									</p>
								</div>
								{request.updated_at !== request.created_at && (
									<div>
										<p className="text-sm font-medium text-gray-900">更新日時</p>
										<p className="text-sm text-gray-600">
											{format(new Date(request.updated_at), "yyyy年MM月dd日 HH:mm", {
												locale: ja,
											})}
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		);
	} catch (error) {
		console.error("Failed to fetch contact request:", error);
		notFound();
	}
}
