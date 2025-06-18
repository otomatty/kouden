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
	// additional_return_amount は生成カラムのため除外
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
}

/**
 * ReturnFormAdditionalコンポーネント
 * 役割：返礼フォームの詳細・備考タブ
 */
export function ReturnFormAdditional({ form }: ReturnFormAdditionalProps) {
	return (
		<div className="space-y-6">
			{/* 日付情報 */}
			{/* 手配日 */}
			<FormField
				control={form.control}
				name="arrangement_date"
				render={({ field }) => (
					<FormItem>
						<FormLabel optional>手配日</FormLabel>
						<FormControl>
							<Input type="date" {...field} />
						</FormControl>
						<FormDescription>返礼品の手配を行った日付を入力してください</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* 備考・メモ */}
			<FormField
				control={form.control}
				name="remarks"
				render={({ field }) => (
					<FormItem>
						<FormLabel optional>備考</FormLabel>
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
		</div>
	);
}
