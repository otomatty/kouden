"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PlusIcon, TrashIcon } from "lucide-react";

import type { ReturnRecord } from "@/types/return-records";
import type { DeliveryMethod } from "@/types/delivery-methods";
import type { ReturnItemMaster } from "@/types/return-records/return-item-masters";
import { createReturnRecord, updateReturnRecord } from "@/app/_actions/return-records";
import type { Entry } from "@/types/entries";

const returnRecordSchema = z.object({
	kouden_delivery_method_id: z.string().min(1, "配送方法を選択してください"),
	shipping_fee: z.number().nullable(),
	scheduled_date: z.string().nullable(),
	notes: z.string().nullable(),
	items: z.array(
		z.object({
			return_item_master_id: z.string().min(1, "返礼品を選択してください"),
			price: z.number().min(0, "0以上の数値を入力してください"),
			quantity: z.number().min(1, "1以上の数値を入力してください"),
			notes: z.string().nullable(),
		}),
	),
});

type ReturnRecordFormValues = z.infer<typeof returnRecordSchema>;

interface ReturnRecordFormProps {
	koudenId: string;
	entries: Entry[];
	deliveryMethods: DeliveryMethod[];
	returnItemMasters: ReturnItemMaster[];
	defaultValues?: ReturnRecord;
	onSuccess?: (returnRecord: ReturnRecord) => void;
}

/**
 * 返礼情報のフォームコンポーネント
 */
export function ReturnRecordForm({
	koudenId,
	deliveryMethods,
	returnItemMasters,
	defaultValues,
	onSuccess,
}: ReturnRecordFormProps) {
	const form = useForm<ReturnRecordFormValues>({
		resolver: zodResolver(returnRecordSchema),
		defaultValues: defaultValues
			? {
					kouden_delivery_method_id: defaultValues.kouden_delivery_method_id,
					shipping_fee: defaultValues.shipping_fee,
					scheduled_date: defaultValues.scheduled_date,
					notes: defaultValues.notes,
					items: defaultValues.items.map((item) => ({
						return_item_master_id: item.return_item_master_id,
						price: item.price,
						quantity: item.quantity,
						notes: item.notes,
					})),
				}
			: {
					kouden_delivery_method_id: "",
					shipping_fee: null,
					scheduled_date: null,
					notes: null,
					items: [
						{
							return_item_master_id: "",
							price: 0,
							quantity: 1,
							notes: null,
						},
					],
				},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
		rules: { minLength: 1 },
	});

	async function onSubmit(values: ReturnRecordFormValues) {
		try {
			const returnRecord = defaultValues
				? await updateReturnRecord(defaultValues.id, {
						...values,
						kouden_id: koudenId,
					})
				: await createReturnRecord();

			onSuccess?.(returnRecord);
		} catch (error) {
			console.error("[ERROR] Failed to submit return record:", error);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<ScrollArea className="h-[400px] pr-4">
					<div className="space-y-4">
						<FormField
							control={form.control}
							name="kouden_delivery_method_id"
							render={({ field }) => (
								<FormItem>
									<FormLabel>配送方法</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="配送方法を選択" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{deliveryMethods.map((method) => (
												<SelectItem key={method.id} value={method.id}>
													{method.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="shipping_fee"
							render={({ field }) => (
								<FormItem>
									<FormLabel>配送料</FormLabel>
									<FormControl>
										<Input
											type="number"
											{...field}
											value={field.value ?? ""}
											onChange={(e) =>
												field.onChange(e.target.value ? Number.parseInt(e.target.value, 10) : null)
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="scheduled_date"
							render={({ field }) => (
								<FormItem>
									<FormLabel>予定日</FormLabel>
									<FormControl>
										<Calendar
											mode="single"
											selected={field.value ? new Date(field.value) : undefined}
											onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
											className="rounded-md border"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>備考</FormLabel>
									<FormControl>
										<Textarea {...field} value={field.value || ""} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label>返礼品</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										append({
											return_item_master_id: "",
											price: 0,
											quantity: 1,
											notes: null,
										})
									}
								>
									<PlusIcon className="mr-2 h-4 w-4" />
									追加
								</Button>
							</div>

							{fields.map((field, index) => (
								<Card key={field.id}>
									<CardContent className="pt-6">
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<Label>返礼品 {index + 1}</Label>
												{index > 0 && (
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => remove(index)}
													>
														<TrashIcon className="h-4 w-4" />
													</Button>
												)}
											</div>

											<FormField
												control={form.control}
												name={`items.${index}.return_item_master_id`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>返礼品</FormLabel>
														<Select onValueChange={field.onChange} defaultValue={field.value}>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="返礼品を選択" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{returnItemMasters.map((item) => (
																	<SelectItem key={item.id} value={item.id}>
																		{item.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name={`items.${index}.price`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>金額</FormLabel>
														<FormControl>
															<Input
																type="number"
																{...field}
																onChange={(e) =>
																	field.onChange(Number.parseInt(e.target.value, 10))
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name={`items.${index}.quantity`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>数量</FormLabel>
														<FormControl>
															<Input
																type="number"
																{...field}
																onChange={(e) =>
																	field.onChange(Number.parseInt(e.target.value, 10))
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name={`items.${index}.notes`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>備考</FormLabel>
														<FormControl>
															<Textarea {...field} value={field.value || ""} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</ScrollArea>

				<div className="flex justify-end">
					<Button type="submit">保存</Button>
				</div>
			</form>
		</Form>
	);
}
