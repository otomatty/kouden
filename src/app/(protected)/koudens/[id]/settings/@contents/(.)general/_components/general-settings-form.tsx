"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { updateKouden } from "@/app/_actions/koudens";

const formSchema = z.object({
	title: z.string().min(1, "香典帳のタイトルを入力してください"),
	description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GeneralSettingsFormProps {
	koudenId: string;
	defaultValues: FormValues;
}

/**
 * 一般設定フォームコンポーネント
 * - 香典帳のタイトルと説明を編集するフォーム
 * - フォームの状態管理とバリデーションを担当
 */
export function GeneralSettingsForm({ koudenId, defaultValues }: GeneralSettingsFormProps) {
	const [isPending, startTransition] = useTransition();
	const { toast } = useToast();
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues,
	});

	const onSubmit = (values: FormValues) => {
		startTransition(async () => {
			try {
				await updateKouden(koudenId, values);
				toast({
					title: "設定を保存しました",
				});
			} catch (error) {
				console.error(error);
				toast({
					title: "設定の保存に失敗しました",
					description: "もう一度試してください",
				});
			}
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>基本情報</CardTitle>
				<CardDescription>香典帳のタイトルや説明文を設定します</CardDescription>
			</CardHeader>
			<CardContent>
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
										<Textarea
											placeholder="香典帳の説明（任意）"
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormDescription>香典帳の補足情報や備考を記入できます</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end">
							<Button type="submit" disabled={isPending}>
								{isPending ? "保存中..." : "保存"}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
