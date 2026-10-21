"use client";

import { useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, ShoppingCart, ChevronDown, ChevronUp, Lock } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ReturnItemSelector } from "./return-item-selector";
import type { ReturnFormData } from "./types";
import type { UseFormReturn } from "react-hook-form";
import type { ReturnItem } from "@/types/return-records/return-items";

interface ReturnItemCardProps {
	form: UseFormReturn<ReturnFormData>;
	index: number;
	isExpanded: boolean;
	onToggleExpanded: () => void;
	onRemove: () => void;
	onSelectFromMaster: () => void;
	onItemSelected: (item: ReturnItem) => void;
	koudenId: string;
	showSelector: boolean;
	selectedIndex: number | null;
	setShowSelector: (show: boolean) => void;
}

export function ReturnItemCard({
	form,
	index,
	isExpanded,
	onToggleExpanded,
	onRemove,
	onSelectFromMaster,
	onItemSelected,
	koudenId,
	showSelector,
	selectedIndex,
	setShowSelector,
}: ReturnItemCardProps) {
	const isFromMaster = form.watch(`return_items.${index}.isFromMaster`);

	return (
		<Card>
			<Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
				<CardHeader className="pb-2">
					<CollapsibleTrigger asChild>
						<div className="flex items-center justify-between cursor-pointer">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">返礼品 #{index + 1}</span>
								{isFromMaster && (
									<Badge variant="secondary" className="text-xs">
										<Lock className="h-3 w-3 mr-1" />
										マスター
									</Badge>
								)}
								<div className="text-sm text-muted-foreground">
									{form.watch(`return_items.${index}.name`) || "未設定"}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<div className="text-sm font-medium">
									¥
									{(
										(form.watch(`return_items.${index}.price`) || 0) *
										(form.watch(`return_items.${index}.quantity`) || 0)
									).toLocaleString()}
								</div>
								{isExpanded ? (
									<ChevronUp className="h-4 w-4" />
								) : (
									<ChevronDown className="h-4 w-4" />
								)}
							</div>
						</div>
					</CollapsibleTrigger>
				</CardHeader>
				<CollapsibleContent>
					<CardContent className="space-y-4 pt-0">
						<div className="flex justify-end gap-2 mb-4">
							{!isFromMaster && (
								<Dialog
									open={showSelector && selectedIndex === index}
									onOpenChange={(open) => {
										setShowSelector(open);
										if (!open && selectedIndex === index) setShowSelector(false);
									}}
								>
									<DialogTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={onSelectFromMaster}
											className="text-blue-600 hover:text-blue-800"
										>
											<ShoppingCart className="h-4 w-4" />
										</Button>
									</DialogTrigger>
									<DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
										<DialogHeader>
											<DialogTitle>返礼品を選択</DialogTitle>
											<DialogDescription>登録済みの返礼品から選択してください</DialogDescription>
										</DialogHeader>
										<ReturnItemSelector onSelect={onItemSelected} koudenId={koudenId} />
									</DialogContent>
								</Dialog>
							)}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={onRemove}
								className="text-destructive hover:text-destructive"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* 返礼品名 */}
							<FormField
								control={form.control}
								name={`return_items.${index}.name`}
								render={({ field }) => (
									<FormItem>
										<FormLabel>返礼品名 *</FormLabel>
										<FormControl>
											<Input
												placeholder="例: カタログギフト、お茶セット"
												{...field}
												disabled={isFromMaster}
												className={isFromMaster ? "bg-muted" : ""}
											/>
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
												disabled={isFromMaster}
												className={isFromMaster ? "bg-muted" : ""}
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
											className={`resize-none ${isFromMaster ? "bg-muted" : ""}`}
											rows={2}
											{...field}
											disabled={isFromMaster}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}
