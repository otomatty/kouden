"use client";

import { useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { MemberRole } from "@/types/sharing";

const formSchema = z.object({
	email: z.string().email("有効なメールアドレスを入力してください"),
	role: z.enum(["viewer", "editor"] as const),
});

interface InviteMemberFormProps {
	koudenId: string;
}

export function InviteMemberForm({ koudenId }: InviteMemberFormProps) {
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			role: "viewer" as MemberRole,
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setLoading(true);
		try {
			const response = await fetch("/api/koudens/invite", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					koudenId,
					email: values.email,
					role: values.role,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "招待に失敗しました");
			}

			toast({
				title: "成功",
				description: "招待メールを送信しました",
			});
			form.reset();
		} catch (error) {
			toast({
				title: "エラー",
				description:
					error instanceof Error ? error.message : "招待に失敗しました",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>メールアドレス</FormLabel>
							<FormControl>
								<Input placeholder="user@example.com" {...field} />
							</FormControl>
							<FormDescription>
								招待したいユーザーのメールアドレスを入力してください
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="role"
					render={({ field }) => (
						<FormItem>
							<FormLabel>権限</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="権限を選択" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="viewer">閲覧者</SelectItem>
									<SelectItem value="editor">編集者</SelectItem>
								</SelectContent>
							</Select>
							<FormDescription>
								閲覧者は閲覧のみ、編集者は編集も可能です
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={loading}>
					{loading ? "送信中..." : "招待する"}
				</Button>
			</form>
		</Form>
	);
}
