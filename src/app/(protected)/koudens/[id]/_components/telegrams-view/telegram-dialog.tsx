"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { KoudenEntry } from "@/types/kouden";
import type { Telegram } from "@/types/telegram";

const telegramFormSchema = z.object({
	senderName: z.string().min(1, "送信者名を入力してください"),
	senderOrganization: z.string().optional(),
	senderPosition: z.string().optional(),
	koudenEntryId: z.string().optional(),
	message: z.string().optional(),
	notes: z.string().optional(),
});

type TelegramFormValues = z.infer<typeof telegramFormSchema>;

interface TelegramDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	koudenEntries: KoudenEntry[];
	selectedTelegram: Telegram | null;
	onSubmit: (values: TelegramFormValues) => Promise<void>;
}

export function TelegramDialog({
	open,
	onOpenChange,
	koudenEntries,
	selectedTelegram,
	onSubmit,
}: TelegramDialogProps) {
	const form = useForm<TelegramFormValues>({
		resolver: zodResolver(telegramFormSchema),
		defaultValues: {
			senderName: selectedTelegram?.senderName || "",
			senderOrganization: selectedTelegram?.senderOrganization || "",
			senderPosition: selectedTelegram?.senderPosition || "",
			koudenEntryId: selectedTelegram?.koudenEntryId || "",
			message: selectedTelegram?.message || "",
			notes: selectedTelegram?.notes || "",
		},
	});

	const handleSubmit = async (values: TelegramFormValues) => {
		try {
			await onSubmit(values);
			form.reset();
			onOpenChange(false);
		} catch (error) {
			console.error("弔電の保存に失敗しました:", error);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{selectedTelegram ? "弔電を編集" : "弔電を追加"}
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="senderName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>送信者名 *</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="senderOrganization"
							render={({ field }) => (
								<FormItem>
									<FormLabel>所属</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="senderPosition"
							render={({ field }) => (
								<FormItem>
									<FormLabel>役職</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="koudenEntryId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>関連する香典</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="関連する香典を選択" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="">なし</SelectItem>
											{koudenEntries.map((entry) => (
												<SelectItem key={entry.id} value={entry.id}>
													{entry.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="message"
							render={({ field }) => (
								<FormItem>
									<FormLabel>メッセージ</FormLabel>
									<FormControl>
										<Textarea {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>備考</FormLabel>
									<FormControl>
										<Textarea {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								キャンセル
							</Button>
							<Button type="submit">
								{selectedTelegram ? "更新" : "追加"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
