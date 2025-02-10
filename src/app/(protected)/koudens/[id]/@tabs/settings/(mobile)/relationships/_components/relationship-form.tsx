"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Relationship } from "@/types/relationships";

const formSchema = z.object({
	name: z.string().min(1, "関係性の名称を入力してください"),
	description: z.string().nullable().optional(),
	is_default: z.boolean().default(false),
});

export type RelationshipFormValues = z.infer<typeof formSchema>;

interface RelationshipFormProps {
	koudenId: string;
	defaultValues?: Partial<Relationship>;
	onSubmit: (values: RelationshipFormValues) => Promise<void>;
	isSubmitting?: boolean;
}

export function RelationshipForm({
	defaultValues,
	onSubmit,
	isSubmitting = false,
}: RelationshipFormProps) {
	const form = useForm<RelationshipFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
			is_default: false,
			...defaultValues,
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>関係性の名称</FormLabel>
							<FormControl>
								<Input placeholder="例：親族、友人、会社関係" {...field} />
							</FormControl>
							<FormDescription>
								香典帳における故人との関係性を表す名称を入力してください
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
									placeholder="この関係性に関する補足説明があれば入力してください"
									{...field}
									value={field.value ?? ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="is_default"
					render={({ field }) => (
						<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
							<div className="space-y-0.5">
								<FormLabel>デフォルト設定</FormLabel>
								<FormDescription>この関係性をデフォルトとして設定します</FormDescription>
							</div>
							<FormControl>
								<Switch checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={isSubmitting} className="w-full">
					{isSubmitting ? "保存中..." : "保存"}
				</Button>
			</form>
		</Form>
	);
}
