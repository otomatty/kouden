"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { useAtom } from "jotai";
// UIコンポーネント
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
// 型定義
import type { KoudenEntry } from "@/types/kouden";
import type { Offering, OfferingType, BaseOffering } from "@/types/offering";
// Server Actions
import { createOffering, updateOffering } from "@/app/_actions/offerings";
// 状態管理
import { formSchema, offeringFormAtom } from "./atoms";
// カスタムコンポーネント
import { OfferingPhotoUploader } from "./offering-photo-uploader";
import { SearchableCheckboxList } from "@/components/ui/searchable-checkbox-list";

interface OfferingFormProps {
	koudenId: string;
	koudenEntries: KoudenEntry[];
	defaultValues?: BaseOffering;
	onSuccess?: (offering: Offering) => void;
	onCancel?: () => void;
}

export function OfferingForm({
	koudenId,
	koudenEntries,
	defaultValues,
	onSuccess,
	onCancel,
}: OfferingFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [photos, setPhotos] = useState<File[]>([]);
	const [currentTab, setCurrentTab] = useState("basic");
	const [savedFormState, setSavedFormState] = useAtom(offeringFormAtom);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: defaultValues
			? {
					type: defaultValues.type as z.infer<typeof formSchema>["type"],
					description: defaultValues.description || undefined,
					quantity: defaultValues.quantity,
					price: defaultValues.price || undefined,
					provider_name: defaultValues.provider_name,
					notes: defaultValues.notes || undefined,
					kouden_entry_ids: [],
				}
			: savedFormState || {
					type: undefined,
					description: "",
					quantity: 1,
					price: undefined,
					provider_name: "",
					notes: undefined,
					kouden_entry_ids: [],
				},
	});

	// フォームの値が変更されたときに状態を保存
	useEffect(() => {
		if (!defaultValues) {
			const subscription = form.watch((value) => {
				setSavedFormState({
					...value,
					photos,
				} as z.infer<typeof formSchema> & { photos: File[] });
			});
			return () => subscription.unsubscribe();
		}
	}, [form, photos, setSavedFormState, defaultValues]);

	// 保存された写真の復元
	useEffect(() => {
		if (!defaultValues && savedFormState?.photos) {
			setPhotos(savedFormState.photos);
		}
	}, [savedFormState?.photos, defaultValues]);

	async function onSubmit(values: z.infer<typeof formSchema>) {
		console.log("[DEBUG] Form submission started");
		console.log("[DEBUG] Values:", values);
		console.log("[DEBUG] KoudenId:", koudenId);
		console.log("[DEBUG] Selected entries:", values.kouden_entry_ids);
		console.log("[DEBUG] Photos:", photos);

		try {
			setIsSubmitting(true);
			console.log("[DEBUG] Setting isSubmitting to true");
			let result: Offering;

			if (defaultValues?.id) {
				// 更新の場合
				console.log("[DEBUG] Updating offering:", defaultValues.id);
				const response = await updateOffering(defaultValues.id, {
					...values,
					kouden_id: koudenId,
				});
				console.log("[DEBUG] Update response:", response);
				result = {
					...response,
					type: response.type as OfferingType,
					offering_photos: [],
					offering_entries: [],
				};
			} else {
				// 新規作成の場合
				console.log(
					"[DEBUG] Creating new offering with photos:",
					photos.length,
				);
				const response = await createOffering({
					...values,
					kouden_id: koudenId,
				});
				console.log("[DEBUG] Create response:", response);
				result = {
					...response,
					type: response.type as OfferingType,
					offering_photos: [],
					offering_entries: [],
				};
			}

			console.log("[DEBUG] Final result:", result);

			toast({
				title: defaultValues
					? "お供え物を更新しました"
					: "お供え物を追加しました",
			});

			if (!defaultValues) {
				setSavedFormState(null);
			}

			onSuccess?.(result);
		} catch (error) {
			console.error("[ERROR] Failed to save offering:", error);
			toast({
				title: defaultValues
					? "お供え物の更新に失敗しました"
					: "お供え物の追加に失敗しました",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	console.log("[DEBUG] Form state:", {
		isSubmitting,
		currentValues: form.getValues(),
		formErrors: form.formState.errors,
	});

	return (
		<Form {...form}>
			<form
				onSubmit={async (e) => {
					e.preventDefault();
					console.log("[DEBUG] Form submit event triggered");

					const values = form.getValues();
					console.log("[DEBUG] Form values before validation:", values);

					const isValid = await form.trigger();
					console.log("[DEBUG] Form validation result:", isValid);

					if (!isValid) {
						console.log(
							"[DEBUG] Form validation errors:",
							form.formState.errors,
						);
						return;
					}

					console.log("[DEBUG] Calling onSubmit with values:", values);
					await onSubmit(values);
				}}
				className="space-y-4"
			>
				<Tabs
					value={currentTab}
					onValueChange={setCurrentTab}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="basic">基本情報</TabsTrigger>
						<TabsTrigger value="additional">追加情報</TabsTrigger>
					</TabsList>
					<TabsContent value="basic" className="space-y-4">
						<FormField
							control={form.control}
							name="provider_name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>提供者名</FormLabel>
									<FormControl>
										<Input placeholder="例：山田太郎" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>種類</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="種類を選択" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="FLOWER">供花</SelectItem>
											<SelectItem value="FOOD">供物</SelectItem>
											<SelectItem value="OTHER">その他</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="kouden_entry_ids"
							render={({ field }) => (
								<FormItem>
									<FormLabel>香典情報（任意）</FormLabel>
									<FormControl>
										<SearchableCheckboxList
											items={koudenEntries.map((entry) => ({
												value: entry.id,
												label: entry.name || entry.organization || "名前なし",
											}))}
											selectedItems={field.value}
											onSelectionChange={field.onChange}
											searchPlaceholder="香典情報を検索..."
											className="w-full"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>内容（任意）</FormLabel>
									<FormControl>
										<Input
											placeholder="例：胡蝶蘭"
											{...field}
											value={field.value ?? ""}
											onChange={(e) => {
												const value = e.target.value;
												field.onChange(value === "" ? undefined : value);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="price"
							render={({ field }) => (
								<FormItem>
									<FormLabel>金額（任意）</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={0}
											max={9999999}
											placeholder="例：10000"
											{...field}
											value={field.value ?? ""}
											onChange={(e) => {
												const value = e.target.value;
												field.onChange(
													value === "" ? undefined : Number(value),
												);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</TabsContent>
					<TabsContent value="additional" className="space-y-4">
						<FormField
							control={form.control}
							name="quantity"
							render={({ field }) => (
								<FormItem>
									<FormLabel>数量</FormLabel>
									<FormControl>
										<Input type="number" min={1} max={999} {...field} />
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
									<FormLabel>備考（任意）</FormLabel>
									<FormControl>
										<Textarea
											placeholder="備考を入力"
											{...field}
											value={field.value ?? ""}
											onChange={(e) => {
												const value = e.target.value;
												field.onChange(value === "" ? undefined : value);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{!defaultValues && (
							<div>
								<Label>写真（任意）</Label>
								<OfferingPhotoUploader onPhotosChange={setPhotos} />
							</div>
						)}
					</TabsContent>
				</Tabs>
				<div className="flex justify-end gap-2">
					{onCancel && (
						<Button type="button" variant="outline" onClick={onCancel}>
							キャンセル
						</Button>
					)}
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{defaultValues ? "保存" : "追加"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
