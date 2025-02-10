"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { handleDeliveryMethodsSubmit } from "@/app/_actions/return-records/delivery-methods-form";

const formSchema = z.object({
	deliveryMethods: z.array(z.string()).min(1, "配送方法を1つ以上設定してください"),
});

type DeliveryMethodsFormProps = {
	koudenId: string;
	initialData?: string[];
};

export function DeliveryMethodsForm({ koudenId, initialData = [] }: DeliveryMethodsFormProps) {
	const { toast } = useToast();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			deliveryMethods: initialData,
		},
	});

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			const result = await handleDeliveryMethodsSubmit(koudenId, values.deliveryMethods);

			if (result.success) {
				toast({
					title: "設定を保存しました",
					description: "配送方法の設定が更新されました",
				});
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			console.error(error);
			toast({
				title: "エラーが発生しました",
				description: error instanceof Error ? error.message : "設定の保存に失敗しました",
				variant: "destructive",
			});
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="deliveryMethods"
					render={({ field }) => (
						<FormItem>
							<FormLabel>配送方法</FormLabel>
							<FormDescription>
								返礼品の配送方法を設定します。複数の配送方法を設定できます。
							</FormDescription>
							<FormControl>
								<div className="space-y-2">
									{field.value.map((method, index) => (
										<div key={method} className="flex items-center gap-2">
											<Input
												value={method}
												onChange={(e) => {
													const newMethods = [...field.value];
													newMethods[index] = e.target.value;
													field.onChange(newMethods);
												}}
											/>
											<Button
												type="button"
												variant="destructive"
												size="sm"
												onClick={() => {
													const newMethods = field.value.filter((_, i) => i !== index);
													field.onChange(newMethods);
												}}
											>
												削除
											</Button>
										</div>
									))}
								</div>
							</FormControl>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									field.onChange([...field.value, ""]);
								}}
							>
								配送方法を追加
							</Button>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">保存</Button>
			</form>
		</Form>
	);
}
