"use client";

import * as React from "react";
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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TypeOption {
	id: string;
	name: string;
}
interface Props {
	types: TypeOption[];
}
type FormValues = { name: string; typeId: string };

export default function OrganizationRequestForm({ types }: Props) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const form = useForm<FormValues>({
		defaultValues: {
			name: "",
			typeId: types[0]?.id || "",
		},
	});

	// Validate that types are available
	if (!types || types.length === 0) {
		return (
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle>法人アカウント申請</CardTitle>
					<CardDescription>組織種別の情報が取得できませんでした</CardDescription>
				</CardHeader>
				<div className="p-6">
					<Alert>
						<AlertDescription>
							組織種別のデータが利用できません。ページを再読み込みするか、管理者にお問い合わせください。
						</AlertDescription>
					</Alert>
				</div>
			</Card>
		);
	}

	async function onSubmit(data: FormValues) {
		setIsSubmitting(true);
		setError(null);

		try {
			const res = await fetch("/api/organizations/request", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({ message: "不明なエラーが発生しました" }));
				throw new Error(errorData.message || `リクエストが失敗しました (${res.status})`);
			}

			router.push("/organizations/request/success");
		} catch (err) {
			console.error("Request failed:", err);
			setError(err instanceof Error ? err.message : "リクエストの送信に失敗しました");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Form {...form}>
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle>法人アカウント申請</CardTitle>
					<CardDescription>必要事項を入力して申請してください</CardDescription>
				</CardHeader>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<FormField
						control={form.control}
						name="name"
						rules={{ required: "組織名は必須です" }}
						render={({ field }) => (
							<FormItem>
								<FormLabel required>組織名</FormLabel>
								<FormControl>
									<Input placeholder="組織名を入力" {...field} disabled={isSubmitting} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="typeId"
						rules={{ required: "種別は必須です" }}
						render={({ field }) => (
							<FormItem>
								<FormLabel required>種別</FormLabel>
								<FormControl>
									<Select
										defaultValue={field.value}
										onValueChange={field.onChange}
										disabled={isSubmitting}
									>
										<SelectTrigger>
											<SelectValue placeholder="種別を選択" />
										</SelectTrigger>
										<SelectContent>
											{types.map((t) => (
												<SelectItem key={t.id} value={t.id}>
													{t.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="w-full" disabled={isSubmitting}>
						{isSubmitting ? "送信中..." : "リクエスト送信"}
					</Button>
				</form>
			</Card>
		</Form>
	);
}
