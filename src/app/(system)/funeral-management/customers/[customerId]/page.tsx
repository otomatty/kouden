import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, UserCheck, Phone, Mail, MapPin, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCustomer } from "@/app/_actions/funeral/customers/getCustomer";

interface CustomerDetailPageProps {
	params: Promise<{
		customerId: string;
	}>;
}

export async function generateMetadata({ params }: CustomerDetailPageProps): Promise<Metadata> {
	const { customerId } = await params;
	const result = await getCustomer(customerId);

	if (!result.success) {
		return {
			title: "顧客が見つかりません | 葬儀会社管理システム",
		};
	}

	if (!result.data) {
		return {
			title: "顧客が見つかりません | 葬儀会社管理システム",
		};
	}

	return {
		title: `${result.data.name} | 顧客詳細 | 葬儀会社管理システム`,
		description: `${result.data.name}さんの顧客情報`,
	};
}

/**
 * ステータスに応じたバッジの色を取得
 */
function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "アクティブ":
			return "default";
		case "案件進行中":
			return "secondary";
		case "フォロー中":
			return "outline";
		case "完了":
			return "destructive";
		default:
			return "outline";
	}
}

/**
 * 日付を日本語形式でフォーマット
 */
function formatDate(dateString: string | null): string {
	if (!dateString) return "未設定";
	const date = new Date(dateString);
	return date.toLocaleDateString("ja-JP", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
	const { customerId } = await params;
	const result = await getCustomer(customerId);

	if (!result.success) {
		notFound();
	}

	if (!result.data) {
		notFound();
	}

	const customer = result.data;

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* ヘッダー */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link href="/funeral-management/customers">
						<Button variant="outline" size="icon">
							<ArrowLeft className="h-4 w-4" />
						</Button>
					</Link>
					<div>
						<h1 className="text-3xl font-bold">{customer.name}</h1>
						<p className="text-muted-foreground mt-2">顧客詳細情報</p>
					</div>
				</div>
				<Link href={`/funeral-management/customers/${customer.id}/edit`}>
					<Button>
						<Edit className="mr-2 h-4 w-4" />
						編集
					</Button>
				</Link>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* 基本情報 */}
				<div className="lg:col-span-2 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<UserCheck className="h-5 w-5" />
								基本情報
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Mail className="h-4 w-4" />
										メールアドレス
									</div>
									<p className="font-medium">{customer.email}</p>
								</div>
								{customer.phone && (
									<div className="space-y-2">
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Phone className="h-4 w-4" />
											電話番号
										</div>
										<p className="font-medium">{customer.phone}</p>
									</div>
								)}
							</div>

							{customer.details?.address && (
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<MapPin className="h-4 w-4" />
										住所
									</div>
									<p className="font-medium">{customer.details.address}</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* 詳細情報 */}
					{customer.details && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									詳細情報
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{customer.details.religion && (
										<div className="space-y-2">
											<div className="text-sm text-muted-foreground">宗教</div>
											<p className="font-medium">{customer.details.religion}</p>
										</div>
									)}
									{customer.details.allergy && (
										<div className="space-y-2">
											<div className="text-sm text-muted-foreground">アレルギー</div>
											<p className="font-medium">{customer.details.allergy}</p>
										</div>
									)}
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Calendar className="h-4 w-4" />
											登録日
										</div>
										<p className="font-medium">{formatDate(customer.details.registration_date)}</p>
									</div>
									{customer.details.last_contact_date && (
										<div className="space-y-2">
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<Calendar className="h-4 w-4" />
												最終連絡日
											</div>
											<p className="font-medium">
												{formatDate(customer.details.last_contact_date)}
											</p>
										</div>
									)}
								</div>

								{customer.details.notes && (
									<div className="space-y-2">
										<div className="text-sm text-muted-foreground">備考</div>
										<p className="font-medium whitespace-pre-wrap">{customer.details.notes}</p>
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</div>

				{/* サイドバー */}
				<div className="space-y-6">
					{/* ステータス */}
					<Card>
						<CardHeader>
							<CardTitle>ステータス</CardTitle>
						</CardHeader>
						<CardContent>
							<Badge variant={getStatusVariant(customer.details?.status || "")}>
								{customer.details?.status || "未設定"}
							</Badge>
						</CardContent>
					</Card>

					{/* システム情報 */}
					<Card>
						<CardHeader>
							<CardTitle>システム情報</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div>
								<div className="text-sm text-muted-foreground">作成日時</div>
								<p className="font-medium text-sm">{formatDate(customer.created_at)}</p>
							</div>
							{customer.updated_at && (
								<div>
									<div className="text-sm text-muted-foreground">更新日時</div>
									<p className="font-medium text-sm">{formatDate(customer.updated_at)}</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* 関連案件 */}
					<Card>
						<CardHeader>
							<CardTitle>関連案件</CardTitle>
							<CardDescription>この顧客に関連する葬儀案件</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">準備中...</p>
							{/* TODO: 関連案件一覧を実装 */}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
