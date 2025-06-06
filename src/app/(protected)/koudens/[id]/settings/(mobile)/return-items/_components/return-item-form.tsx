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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ReturnItem } from "@/types/return-records/return-items";
import { createReturnItem, updateReturnItem } from "@/app/_actions/return-records/return-items";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
	name: z.string().min(1, "返礼品名を入力してください"),
	description: z.string().nullable(),
	price: z.coerce.number().min(0, "価格は0以上を入力してください"),
});

type Props = {
	koudenId: string;
	returnItem?: ReturnItem;
	onSuccess?: () => void;
};

export function ReturnItemForm({ koudenId, returnItem, onSuccess }: Props) {
	const { toast } = useToast();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: returnItem?.name ?? "",
			description: returnItem?.description ?? "",
			price: returnItem?.price ?? 0,
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			if (returnItem) {
				await updateReturnItem({
					id: returnItem.id,
					kouden_id: koudenId,
					...values,
				});
				toast({
					title: "返礼品を更新しました",
				});
			} else {
				await createReturnItem({
					...values,
					kouden_id: koudenId,
				});
				toast({
					title: "返礼品を作成しました",
				});
			}
			onSuccess?.();
		} catch (error) {
			console.error(error);
			toast({
				title: "エラーが発生しました",
				variant: "destructive",
			});
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>返礼品名</FormLabel>
							<FormControl>
								<Input placeholder="返礼品名を入力" {...field} />
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
								<Textarea placeholder="説明を入力" {...field} value={field.value ?? ""} />
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
								<Input type="number" placeholder="価格を入力" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" className="w-full">
					{returnItem ? "更新" : "作成"}
				</Button>
			</form>
		</Form>
	);
}
