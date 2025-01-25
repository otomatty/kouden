"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";
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
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { OfferingPhotoUploader } from "./offering-photo-uploader";
import { Label } from "@/components/ui/label";
import type { KoudenEntry } from "@/types/kouden";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formSchema, offeringFormAtom } from "./atoms";
import { useAtom } from "jotai";
import { SearchableCheckboxList } from "@/components/ui/searchable-checkbox-list";
import { useKoudenOfferings } from "@/hooks/useKoudenOfferings";

interface OfferingFormProps {
	koudenId: string;
	koudenEntries: KoudenEntry[];
	onSuccess?: () => void;
}

export function OfferingForm({
	koudenId,
	koudenEntries,
	onSuccess,
}: OfferingFormProps) {
	const { createOffering } = useKoudenOfferings(koudenId);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [photos, setPhotos] = useState<File[]>([]);
	const [currentTab, setCurrentTab] = useState("basic");
	const [savedFormState, setSavedFormState] = useAtom(offeringFormAtom);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: savedFormState || {
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
		const subscription = form.watch((value) => {
			setSavedFormState({
				...value,
				photos,
			} as z.infer<typeof formSchema> & { photos: File[] });
		});
		return () => subscription.unsubscribe();
	}, [form, photos, setSavedFormState]);

	// 保存された写真の復元
	useEffect(() => {
		if (savedFormState?.photos) {
			setPhotos(savedFormState.photos);
		}
	}, [savedFormState?.photos]);

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			setIsSubmitting(true);
			await createOffering({
				...values,
				kouden_id: koudenId,
				kouden_entry_ids: values.kouden_entry_ids,
				photos,
			});
			toast({
				title: "お供え物を追加しました",
			});
			setSavedFormState(null);
			onSuccess?.();
		} catch (error) {
			toast({
				title: "お供え物の追加に失敗しました",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
									<FormLabel>香典情報</FormLabel>
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
						<div>
							<Label>写真（任意）</Label>
							<OfferingPhotoUploader onPhotosChange={setPhotos} />
						</div>
					</TabsContent>
				</Tabs>
				<Button type="submit" className="w-full" disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					追加
				</Button>
			</form>
		</Form>
	);
}
