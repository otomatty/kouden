"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
	createReturnItemMaster,
	updateReturnItemMaster,
} from "@/app/_actions/return-records/return-item-masters";
import type { ReturnItemMaster } from "@/types/return-records/return-item-masters";

// バリデーションスキーマ
const formSchema = z.object({
	name: z
		.string()
		.min(1, { message: "返礼品名は必須です" })
		.max(50, { message: "返礼品名は50文字以内で入力してください" }),
	description: z.string().max(200, { message: "説明は200文字以内で入力してください" }).optional(),
	price: z.coerce
		.number()
		.min(0, { message: "価格は0以上で入力してください" })
		.max(1000000, { message: "価格は100万円以下で入力してください" }),
});

// フォームの型定義
type ReturnItemMasterFormValues = z.infer<typeof formSchema>;

interface ReturnItemMasterFormProps {
	koudenId: string;
	defaultValues?: Partial<ReturnItemMasterFormValues>;
	onSubmit?: (values: ReturnItemMasterFormValues) => Promise<void>;
	onCancel: () => void;
	isSubmitting?: boolean;
}

/**
 * 返礼品マスタ設定のフォームコンポーネント
 * - 返礼品名（必須）
 * - 説明（任意）
 * - 価格（必須）
 * を入力・編集できるフォーム
 */
export function ReturnItemMasterForm({
	koudenId,
	defaultValues,
	onSubmit: onSubmitProp,
	onCancel,
	isSubmitting = false,
}: ReturnItemMasterFormProps) {
	const form = useForm<ReturnItemMasterFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
			price: 0,
			...defaultValues,
		},
	});

	const onSubmit = async (data: ReturnItemMasterFormValues) => {
		try {
			if (defaultValues?.name) {
				// 更新
				await updateReturnItemMaster({
					id: (defaultValues as ReturnItemMaster).id,
					kouden_id: koudenId,
					...data,
				});
				toast({
					title: "返礼品を更新しました",
				});
			} else {
				// 新規作成
				await createReturnItemMaster({
					kouden_id: koudenId,
					...data,
					description: data.description ?? null,
				});
				toast({
					title: "返礼品を追加しました",
				});
			}
			onSubmitProp?.(data);
		} catch (error) {
			toast({
				title: defaultValues?.name ? "返礼品の更新に失敗しました" : "返礼品の追加に失敗しました",
				description: "エラーが発生しました",
			});
			console.error(error);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>返礼品名</FormLabel>
							<FormControl>
								<Input placeholder="例：線香、ろうそく、お供え物" {...field} />
							</FormControl>
							<FormDescription>
								香典返しとして使用する返礼品の名称を入力してください
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>説明</FormLabel>
							<FormControl>
								<Textarea
									placeholder="この返礼品に関する補足説明があれば入力してください"
									className="resize-none"
									{...field}
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
							<FormLabel>価格</FormLabel>
							<FormControl>
								<Input
									type="number"
									placeholder="返礼品の価格を入力"
									{...field}
									onChange={(e) => field.onChange(e.target.valueAsNumber)}
								/>
							</FormControl>
							<FormDescription>返礼品の価格を円単位で入力してください</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button type="button" variant="outline" onClick={onCancel}>
						キャンセル
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "保存中..." : defaultValues?.name ? "更新" : "追加"}
					</Button>
				</div>
			</form>
		</Form>
	);
}

// 型定義のエクスポート
export type { ReturnItemMasterFormProps, ReturnItemMasterFormValues };
