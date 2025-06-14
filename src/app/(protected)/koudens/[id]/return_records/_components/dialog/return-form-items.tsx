"use client";

// library
import { useState } from "react";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
// types
import type { Entry } from "@/types/entries";
// components
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package } from "lucide-react";

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

interface ReturnFormItemsProps {
	form: UseFormReturn<ReturnFormData>;
	selectedEntry?: Entry;
}

/**
 * ReturnFormItemsコンポーネント
 * 役割：返礼品の管理
 */
export function ReturnFormItems({ form, selectedEntry }: ReturnFormItemsProps) {
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "return_items",
	});

	const addItem = () => {
		append({
			name: "",
			price: 0,
			quantity: 1,
			notes: "",
		});
	};

	// 合計金額の計算
	const totalAmount = fields.reduce((sum, _, index) => {
		const price = form.watch(`return_items.${index}.price`) || 0;
		const quantity = form.watch(`return_items.${index}.quantity`) || 0;
		return sum + price * quantity;
	}, 0);

	return (
		<div className="space-y-6">
			{/* 返礼対象の金額情報 */}
			{selectedEntry && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm flex items-center gap-2">
							<Package className="h-4 w-4" />
							返礼対象情報
						</CardTitle>
						<CardDescription>返礼品の参考にしてください</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="text-muted-foreground">香典金額:</span>
								<p className="font-medium text-lg">¥{selectedEntry.amount.toLocaleString()}</p>
							</div>
							<div>
								<span className="text-muted-foreground">推奨返礼割合 (30-50%):</span>
								<p className="text-muted-foreground">
									¥{Math.floor(selectedEntry.amount * 0.3).toLocaleString()} - ¥
									{Math.floor(selectedEntry.amount * 0.5).toLocaleString()}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* 返礼品リスト */}
			<div className="space-y-4">
				<div className="flex justify-between items-center">
					<div>
						<h3 className="text-lg font-medium">返礼品</h3>
						<p className="text-sm text-muted-foreground">返礼品の詳細を入力してください</p>
					</div>
					<Badge variant="secondary">合計: ¥{totalAmount.toLocaleString()}</Badge>
				</div>

				{fields.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-8">
							<Package className="h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-muted-foreground mb-4">返礼品が登録されていません</p>
							<Button onClick={addItem} variant="outline">
								<Plus className="h-4 w-4 mr-2" />
								最初の返礼品を追加
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						{fields.map((field, index) => (
							<Card key={field.id}>
								<CardHeader>
									<CardTitle className="text-sm flex justify-between items-center">
										返礼品 #{index + 1}
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => remove(index)}
											className="text-destructive hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{/* 返礼品名 */}
										<FormField
											control={form.control}
											name={`return_items.${index}.name`}
											render={({ field }) => (
												<FormItem>
													<FormLabel>返礼品名 *</FormLabel>
													<FormControl>
														<Input placeholder="例: カタログギフト、お茶セット" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										{/* 価格 */}
										<FormField
											control={form.control}
											name={`return_items.${index}.price`}
											render={({ field }) => (
												<FormItem>
													<FormLabel>価格 *</FormLabel>
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

										{/* 数量 */}
										<FormField
											control={form.control}
											name={`return_items.${index}.quantity`}
											render={({ field }) => (
												<FormItem>
													<FormLabel>数量 *</FormLabel>
													<FormControl>
														<Input
															type="number"
															min="1"
															placeholder="1"
															{...field}
															onChange={(e) => field.onChange(Number(e.target.value))}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										{/* 小計表示 */}
										<div className="flex items-end">
											<div className="space-y-2">
												<FormLabel>小計</FormLabel>
												<div className="px-3 py-2 bg-muted rounded-md">
													¥
													{(
														(form.watch(`return_items.${index}.price`) || 0) *
														(form.watch(`return_items.${index}.quantity`) || 0)
													).toLocaleString()}
												</div>
											</div>
										</div>
									</div>

									{/* 備考 */}
									<FormField
										control={form.control}
										name={`return_items.${index}.notes`}
										render={({ field }) => (
											<FormItem>
												<FormLabel>備考</FormLabel>
												<FormControl>
													<Textarea
														placeholder="返礼品に関する備考があれば入力してください"
														className="resize-none"
														rows={2}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
						))}

						{/* 返礼品追加ボタン */}
						<Button type="button" variant="outline" onClick={addItem} className="w-full">
							<Plus className="h-4 w-4 mr-2" />
							返礼品を追加
						</Button>
					</div>
				)}
			</div>

			{/* 合計金額サマリー */}
			{fields.length > 0 && selectedEntry && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">返礼率</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span>香典金額:</span>
								<span>¥{selectedEntry.amount.toLocaleString()}</span>
							</div>
							<div className="flex justify-between">
								<span>返礼品合計:</span>
								<span>¥{totalAmount.toLocaleString()}</span>
							</div>
							<div className="flex justify-between font-medium border-t pt-2">
								<span>返礼率:</span>
								<span
									className={
										totalAmount / selectedEntry.amount > 0.5
											? "text-orange-600"
											: totalAmount / selectedEntry.amount < 0.3
												? "text-blue-600"
												: "text-green-600"
									}
								>
									{((totalAmount / selectedEntry.amount) * 100).toFixed(1)}%
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
