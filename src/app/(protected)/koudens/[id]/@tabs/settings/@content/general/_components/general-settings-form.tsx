"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useToast } from "@/hooks/use-toast";

// バリデーションスキーマ
const formSchema = z.object({
	title: z
		.string()
		.min(1, "タイトルを入力してください")
		.max(100, "タイトルは100文字以内で入力してください"),
	description: z.string().max(500, "説明文は500文字以内で入力してください").optional(),
});

interface GeneralSettingsFormProps {
	koudenId: string;
}

/**
 * 一般設定フォームコンポーネント
 * - 香典帳のタイトルと説明文を編集するフォーム
 */
export function GeneralSettingsForm({ koudenId }: GeneralSettingsFormProps) {
	const { toast } = useToast();

	// フォームの初期化
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: "",
		},
	});

	// フォーム送信時の処理
	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			// TODO: 香典帳の基本情報を更新するAPIを呼び出す
			console.log({ ...values, koudenId });

			toast({
				title: "設定を保存しました",
				description: "香典帳の基本情報が更新されました",
			});
		} catch (error) {
			console.error("エラーが発生しました", error);
			toast({
				title: "エラーが発生しました",
				description: "設定の保存に失敗しました",
				variant: "destructive",
			});
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>タイトル</FormLabel>
							<FormControl>
								<Input placeholder="香典帳のタイトル" {...field} />
							</FormControl>
							<FormDescription>香典帳を識別するためのタイトルです</FormDescription>
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
								<Textarea placeholder="香典帳の説明（任意）" {...field} />
							</FormControl>
							<FormDescription>香典帳の補足情報や備考を記入できます</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit">保存</Button>
			</form>
		</Form>
	);
}
