"use client";

import { useRouter } from "next/navigation";
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
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Router from "next/router";

interface ContactFormValues {
	category: string;
	name?: string;
	email: string;
	message: string;
	company_name?: string;
	attachment?: FileList;
}

export default function ContactForm() {
	const router = useRouter();
	const form = useForm<ContactFormValues>({
		defaultValues: {
			category: "support",
			name: "",
			email: "",
			message: "",
			company_name: "",
			attachment: undefined,
		},
	});

	const [step, setStep] = useState(1);

	// フォームが変更されているとき、ページ遷移やリロードを防ぐための確認
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (form.formState.isDirty) {
				e.preventDefault();
				// returnValue assignment is deprecated and not required by modern browsers
			}
		};
		window.addEventListener("beforeunload", handleBeforeUnload);

		const handleRouteChange = () => {
			if (form.formState.isDirty) {
				// ユーザーに確認
				if (!confirm("入力内容が消えてしまいますが、よろしいですか？")) {
					Router.events.emit("routeChangeError");
					// ルート変更を中止
					throw "Abort route change by user";
				}
			}
		};
		Router.events.on("routeChangeStart", handleRouteChange);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			Router.events.off("routeChangeStart", handleRouteChange);
		};
	}, [form.formState.isDirty]);

	/**
	 * 次へボタン: 現在のステップの必須項目をバリデートしてから進む
	 */
	const handleNext = async () => {
		if (step === 1) {
			// カテゴリは必須
			const valid = await form.trigger("category");
			if (valid) setStep(step + 1);
		} else if (step === 2) {
			// 詳細内容は必須
			const valid = await form.trigger("message");
			if (valid) setStep(step + 1);
		}
	};

	const onSubmit = async (values: ContactFormValues) => {
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
		router.push("/contact/success");
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				encType="multipart/form-data"
				className="space-y-4 max-w-4xl mx-auto p-4 rounded-lg mb-12"
			>
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
							rules={{ required: "詳細内容を入力してください" }}
							render={({ field }) => (
								<FormItem>
									<FormLabel required>詳細内容</FormLabel>
									<FormControl>
										<TextArea {...field} label="詳細内容" />
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
							render={({ field }) => (
								<FormItem>
									<FormLabel required>メールアドレス</FormLabel>
									<FormControl>
										<TextField {...field} type="email" label="メールアドレス" />
									</FormControl>
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
		</Form>
	);
}
