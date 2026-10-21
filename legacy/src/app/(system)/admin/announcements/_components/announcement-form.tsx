"use client";

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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
	title: z.string().min(1, "必須項目です"),
	content: z.string().min(1, "必須項目です"),
	category: z.enum(["system", "feature", "important", "event", "other"]),
	priority: z.enum(["low", "normal", "high", "urgent"]),
	status: z.enum(["draft", "published", "archived"]),
	publishedAt: z.string().optional(),
	expiresAt: z.string().optional(),
});

export type AnnouncementFormData = z.infer<typeof formSchema>;

interface AnnouncementFormProps {
	defaultValues?: Partial<AnnouncementFormData>;
	onSubmit: (data: AnnouncementFormData) => Promise<void>;
	submitLabel: string;
}

export function AnnouncementForm({
	defaultValues = {
		title: "",
		content: "",
		category: "other" as const,
		priority: "normal" as const,
		status: "draft" as const,
		publishedAt: "",
		expiresAt: "",
	},
	onSubmit,
	submitLabel,
}: AnnouncementFormProps) {
	const form = useForm<AnnouncementFormData>({
		resolver: zodResolver(formSchema),
		defaultValues,
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>タイトル</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormLabel>内容</FormLabel>
							<FormControl>
								<Textarea {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="category"
					render={({ field }) => (
						<FormItem>
							<FormLabel>カテゴリー</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="カテゴリーを選択" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="system">システム関連</SelectItem>
									<SelectItem value="feature">機能追加・変更</SelectItem>
									<SelectItem value="important">重要なお知らせ</SelectItem>
									<SelectItem value="event">イベント</SelectItem>
									<SelectItem value="other">その他</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="priority"
					render={({ field }) => (
						<FormItem>
							<FormLabel>優先度</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="優先度を選択" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="low">低</SelectItem>
									<SelectItem value="normal">中</SelectItem>
									<SelectItem value="high">高</SelectItem>
									<SelectItem value="urgent">緊急</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="status"
					render={({ field }) => (
						<FormItem>
							<FormLabel>ステータス</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="ステータスを選択" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="draft">下書き</SelectItem>
									<SelectItem value="published">公開</SelectItem>
									<SelectItem value="archived">アーカイブ</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="publishedAt"
					render={({ field }) => (
						<FormItem>
							<FormLabel>公開日時</FormLabel>
							<FormControl>
								<Input type="datetime-local" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="expiresAt"
					render={({ field }) => (
						<FormItem>
							<FormLabel>期限</FormLabel>
							<FormControl>
								<Input type="datetime-local" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">{submitLabel}</Button>
			</form>
		</Form>
	);
}
