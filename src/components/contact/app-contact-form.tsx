"use client";

import { useForm } from "react-hook-form";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@/components/ui/form";
import { createContactRequest } from "@/app/_actions/contact";
import CategorySelect from "./category-select";
import TextField from "./text-field";
import TextArea from "./text-area";
import FileUpload from "./file-upload";
import SubmitButton from "./submit-button";
import StepIndicator from "./step-indicator";
import StepSummary from "./step-summary";
import { getPlaceholderByCategory } from "./category-placeholders";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface ContactFormValues {
	category: string;
	name: string;
	email: string;
	message: string;
	company_name?: string;
	attachment?: FileList;
}

interface AppContactFormProps {
	user: User;
	onSuccess?: () => void;
}

export default function AppContactForm({ user, onSuccess }: AppContactFormProps) {
	const form = useForm<ContactFormValues>({
		defaultValues: {
			category: "support",
			name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
			email: user.email || "",
			message: "",
			company_name: "",
			attachment: undefined,
		},
	});

	const [step, setStep] = useState(1);

	// ステップ定義
	const steps = [
		{
			title: "カテゴリ選択",
			description: "お問い合わせの種類を選択",
		},
		{
			title: "詳細入力",
			description: "問題の詳細を記入",
		},
		{
			title: "確認・送信",
			description: "内容を確認して送信",
		},
	];

	/**
	 * 次へボタン: 現在のステップの必須項目をバリデートしてから進む
	 */
	const handleNext = async () => {
		let fieldsToValidate: (keyof ContactFormValues)[] = [];

		if (step === 1) {
			fieldsToValidate = ["category"];
		} else if (step === 2) {
			fieldsToValidate = ["message"];
		}

		const valid = await form.trigger(fieldsToValidate);
		if (valid) {
			setStep(step + 1);
		}
	};

	const onSubmit = async (values: ContactFormValues) => {
		try {
			const formData = new FormData();
			for (const [key, value] of Object.entries(values)) {
				if (key === "attachment" && value instanceof FileList) {
					const file = value.item(0);
					if (file) {
						formData.append(key, file, file.name);
					}
				} else if (value != null) {
					formData.append(key, String(value));
				}
			}

			await createContactRequest(formData);

			toast.success("お問い合わせを送信しました", {
				description: "ご連絡ありがとうございます。回答をお待ちください。",
			});

			// フォームをリセット
			form.reset();
			setStep(1);

			// 成功時のコールバック実行
			onSuccess?.();
		} catch (error) {
			console.error("Failed to send contact:", error);
			toast.error("送信に失敗しました", {
				description: "しばらく時間をおいて再度お試しください。",
			});
		}
	};

	// 選択されたカテゴリに応じたプレースホルダーを取得
	const currentPlaceholder = getPlaceholderByCategory(form.watch("category"));

	// 現在のフォームデータを取得
	const formValues = form.watch();

	return (
		<Form {...form}>
			<div className="space-y-6">
				{/* ステップインジケータ */}
				<StepIndicator currentStep={step} totalSteps={steps.length} steps={steps} />

				<form
					onSubmit={form.handleSubmit(onSubmit)}
					encType="multipart/form-data"
					className="space-y-6"
				>
					{/* 前のステップの入力内容表示 */}
					<StepSummary currentStep={step} formData={formValues} />

					{step === 1 && (
						<FormField
							control={form.control}
							name="category"
							rules={{ required: "お問い合わせの種類を選択してください" }}
							render={({ field }) => (
								<FormItem>
									<FormLabel required>お問い合わせの種類</FormLabel>
									<FormControl>
										<CategorySelect {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					{step === 2 && (
						<>
							<FormField
								control={form.control}
								name="message"
								rules={{ required: "お問い合わせの内容を入力してください" }}
								render={({ field }) => (
									<FormItem>
										<FormLabel required>お問い合わせの内容</FormLabel>
										<FormControl>
											<TextArea
												{...field}
												label="お問い合わせの内容"
												placeholder={currentPlaceholder}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="attachment"
								render={({ field }) => (
									<FormItem>
										<FormLabel optional>スクリーンショット添付</FormLabel>
										<FormControl>
											<FileUpload name={field.name} onChange={field.onChange} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</>
					)}

					{step === 3 && (
						<>
							<FormField
								control={form.control}
								name="company_name"
								render={({ field }) => (
									<FormItem>
										<FormLabel optional>会社名</FormLabel>
										<FormControl>
											<TextField {...field} label="会社名（法人のお客様）" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="name"
								rules={{ required: "氏名を入力してください" }}
								render={({ field }) => (
									<FormItem>
										<FormLabel required>氏名</FormLabel>
										<FormControl>
											<TextField {...field} label="氏名" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="email"
								rules={{
									required: "メールアドレスを入力してください",
									pattern: {
										value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
										message: "正しいメールアドレスを入力してください",
									},
								}}
								render={({ field }) => (
									<FormItem>
										<FormLabel required>メールアドレス</FormLabel>
										<FormControl>
											<TextField
												{...field}
												type="email"
												label="メールアドレス"
												readOnly
												className="bg-muted/50 cursor-not-allowed"
											/>
										</FormControl>
										<div className="text-xs text-muted-foreground mt-1">
											※ ログイン中のアカウントのメールアドレスが自動入力されています
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
						</>
					)}

					<div className="flex justify-end space-x-2">
						{step > 1 && (
							<Button variant="outline" type="button" onClick={() => setStep(step - 1)}>
								戻る
							</Button>
						)}
						{step < 3 && (
							<Button type="button" onClick={handleNext}>
								次へ
							</Button>
						)}
						{step === 3 && <SubmitButton>送信</SubmitButton>}
					</div>
				</form>
			</div>
		</Form>
	);
}
