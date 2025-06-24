"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save, User, MapPin, Phone, Mail, FileText } from "lucide-react";
import type {
	Customer,
	CreateCustomerInput,
	UpdateCustomerInput,
	CustomerStatus,
} from "@/types/funeral-management";

interface CustomerFormProps {
	customer?: Customer;
	organizationId: string;
	onSubmit: (
		data: CreateCustomerInput | UpdateCustomerInput,
	) => Promise<{ success: boolean; error?: string }>;
	onCancel: () => void;
	mode: "create" | "edit";
}

/**
 * 顧客情報登録・編集フォーム
 * 基本情報と詳細情報を同時に入力
 */
export function CustomerForm({
	customer,
	organizationId,
	onSubmit,
	onCancel,
	mode,
}: CustomerFormProps) {
	const [isLoading, setIsLoading] = useState(false);

	// フォーム状態
	const [formData, setFormData] = useState({
		// 基本情報
		name: customer?.name || "",
		email: customer?.email || "",
		phone: customer?.phone || "",

		// 詳細情報
		address: customer?.details?.address || "",
		religion: customer?.details?.religion || "",
		allergy: customer?.details?.allergy || "",
		registration_date:
			customer?.details?.registration_date || new Date().toISOString().split("T")[0],
		last_contact_date: customer?.details?.last_contact_date || "",
		notes: customer?.details?.notes || "",
		status: (customer?.details?.status as CustomerStatus) || "アクティブ",
	});

	// フォーム送信処理
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			// バリデーション
			if (!formData.name.trim()) {
				toast.error("エラー", {
					description: "顧客名は必須です",
				});
				return;
			}

			if (!formData.email.trim()) {
				toast.error("エラー", {
					description: "メールアドレスは必須です",
				});
				return;
			}

			// データ構築
			const submitData =
				mode === "create"
					? ({
							...formData,
							organization_id: organizationId,
						} as CreateCustomerInput)
					: ({
							id: customer?.id || "",
							...formData,
						} as UpdateCustomerInput);

			const result = await onSubmit(submitData);

			if (result.success) {
				toast.success("成功", {
					description: mode === "create" ? "顧客を登録しました" : "顧客情報を更新しました",
				});
			} else {
				toast.error("エラー", {
					description: result.error || "処理に失敗しました",
				});
			}
		} catch (error) {
			console.error("フォーム送信エラー:", error);
			toast.error("エラー", {
				description: "システムエラーが発生しました",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* 基本情報 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						基本情報
					</CardTitle>
					<CardDescription>顧客の基本的な連絡先情報を入力してください</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">顧客名 *</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
								placeholder="山田 太郎"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">メールアドレス *</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
								<Input
									id="email"
									type="email"
									value={formData.email}
									onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
									placeholder="yamada@example.com"
									className="pl-10"
									required
								/>
							</div>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="phone">電話番号</Label>
						<div className="relative">
							<Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								id="phone"
								value={formData.phone}
								onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
								placeholder="03-1234-5678"
								className="pl-10"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 詳細情報 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						詳細情報
					</CardTitle>
					<CardDescription>葬儀管理に必要な詳細情報を入力してください</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="address">住所</Label>
						<div className="relative">
							<MapPin className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
							<Textarea
								id="address"
								value={formData.address}
								onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
								placeholder="東京都港区赤坂1-1-1"
								className="pl-10"
								rows={2}
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="religion">宗教</Label>
							<Input
								id="religion"
								value={formData.religion}
								onChange={(e) => setFormData((prev) => ({ ...prev, religion: e.target.value }))}
								placeholder="仏教、神道など"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="registration_date">登録日</Label>
							<Input
								id="registration_date"
								type="date"
								value={formData.registration_date}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, registration_date: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="last_contact_date">最終連絡日</Label>
							<Input
								id="last_contact_date"
								type="date"
								value={formData.last_contact_date}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, last_contact_date: e.target.value }))
								}
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="status">ステータス</Label>
							<Select
								value={formData.status}
								onValueChange={(value: CustomerStatus) =>
									setFormData((prev) => ({ ...prev, status: value }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="ステータスを選択" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="アクティブ">アクティブ</SelectItem>
									<SelectItem value="案件進行中">案件進行中</SelectItem>
									<SelectItem value="フォロー中">フォロー中</SelectItem>
									<SelectItem value="完了">完了</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="allergy">アレルギー</Label>
							<Input
								id="allergy"
								value={formData.allergy}
								onChange={(e) => setFormData((prev) => ({ ...prev, allergy: e.target.value }))}
								placeholder="食物アレルギーなど"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notes">備考</Label>
						<Textarea
							id="notes"
							value={formData.notes}
							onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
							placeholder="特記事項や連絡内容など"
							rows={3}
						/>
					</div>
				</CardContent>
			</Card>

			<Separator />

			{/* アクションボタン */}
			<div className="flex items-center justify-end gap-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					キャンセル
				</Button>
				<Button type="submit" disabled={isLoading}>
					{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					<Save className="mr-2 h-4 w-4" />
					{mode === "create" ? "登録する" : "更新する"}
				</Button>
			</div>
		</form>
	);
}
