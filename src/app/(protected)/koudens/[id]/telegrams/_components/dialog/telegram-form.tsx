"use client";
// library
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom, useSetAtom } from "jotai";
// ui
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
import { toast } from "@/hooks/use-toast";
// types
import type { Entry } from "@/types/entries";
import type { Telegram, TelegramFormValues, EditTelegramFormData } from "@/types/telegrams";
import { telegramFormSchema } from "@/schemas/telegram";
// server actions
import { createTelegram, updateTelegram } from "@/app/_actions/telegrams";
// stores
import { telegramsAtom, formSubmissionAtom } from "@/store/telegrams";
// components
import { SearchableCheckboxList } from "@/components/ui/searchable-checkbox-list";

export interface TelegramFormProps {
	koudenId: string;
	entries: Entry[];
	defaultValues?: Partial<Telegram> | null;
	onSuccess?: (telegram: Telegram) => void;
	onCancel?: () => void;
}

export function TelegramForm({
	koudenId,
	entries,
	defaultValues,
	onSuccess,
	onCancel,
}: TelegramFormProps) {
	const setTelegrams = useSetAtom(telegramsAtom);
	const [submissionState, setSubmissionState] = useAtom(formSubmissionAtom);

	const form = useForm<TelegramFormValues>({
		resolver: zodResolver(telegramFormSchema),
		defaultValues: defaultValues
			? {
					...defaultValues,
					senderName: defaultValues.senderName || "",
					senderOrganization: defaultValues.senderOrganization || null,
					senderPosition: defaultValues.senderPosition || null,
					koudenEntryId: defaultValues.koudenEntryId || null,
					message: defaultValues.message || null,
					notes: defaultValues.notes || null,
				}
			: {
					senderName: "",
					senderOrganization: null,
					senderPosition: null,
					koudenEntryId: null,
					message: null,
					notes: null,
				},
	});

	const onSubmit = async (values: TelegramFormValues) => {
		try {
			setSubmissionState({ isSubmitting: true, error: null });

			const input: EditTelegramFormData = {
				...values,
				koudenId: koudenId,
			};

			let result: Telegram | null = null;
			if (defaultValues?.id) {
				const response = await updateTelegram(defaultValues.id, input);
				result = {
					...response,
				};
				setTelegrams((prev) =>
					prev.map((telegram) => (telegram.id === result?.id ? result : telegram)),
				);
			} else {
				const response = await createTelegram(input);
				result = {
					...response,
				};
			}

			// 成功時の処理を非同期で実行
			Promise.resolve().then(() => {
				if (result) {
					onSuccess?.(result);
					toast({
						title: defaultValues ? "更新しました" : "登録しました",
						description: `${result.senderName || "送信者名未設定"}を${defaultValues ? "更新" : "登録"}しました`,
					});

					if (!defaultValues) {
						form.reset();
					}
				}
			});
		} catch (error) {
			setSubmissionState({
				isSubmitting: false,
				error: error instanceof Error ? error.message : "保存に失敗しました",
			});
			toast({
				title: "エラー",
				description: error instanceof Error ? error.message : "保存に失敗しました",
				variant: "destructive",
			});
		} finally {
			setSubmissionState((prev) => ({ ...prev, isSubmitting: false }));
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="senderName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>送信者名</FormLabel>
							<FormControl>
								<Input placeholder="例：山田太郎" {...field} value={field.value} />
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
							<FormLabel>団体名</FormLabel>
							<FormControl>
								<Input placeholder="例：株式会社〇〇" {...field} value={field.value ?? ""} />
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
								<Input placeholder="例：代表取締役" {...field} value={field.value ?? ""} />
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
							<SearchableCheckboxList
								items={entries.map((entry) => ({
									value: entry.id,
									label: entry.name || "",
								}))}
								onSelectionChange={field.onChange}
								selectedItems={field.value ? [field.value] : []}
							/>
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
								<Textarea
									placeholder="例：お見舞いに来てくださいましてありがとうございます。"
									{...field}
									value={field.value || ""}
								/>
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
								<Textarea
									placeholder="例：お見舞いに来てくださいましてありがとうございます。"
									{...field}
									value={field.value || ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-2">
					{onCancel && (
						<Button type="button" variant="outline" onClick={onCancel}>
							キャンセル
						</Button>
					)}
					<Button type="submit" disabled={submissionState.isSubmitting}>
						{submissionState.isSubmitting ? "保存中..." : defaultValues ? "更新" : "追加"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
