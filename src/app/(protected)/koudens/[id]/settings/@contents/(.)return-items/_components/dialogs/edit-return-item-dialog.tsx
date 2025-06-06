"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ReturnItem } from "@/types/return-records";
import { createReturnItem, updateReturnItem } from "@/app/_actions/return-records/return-items";

// バリデーションスキーマ
const returnItemSchema = z.object({
	name: z.string().min(1, "返礼品名を入力してください"),
	description: z.string().nullable(),
	price: z.coerce
		.number()
		.min(0, "価格は0以上で入力してください")
		.max(9999999, "価格が大きすぎます"),
});

type ReturnItemFormData = z.infer<typeof returnItemSchema>;

interface EditReturnItemDialogProps {
	koudenId: string;
	returnItem: ReturnItem | null;
	onClose: () => void;
	open?: boolean;
}

/**
 * 返礼品編集ダイアログ
 * - 返礼品の新規作成・編集フォームを提供
 */
export function EditReturnItemDialog({
	koudenId,
	returnItem,
	onClose,
	open,
}: EditReturnItemDialogProps) {
	const { toast } = useToast();
	const form = useForm<ReturnItemFormData>({
		resolver: zodResolver(returnItemSchema),
		defaultValues: {
			name: returnItem?.name ?? "",
			description: returnItem?.description ?? "",
			price: returnItem?.price ?? 0,
		},
	});

	const onSubmit = async (data: ReturnItemFormData) => {
		try {
			// 送信中の状態を管理
			form.reset({}, { keepValues: true });
			const submitData = {
				name: data.name.trim(),
				description: data.description?.trim() || null,
				price: Number(data.price),
				kouden_id: koudenId,
			};

			if (returnItem) {
				// 更新
				await updateReturnItem({
					id: returnItem.id,
					name: submitData.name,
					description: submitData.description,
					price: submitData.price,
					kouden_id: koudenId,
				});
				toast({
					title: "返礼品を更新しました",
					description: `${submitData.name}の情報を更新しました。`,
				});
			} else {
				// 新規作成
				await createReturnItem({
					...submitData,
					kouden_id: koudenId,
				});
				toast({
					title: "返礼品を作成しました",
					description: `${submitData.name}を追加しました。`,
				});
			}
			form.reset(); // フォームをリセット
			onClose();
		} catch (error) {
			console.error("[Client] Error in onSubmit:", error);
			// フォームの状態を復元
			form.reset({}, { keepValues: true });

			if (error instanceof Error) {
				console.error("[Client] Error details:", {
					message: error.message,
					stack: error.stack,
				});
				toast({
					title: "エラーが発生しました",
					description: error.message,
					variant: "destructive",
				});
			} else {
				toast({
					title: "エラーが発生しました",
					description: "予期せぬエラーが発生しました。もう一度お試しください。",
					variant: "destructive",
				});
			}
		}
	};

	return (
		<Dialog open={open ?? !!returnItem} onOpenChange={() => onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{returnItem ? "返礼品を編集" : "返礼品を追加"}</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>返礼品名</FormLabel>
									<FormControl>
										<Input {...field} placeholder="返礼品名を入力" />
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
									<FormLabel>説明</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											value={field.value ?? ""}
											placeholder="返礼品の説明を入力"
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
										<Input {...field} type="number" min={0} placeholder="価格を入力" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end space-x-2">
							<Button type="button" variant="outline" onClick={() => onClose()}>
								キャンセル
							</Button>
							<Button type="submit">保存</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

// 型定義のエクスポート
export type { EditReturnItemDialogProps };
