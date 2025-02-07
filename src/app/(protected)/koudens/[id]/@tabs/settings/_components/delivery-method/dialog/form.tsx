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
	createDeliveryMethod,
	updateDeliveryMethod,
} from "@/app/_actions/return-records/delivery-methods";
import type { DeliveryMethod } from "@/types/return-records/delivery-methods";
import type { DeliveryMethodFormData } from "../types";

const formSchema = z.object({
	name: z
		.string()
		.min(1, { message: "配送方法の名称は必須です" })
		.max(50, { message: "配送方法の名称は50文字以内で入力してください" }),
	description: z.string().max(200, { message: "説明は200文字以内で入力してください" }).optional(),
});

type DeliveryMethodFormValues = z.infer<typeof formSchema>;

interface DeliveryMethodFormProps {
	koudenId: string;
	defaultValues?: Partial<DeliveryMethodFormValues>;
	onSubmit: (values: DeliveryMethodFormValues) => Promise<void>;
	isSubmitting?: boolean;
}

export function DeliveryMethodForm({ defaultValues, onSubmit }: DeliveryMethodFormProps) {
	const form = useForm<DeliveryMethodFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
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
							<FormLabel>配送方法の名称</FormLabel>
							<FormControl>
								<Input placeholder="例：宅配便、メール便、直接お渡し" {...field} />
							</FormControl>
							<FormDescription>返礼品の配送方法を表す名称を入力してください</FormDescription>
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
									placeholder="この配送方法に関する補足説明があれば入力してください"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button type="submit">{defaultValues ? "更新" : "追加"}</Button>
				</div>
			</form>
		</Form>
	);
}

export type { DeliveryMethodFormProps, DeliveryMethodFormValues };
