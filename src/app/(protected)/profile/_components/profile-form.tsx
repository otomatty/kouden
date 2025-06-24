"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { updateProfile } from "@/app/_actions/profiles";

const formSchema = z.object({
	display_name: z
		.string()
		.min(1, "表示名は必須です")
		.max(50, "表示名は50文字以内で入力してください"),
});

interface ProfileFormProps {
	userId: string;
	initialData: {
		display_name: string;
	};
}

export function ProfileForm({ userId, initialData }: ProfileFormProps) {
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: initialData,
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			setIsPending(true);
			const { error } = await updateProfile(userId, values);

			if (error) {
				throw new Error(error);
			}

			toast.success("プロフィールを更新しました");
			router.refresh();
		} catch (error) {
			toast.error("エラー", {
				description: error instanceof Error ? error.message : "プロフィールの更新に失敗しました",
			});
		} finally {
			setIsPending(false);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="display_name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>表示名</FormLabel>
							<FormControl>
								<Input placeholder="表示名を入力" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={isPending}>
					{isPending ? "更新中..." : "更新"}
				</Button>
			</form>
		</Form>
	);
}
