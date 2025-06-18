"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X } from "lucide-react";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { returnItemFormSchema, type ReturnItemFormData } from "@/schemas/return-items";
import type { ReturnItem, ReturnItemCategory } from "@/types/return-records/return-items";
import { ReturnItemImageUploader } from "./return-item-image-uploader";
import {
	uploadReturnItemImage,
	deleteReturnItemImage,
} from "@/app/_actions/return-records/return-items";

interface ReturnItemFormProps {
	/** 編集時の初期データ（新規作成時はundefined） */
	initialData?: ReturnItem;
	/** 送信処理 */
	onSubmit: (data: ReturnItemFormData) => Promise<void>;
	/** キャンセル処理 */
	onCancel: () => void;
	/** 送信中フラグ */
	isSubmitting?: boolean;
	/** フォームタイトル */
	title: string;
	/** 送信ボタンテキスト */
	submitButtonText: string;
	/** 香典帳ID（画像アップロード用） */
	koudenId: string;
}

/**
 * 返礼品作成・編集用の共通フォームコンポーネント
 * 役割：返礼品情報の入力・バリデーション・送信処理
 * Tabsで基本情報と詳細設定を分離し、react-hook-formとzodでバリデーション
 */
export function ReturnItemForm({
	initialData,
	onSubmit,
	onCancel,
	isSubmitting = false,
	title,
	submitButtonText,
	koudenId,
}: ReturnItemFormProps) {
	const { toast } = useToast();

	// react-hook-formの設定
	const form = useForm<ReturnItemFormData>({
		resolver: zodResolver(returnItemFormSchema),
		defaultValues: {
			name: initialData?.name || "",
			description: initialData?.description || "",
			price: initialData?.price || 0,
			category: initialData?.category || null,
			image_url: initialData?.image_url || "",
			is_active: initialData?.is_active ?? true,
			sort_order: initialData?.sort_order || 1,
			recommended_amount_min: initialData?.recommended_amount_min || null,
			recommended_amount_max: initialData?.recommended_amount_max || null,
		},
	});

	// カテゴリオプション
	const categoryOptions = [
		{ value: "FUNERAL_GIFT", label: "会葬品" },
		{ value: "GIFT_CARD", label: "ギフト券" },
		{ value: "FOOD", label: "食品" },
		{ value: "FLOWER", label: "花・植物" },
		{ value: "OTHER", label: "その他" },
	] as const;

	// 画像変更処理
	const handleImageChange = useCallback(
		async (imageUrl: string | null) => {
			try {
				if (imageUrl) {
					// 新しい画像をアップロード
					const response = await fetch(imageUrl);
					const blob = await response.blob();
					const uploadedUrl = await uploadReturnItemImage(blob, koudenId);
					form.setValue("image_url", uploadedUrl);
				} else {
					// 既存画像を削除
					const currentImageUrl = form.getValues("image_url");
					if (currentImageUrl) {
						await deleteReturnItemImage(currentImageUrl);
					}
					form.setValue("image_url", "");
				}
			} catch (error) {
				console.error("[ERROR] Image upload/delete failed:", error);
				toast({
					title: "画像処理エラー",
					description: error instanceof Error ? error.message : "画像の処理に失敗しました",
					variant: "destructive",
				});
			}
		},
		[koudenId, form, toast],
	);

	// 送信処理
	const handleSubmit = useCallback(
		async (data: ReturnItemFormData) => {
			try {
				await onSubmit(data);
			} catch (error) {
				console.error("[ERROR] Form submission failed:", error);
				toast({
					title: "送信エラー",
					description: "フォームの送信に失敗しました",
					variant: "destructive",
				});
			}
		},
		[onSubmit, toast],
	);

	// 推奨金額の入力をクリア
	const clearRecommendedAmount = useCallback(
		(field: "recommended_amount_min" | "recommended_amount_max") => {
			form.setValue(field, null);
		},
		[form],
	);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>{title}</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="basic" className="space-y-6">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="basic">基本情報</TabsTrigger>
								<TabsTrigger value="advanced">詳細設定</TabsTrigger>
							</TabsList>

							{/* 基本情報タブ */}
							<TabsContent value="basic" className="space-y-6">
								<div className="space-y-4">
									{/* 返礼品名 */}
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel required>返礼品名</FormLabel>
												<FormControl>
													<Input {...field} placeholder="返礼品名を入力してください" />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* 価格 */}
									<FormField
										control={form.control}
										name="price"
										render={({ field }) => (
											<FormItem>
												<FormLabel required>価格（円）</FormLabel>
												<FormControl>
													<Input
														{...field}
														type="number"
														placeholder="0"
														min="0"
														max="10000000"
														onChange={(e) => field.onChange(Number(e.target.value))}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* カテゴリ */}
									<FormField
										control={form.control}
										name="category"
										render={({ field }) => (
											<FormItem>
												<FormLabel optional>カテゴリ</FormLabel>
												<Select
													value={field.value || ""}
													onValueChange={(value) => field.onChange(value as ReturnItemCategory)}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="カテゴリを選択してください" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{categoryOptions.map((option) => (
															<SelectItem key={option.value} value={option.value}>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* 説明 */}
									<FormField
										control={form.control}
										name="description"
										render={({ field }) => (
											<FormItem>
												<FormLabel optional>説明</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														value={field.value || ""}
														placeholder="返礼品の説明を入力してください"
														rows={4}
													/>
												</FormControl>
												<FormDescription>{(field.value || "").length}/500文字</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</TabsContent>

							{/* 詳細設定タブ */}
							<TabsContent value="advanced" className="space-y-6">
								<div className="space-y-6">
									{/* 画像設定 */}
									<div className="space-y-4">
										<h3 className="text-lg font-semibold">画像設定</h3>
										<FormField
											control={form.control}
											name="image_url"
											render={({ field }) => (
												<FormItem>
													<FormLabel optional>返礼品画像</FormLabel>
													<FormControl>
														<ReturnItemImageUploader
															currentImageUrl={field.value}
															onImageChange={handleImageChange}
															isUploading={isSubmitting}
															disabled={isSubmitting}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									{/* 表示設定 */}
									<div className="space-y-4">
										<h3 className="text-lg font-semibold">表示設定</h3>

										{/* 表示順序 */}
										<FormField
											control={form.control}
											name="sort_order"
											render={({ field }) => (
												<FormItem>
													<FormLabel>表示順序</FormLabel>
													<FormControl>
														<Input
															{...field}
															type="number"
															placeholder="1"
															min="1"
															max="9999"
															onChange={(e) => field.onChange(Number(e.target.value))}
														/>
													</FormControl>
													<FormDescription>小さい数字ほど上に表示されます</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										{/* アクティブ状態 */}
										<FormField
											control={form.control}
											name="is_active"
											render={({ field }) => (
												<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
													<div className="space-y-0.5">
														<FormLabel>返礼品を表示する</FormLabel>
														<FormDescription>
															オフにすると選択リストに表示されません
														</FormDescription>
													</div>
													<FormControl>
														<Switch checked={field.value} onCheckedChange={field.onChange} />
													</FormControl>
												</FormItem>
											)}
										/>
									</div>

									{/* 推奨香典金額 */}
									<div className="space-y-4">
										<h3 className="text-lg font-semibold">推奨香典金額</h3>

										{/* 最小金額 */}
										<FormField
											control={form.control}
											name="recommended_amount_min"
											render={({ field }) => (
												<FormItem>
													<FormLabel optional>推奨金額（最小・円）</FormLabel>
													<div className="flex gap-2">
														<FormControl>
															<Input
																value={field.value || ""}
																onChange={(e) =>
																	field.onChange(e.target.value ? Number(e.target.value) : null)
																}
																type="number"
																placeholder="例: 5000"
																min="0"
																max="10000000"
																className="flex-1"
															/>
														</FormControl>
														<Button
															type="button"
															variant="outline"
															size="icon"
															onClick={() => clearRecommendedAmount("recommended_amount_min")}
															disabled={field.value === null}
														>
															<X className="h-4 w-4" />
														</Button>
													</div>
													<FormMessage />
												</FormItem>
											)}
										/>

										{/* 最大金額 */}
										<FormField
											control={form.control}
											name="recommended_amount_max"
											render={({ field }) => (
												<FormItem>
													<FormLabel optional>推奨金額（最大・円）</FormLabel>
													<div className="flex gap-2">
														<FormControl>
															<Input
																value={field.value || ""}
																onChange={(e) =>
																	field.onChange(e.target.value ? Number(e.target.value) : null)
																}
																type="number"
																placeholder="例: 10000（空欄の場合は上限なし）"
																min="0"
																max="10000000"
																className="flex-1"
															/>
														</FormControl>
														<Button
															type="button"
															variant="outline"
															size="icon"
															onClick={() => clearRecommendedAmount("recommended_amount_max")}
															disabled={field.value === null}
														>
															<X className="h-4 w-4" />
														</Button>
													</div>
													<FormDescription>空欄の場合は上限なしとして扱われます</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>

				{/* フォームアクション */}
				<div className="flex justify-end gap-3">
					<Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
						キャンセル
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "処理中..." : submitButtonText}
					</Button>
				</div>
			</form>
		</Form>
	);
}
