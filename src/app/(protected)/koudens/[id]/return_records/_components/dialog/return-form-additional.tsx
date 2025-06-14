"use client";

// library
import type { UseFormReturn } from "react-hook-form";
// types
import type { Entry } from "@/types/entries";
// components
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface ReturnFormData {
	kouden_entry_id: string;
	return_status: "PENDING" | "PARTIAL_RETURNED" | "COMPLETED" | "NOT_REQUIRED";
	funeral_gift_amount: number;
	additional_return_amount?: number;
	return_method?: string;
	arrangement_date?: string;
	remarks?: string;
	return_items?: Array<{
		name: string;
		price: number;
		quantity: number;
		notes?: string;
	}>;
}

interface ReturnFormAdditionalProps {
	form: UseFormReturn<ReturnFormData>;
	selectedEntry?: Entry;
}

/**
 * ReturnFormAdditionalコンポーネント
 * 役割：返礼フォームの詳細・備考タブ
 */
export function ReturnFormAdditional({ form, selectedEntry }: ReturnFormAdditionalProps) {
	return (
		<div className="space-y-6">
			{/* 日付情報 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm flex items-center gap-2">
						<Calendar className="h-4 w-4" />
						日付情報
					</CardTitle>
					<CardDescription>返礼に関する重要な日付を記録します</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* 手配日 */}
					<FormField
						control={form.control}
						name="arrangement_date"
						render={({ field }) => (
							<FormItem>
								<FormLabel>手配日</FormLabel>
								<FormControl>
									<Input type="date" {...field} />
								</FormControl>
								<FormDescription>返礼品の手配を行った日付を入力してください</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</CardContent>
			</Card>

			{/* 備考・メモ */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">備考・メモ</CardTitle>
					<CardDescription>返礼に関する追加情報や特記事項を記録します</CardDescription>
				</CardHeader>
				<CardContent>
					<FormField
						control={form.control}
						name="remarks"
						render={({ field }) => (
							<FormItem>
								<FormLabel>備考</FormLabel>
								<FormControl>
									<Textarea
										placeholder="返礼に関する特記事項、連絡事項、その他のメモなどを入力してください"
										className="resize-none"
										rows={6}
										{...field}
									/>
								</FormControl>
								<FormDescription>
									例: 遠方のため郵送で対応、特別な配慮が必要、お返しを辞退された等
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</CardContent>
			</Card>

			{/* 選択されたエントリー情報の詳細 */}
			{selectedEntry && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">参考情報</CardTitle>
						<CardDescription>選択された香典エントリーの詳細情報</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<span className="text-muted-foreground">作成日:</span>
								<p>
									{selectedEntry.created_at
										? new Date(selectedEntry.created_at).toLocaleDateString("ja-JP")
										: "-"}
								</p>
							</div>
							<div>
								<span className="text-muted-foreground">電話番号:</span>
								<p>{selectedEntry.phone_number || "-"}</p>
							</div>
							<div>
								<span className="text-muted-foreground">住所:</span>
								<p>{selectedEntry.address || "-"}</p>
							</div>
							<div>
								<span className="text-muted-foreground">郵便番号:</span>
								<p>{selectedEntry.postal_code || "-"}</p>
							</div>
						</div>
						{selectedEntry.notes && (
							<div className="mt-4">
								<span className="text-muted-foreground text-sm">香典エントリーの備考:</span>
								<p className="mt-1 p-2 bg-muted rounded text-sm">{selectedEntry.notes}</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
