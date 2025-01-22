"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createOffering } from "@/app/_actions/offerings";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { OfferingPhotoUploader } from "./offering-photo-uploader";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
	type: z.enum(["FLOWER", "FOOD", "OTHER"], {
		required_error: "種類を選択してください",
	}),
	description: z.string().min(1, "内容を入力してください"),
	quantity: z.coerce
		.number()
		.min(1, "数量は1以上を入力してください")
		.max(999, "数量は999以下を入力してください"),
	price: z.coerce
		.number()
		.min(0, "金額は0以上を入力してください")
		.max(9999999, "金額は9,999,999以下を入力してください")
		.optional(),
	provider_name: z.string().min(1, "提供者名を入力してください"),
	notes: z.string().optional(),
});

interface OfferingFormProps {
	koudenEntryId: string;
	onSuccess?: () => void;
}

export function OfferingForm({ koudenEntryId, onSuccess }: OfferingFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [photos, setPhotos] = useState<File[]>([]);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			type: undefined,
			description: "",
			quantity: 1,
			price: undefined,
			provider_name: "",
			notes: undefined,
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			setIsSubmitting(true);
			await createOffering({
				...values,
				kouden_entry_id: koudenEntryId,
				photos,
			});
			toast({
				title: "お供え物を追加しました",
			});
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
				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>種類</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
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
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>内容</FormLabel>
							<FormControl>
								<Input placeholder="例：胡蝶蘭" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
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
										field.onChange(value === "" ? undefined : Number(value));
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
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
				<Button type="submit" className="w-full" disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					追加
				</Button>
			</form>
		</Form>
	);
}
