"use client";

// library
import type { UseFormReturn } from "react-hook-form";
// types
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import type { ReturnStatus } from "@/types/return-records/return-records";
// components
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReturnFormData {
	kouden_entry_id: string;
	return_status: ReturnStatus;
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

interface ReturnFormBasicProps {
	form: UseFormReturn<ReturnFormData>;
	entries: Entry[];
	relationships: Relationship[];
	selectedEntry?: Entry;
}

/**
 * 返礼状況のオプション
 */
const statusOptions = [
	{ value: "PENDING", label: "未対応", color: "outline" },
	{ value: "PARTIAL_RETURNED", label: "一部返礼", color: "secondary" },
	{ value: "COMPLETED", label: "完了", color: "default" },
	{ value: "NOT_REQUIRED", label: "返礼不要", color: "destructive" },
] as const;

/**
 * ReturnFormBasicコンポーネント
 * 役割：返礼フォームの基本情報タブ（編集専用）
 * 香典エントリーは変更不可（編集対象が固定のため）
 */
export function ReturnFormBasic({ form, relationships, selectedEntry }: ReturnFormBasicProps) {
	// 選択されたエントリーの関係性情報を取得
	const selectedRelationship = selectedEntry?.relationship_id
		? relationships.find((r) => r.id === selectedEntry.relationship_id)
		: null;

	return (
		<div className="space-y-6">
			{/* 選択されたエントリーの詳細表示 */}
			{selectedEntry && (
				<Card className="p-4">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">名前:</span>
							<p className="font-medium">{selectedEntry.name}</p>
						</div>
						<div>
							<span className="text-muted-foreground">組織:</span>
							<p>{selectedEntry.organization}</p>
						</div>
						{selectedEntry.position && (
							<div>
								<span className="text-muted-foreground">役職:</span>
								<p>{selectedEntry.position}</p>
							</div>
						)}
						<div>
							<span className="text-muted-foreground">関係性:</span>
							<p>{selectedRelationship?.name || "-"}</p>
						</div>
						<div>
							<span className="text-muted-foreground">香典金額:</span>
							<p className="font-medium">¥{selectedEntry.amount.toLocaleString()}</p>
						</div>
						{selectedEntry.has_offering && (
							<div>
								<span className="text-muted-foreground">お供え物:</span>
								<p>あり</p>
							</div>
						)}
					</div>
				</Card>
			)}

			{/* 返礼状況 */}
			<FormField
				control={form.control}
				name="return_status"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>返礼状況</FormLabel>
						<Select onValueChange={field.onChange} defaultValue={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="ステータスを選択してください" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{statusOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										<div className="flex items-center gap-2">
											<Badge
												variant={
													option.color as "outline" | "secondary" | "default" | "destructive"
												}
											>
												{option.label}
											</Badge>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* 葬儀ギフト金額 */}
			<FormField
				control={form.control}
				name="funeral_gift_amount"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>葬儀ギフト金額</FormLabel>
						<FormControl>
							<Input
								type="number"
								placeholder="0"
								{...field}
								onChange={(e) => field.onChange(Number(e.target.value))}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* 追加返礼金額は生成カラムのため入力フィールドを削除 */}

			{/* 返礼方法 */}
			<FormField
				control={form.control}
				name="return_method"
				render={({ field }) => (
					<FormItem>
						<FormLabel optional>返礼方法</FormLabel>
						<FormControl>
							<Input placeholder="例: 直接お渡し、郵送など" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
