"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "@/components/ui/button";
import { PlanSelector } from "@/components/custom/plan-selector";
import { purchaseKouden } from "@/app/_actions/purchaseKouden";
import { createKoudenWithPlan } from "@/app/_actions/koudens/create";
import {
	newKoudenPlanSelectorSchema,
	type NewKoudenPlanSelectorFormData,
} from "@/schemas/plan-selector";
import type { Plan } from "@/types/plan-selector";

interface NewKoudenPlanSelectorProps {
	plans: Plan[];
	userId: string;
}

/**
 * 新規香典帳作成用のプラン選択フォームコンポーネント
 * 香典帳の基本情報とプラン選択を統合したフォーム
 */
export function NewKoudenPlanSelector({ plans, userId }: NewKoudenPlanSelectorProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const form = useForm<NewKoudenPlanSelectorFormData>({
		resolver: zodResolver(newKoudenPlanSelectorSchema),
		defaultValues: {
			title: "",
			description: "",
			planCode: plans[0]?.code || "",
			expectedCount: undefined,
		},
	});

	const selectedPlanCode = form.watch("planCode");
	const expectedCount = form.watch("expectedCount");

	const handleSubmit = async (data: NewKoudenPlanSelectorFormData) => {
		setLoading(true);
		try {
			if (data.planCode === "free") {
				const { koudenId, error } = await createKoudenWithPlan({
					userId,
					title: data.title,
					description: data.description || undefined,
					planCode: data.planCode,
					expectedCount: data.expectedCount,
				});
				if (error) throw new Error(error);
				router.push(`/koudens/${koudenId}/entries`);
			} else {
				// 有料プランの場合は購入処理へ
				const koudenId = crypto.randomUUID();
				const { url, error } = await purchaseKouden({
					koudenId,
					planCode: data.planCode,
					expectedCount: data.planCode === "premium_full_support" ? data.expectedCount : undefined,
					title: data.title,
					description: data.description || undefined,
					cancelPath: "/koudens/new",
				});
				if (error) throw new Error(error);
				if (url) {
					window.location.href = url;
				} else {
					throw new Error("購入URLが取得できませんでした");
				}
			}
		} catch (err) {
			console.error("[ERROR] 作成エラー:", err);
			// TODO: user feedback with toast
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col min-h-[calc(100vh-200px)]">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="flex-1 space-y-6">
					{/* 香典帳の基本情報 */}
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>タイトル</FormLabel>
								<FormControl>
									<Input {...field} placeholder="例：〇〇家 告別式" className="bg-background" />
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
								<FormLabel optional>説明</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="説明を入力してください"
										className="bg-background"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* プラン選択 */}
					<PlanSelector
						plans={plans}
						selectedPlan={selectedPlanCode}
						expectedCount={expectedCount}
						mode="create"
						onPlanChange={(planCode) => form.setValue("planCode", planCode)}
						onExpectedCountChange={(count) => form.setValue("expectedCount", count)}
						loading={loading}
						disabled={loading}
					/>

					{/* デスクトップ用ボタン */}
					<div className="hidden sm:flex justify-end">
						<Button type="submit" disabled={loading} className="w-full sm:w-auto">
							{loading ? "処理中..." : selectedPlanCode === "free" ? "作成する" : "購入に進む"}
						</Button>
					</div>
				</form>

				{/* モバイル用スティッキーボタン */}
				<div className="sticky bottom-0 mt-6 p-4 sm:hidden -mx-4">
					<Button
						type="submit"
						disabled={loading}
						className="w-full"
						onClick={form.handleSubmit(handleSubmit)}
					>
						{loading ? "処理中..." : selectedPlanCode === "free" ? "作成する" : "購入に進む"}
					</Button>
				</div>
			</Form>
		</div>
	);
}
